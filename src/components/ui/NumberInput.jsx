import React, { useState, useEffect } from 'react';

export default function NumberInput({ value, onChange, prefix = "", suffix = "", min, max, placeholder, error, className = "", ...props }) {
  const [focused, setFocused] = useState(false);
  const [localStr, setLocalStr] = useState("");

  useEffect(() => {
    if (!focused) {
      if (value === "" || value === null || value === undefined || isNaN(value)) {
        setLocalStr("");
      } else {
        let str = Number(value).toLocaleString('en-IN');
        setLocalStr(prefix + str + suffix);
      }
    }
  }, [value, focused, prefix, suffix]);

  const handleChange = (e) => {
    let raw = e.target.value;
    setLocalStr(raw);
    let val = raw.replace(/[^0-9.-]/g, '');
    if (val === "" || val === "-") {
      onChange("");
    } else {
      let num = parseFloat(val);
      if (!isNaN(num)) onChange(num);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    if (value !== "" && value !== null && value !== undefined && !isNaN(value)) {
      let num = parseFloat(value);
      if (min !== undefined && num < min) num = min;
      if (max !== undefined && num > max) num = max;
      if (num !== value) onChange(num);
    }
  };

  const displayValue = focused ? (value === "" || value == null || isNaN(value) ? "" : value) : localStr;

  return (
    <input 
      type="text" 
      value={displayValue}
      onChange={handleChange}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={`w-full border rounded px-3 py-2 outline-none transition-colors ${props.disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'} ${error ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-slate-300 focus:border-navy-500'} ${className}`}
      {...props}
    />
  );
}
