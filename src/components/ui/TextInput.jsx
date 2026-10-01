import React from 'react';

export default function TextInput({ value, onChange, placeholder, error, className = "", ...props }) {
  return (
    <input 
      type="text" 
      value={value ?? ""} 
      onChange={e => onChange(e.target.value)} 
      placeholder={placeholder}
      className={`w-full border rounded px-3 py-2 outline-none transition-colors ${props.disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'} ${error ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-slate-300 focus:border-navy-500'} ${className}`}
      {...props}
    />
  );
}
