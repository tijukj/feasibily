import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function RiskAnalysis() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold text-navy-900">Risk Analysis</h2>
      <p className="text-slate-500">Coming in a later phase</p>

      {/* Kept charts for layout reference */}
      <div className="h-[300px] hidden">
        <ResponsiveContainer width="100%" height="90%">
          <RadarChart outerRadius={90} data={[]}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis />
            <Radar name="NPV" dataKey="A" stroke="#f97316" fill="#f97316" fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
