import time
import json
from typing import Annotated, TypedDict, Dict, Any, List

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import (
    SystemMessage, HumanMessage, AIMessage, ToolMessage
)

from app.core.llm import get_llm
from app.agent.prompts import SYSTEM_PROMPT
from app.mcp.server import PortfolioMCPServer


class AgentState(TypedDict):
    """Type-safe state schema for the LangGraph agent."""
    messages: Annotated[list, add_messages]
    provider: str
    model: str
    temperature: float
    context: str            # Document chunks retrieved from RAG layer
    portfolio_assets: List[Dict[str, Any]]  # Raw asset list from parser
    metrics: Dict[str, Any]  # Performance data: response time, model used


def call_model(state: AgentState) -> Dict[str, Any]:
    """
    Binds the appropriate LLM based on state parameters, loads tool
    manifests, and executes the call.
    """
    provider = state.get("provider", "ollama")
    model_name = state.get("model", "llama3.2")
    temp = state.get("temperature", 0.2)
    context = state.get("context", "")
    portfolio_assets = state.get("portfolio_assets", [])

    # 1. Get LLM instance from the factory
    llm = get_llm(provider=provider, model=model_name, temperature=temp)

    # Bind MCP tool schemas for function calling
    # NOTE: Some models like gemma3 do not support tool calling
    tools = PortfolioMCPServer.get_available_tools()
    if hasattr(llm, "bind_tools"):
        try:
            llm_with_tools = llm.bind_tools(tools)
        except Exception:
            print(
                f"[WARN] {model_name} bind_tools failed, "
                f"continuing without tools."
            )
            llm_with_tools = llm
    else:
        llm_with_tools = llm

    # 2. Inject system prompt and RAG context
    enriched_prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"[PORTFOLIO RAG CONTEXT]:\n{context}\n\n"
        f"[PARSED ASSET LIST]:\n"
        f"{json.dumps(portfolio_assets)}"
    )

    messages = [SystemMessage(content=enriched_prompt)] + state["messages"]

    # 3. Call LLM with timing (for benchmark metrics)
    start_time = time.time()
    try:
        response = llm_with_tools.invoke(messages)
    except Exception as e:
        err_msg = str(e)
        if (
            "does not support tools" in err_msg
            or "status code: 400" in err_msg
        ):
            print(
                f"[WARN] {model_name} does not support tool calling, "
                f"retrying without tools..."
            )
            response = llm.invoke(messages)
        else:
            raise
    elapsed_time = round(time.time() - start_time, 2)

    current_metrics = state.get("metrics") or {}
    current_metrics.update({
        "response_time_sec": elapsed_time,
        "provider_used": provider,
        "model_used": model_name
    })

    return {"messages": [response], "metrics": current_metrics}


def execute_tools(state: AgentState) -> Dict[str, Any]:
    """
    If the LLM decided to call a tool, autonomously executes the
    corresponding MCP tool.
    """
    last_message = state["messages"][-1]
    tool_outputs = []

    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        for tool_call in last_message.tool_calls:
            tool_name = tool_call["name"]
            tool_args = tool_call["args"]

            print(f"[MCP Tool] Autonomous Agent Triggering: {tool_name}")

            if tool_name == "calculate_portfolio_risk":
                # If LLM didn't send arguments, use assets from state
                assets_to_analyze = (
                    tool_args.get("assets")
                    or state.get("portfolio_assets")
                    or []
                )
                result = PortfolioMCPServer.calculate_portfolio_risk(
                    assets_to_analyze
                )
            else:
                result = {"error": f"Unknown tool: {tool_name}"}

            tool_outputs.append(ToolMessage(
                content=json.dumps(result),
                tool_call_id=tool_call["id"],
                name=tool_name
            ))

    return {"messages": tool_outputs}


def should_continue(state: AgentState) -> str:
    """
    Checks whether the LLM needs a tool or is ready to respond.
    """
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "continue"
    return "end"


# --- LANGGRAPH STATE MACHINE COMPILATION ---

workflow = StateGraph(AgentState)

# Define nodes
workflow.add_node("agent_node", call_model)
workflow.add_node("tools_node", execute_tools)

# Connect edges
workflow.add_edge(START, "agent_node")

workflow.add_conditional_edges(
    "agent_node",
    should_continue,
    {
        "continue": "tools_node",
        "end": END
    }
)

workflow.add_edge("tools_node", "agent_node")

# Compiled agent instance
portfolio_agent = workflow.compile()
