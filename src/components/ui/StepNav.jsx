import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function StepNav({ currentTabId, tabs, setActiveTab }) {
  const idx = tabs.findIndex(t => t.id === currentTabId);
  if (idx === -1) return null;
  
  const prev = idx > 0 ? tabs[idx - 1] : null;
  const next = idx < tabs.length - 1 ? tabs[idx + 1] : null;

  return (
    <div className="mt-12 pt-6 border-t border-slate-200 flex items-center justify-between">
      <div>
        {prev && (
          <button onClick={() => setActiveTab(prev.id)} className="flex items-center text-slate-500 hover:text-navy-700 font-medium px-4 py-2 border rounded bg-white shadow-sm transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back: {prev.name}
          </button>
        )}
      </div>
      <div>
        {next && (
          <button onClick={() => setActiveTab(next.id)} className="flex items-center text-white bg-navy-600 hover:bg-navy-700 font-medium px-6 py-2 rounded shadow-sm transition-colors">
            Next: {next.name} <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        )}
      </div>
    </div>
  );
}
