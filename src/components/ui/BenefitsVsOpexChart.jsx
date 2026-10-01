import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatINR } from '../../utils/format';

export default function BenefitsVsOpexChart({ results }) {
  if (!results || !results.base) return null;

  const chartData = results.base.years.slice(1).map(y => ({
    year: `Year ${y.year}`,
    cashBenefits: Math.round(y.cashBenefits || 0),
    opex: Math.round(y.opex || 0)
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
          <YAxis tickFormatter={v => formatINR(v, true)} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
          <RechartsTooltip 
            formatter={(val) => [formatINR(val), ""]}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar name="Operating Costs" dataKey="opex" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar name="Net Benefits" dataKey="cashBenefits" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
