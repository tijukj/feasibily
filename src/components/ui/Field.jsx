import React from 'react';

export default function Field({ label, helperText, errorText, children, className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      {children}
      {errorText && <p className="text-sm text-red-500">{errorText}</p>}
      {helperText && !errorText && <p className="text-sm text-slate-500">{helperText}</p>}
    </div>
  );
}
