import React from 'react';
import { Info } from 'lucide-react';

export default function InfoTip({ text }) {
  return (
    <div className="group relative inline-flex ml-1 align-middle">
      <Info className="w-4 h-4 text-slate-400 cursor-help" />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-10 text-center font-normal">
        {text}
      </div>
    </div>
  );
}
