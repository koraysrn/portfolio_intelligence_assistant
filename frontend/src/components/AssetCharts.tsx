'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Asset } from '../types';

interface AssetChartsProps {
  assets: Asset[];
}

const COLORS = [
  '#10b981',
  '#06b6d4',
  '#6366f1',
  '#f59e0b',
  '#64748b',
  '#ec4899',
];

export default function AssetCharts({ assets }: AssetChartsProps) {
  // Grafikler su an gizli — ileride aktif edilebilir
  return null;

  /* eslint-disable @typescript-eslint/no-unused-vars */
  if (!assets || assets.length === 0) {
    return null;
  }

  const categoryMap: { [key: string]: number } = {};
  assets.forEach((asset) => {
    const cat = asset.category ? asset.category.toUpperCase() : 'UNKNOWN';
    categoryMap[cat] = (categoryMap[cat] || 0) + asset.total_value_usd;
  });

  const categoryData = Object.keys(categoryMap).map((key) => ({
    name: key,
    value: roundValue(categoryMap[key]),
  }));

  function roundValue(val: number) {
    return Math.round(val * 100) / 100;
  }

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
        <div className="w-full h-64 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={assets.map((a) => ({
                  name: a.ticker,
                  value: roundValue(a.total_value_usd),
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(1)}%)`
                }
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {assets.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '0.5rem',
                }}
                itemStyle={{ color: '#f8fafc' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
        <div className="w-full h-64 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryData}
              margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '0.5rem',
                }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                {categoryData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[(index + 2) % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
