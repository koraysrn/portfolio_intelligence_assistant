import React from 'react';
import './globals.css';

export const metadata = {
  title: 'AI Portfolio Intelligence Assistant',
  description:
    'Autonomous portfolio analysis tool powered by Dual LLM Architecture.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-950">
      <body className="h-full text-slate-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-400">
        {children}
      </body>
    </html>
  );
}
