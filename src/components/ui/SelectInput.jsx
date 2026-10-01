import React from 'react';

export default function SelectInput({ value, onChange, options, error, className = "", placeholder, ...props }) {
  return (
    <select 
      value={value ?? ""} 
      onChange={e => onChange(e.target.value)} 
      className={`w-full border rounded px-3 py-2 outline-none transition-colors ${props.disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'} ${error ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-slate-300 focus:border-navy-500'} ${className}`}
      {...props}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map(opt => {
        const val = typeof opt === 'object' ? opt.value : opt;
        const lbl = typeof opt === 'object' ? opt.label : opt;
        return <option key={val} value={val}>{lbl}</option>;
      })}
    </select>
  );
}
