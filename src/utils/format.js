export function isInvalid(value) {
  return value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value);
}

export function formatINR(value, compact = false) {
  if (isInvalid(value)) return "Not applicable";
  
  if (compact) {
    const absVal = Math.abs(value);
    if (absVal >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
    if (absVal >= 1e5) return `₹${(value / 1e5).toFixed(2)} L`;
    return `₹${Math.round(value).toLocaleString('en-IN')}`;
  }
  
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function formatPct(value) {
  if (isInvalid(value)) return "Not applicable";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatPayback(years) {
  if (isInvalid(years)) return "Not within project life";
  const y = Math.floor(years);
  const m = Math.round((years - y) * 12);
  if (y === 0) return `${m} months`;
  if (m === 0) return `${y} years`;
  if (m === 12) return `${y + 1} years`;
  return `${y} years ${m} months`;
}

export function formatNumber(value, decimals = 1) {
  if (isInvalid(value)) return "Not applicable";
  return value.toFixed(decimals);
}
