export function normalizeInput(project) {
  if (!project) return null;
  const p = JSON.parse(JSON.stringify(project));

  const cleanNum = (val) => {
    if (typeof val === 'string' && val.trim() === "") return undefined;
    if (val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  };

  if (p.project) {
    p.project.lifeYears = cleanNum(p.project.lifeYears);
  }
  
  if (p.assumptions) {
    p.assumptions.discountRatePct = cleanNum(p.assumptions.discountRatePct);
    p.assumptions.inflationPct = cleanNum(p.assumptions.inflationPct);
    p.assumptions.taxRatePct = cleanNum(p.assumptions.taxRatePct);
    p.assumptions.nwcPct = cleanNum(p.assumptions.nwcPct);
    if (Array.isArray(p.assumptions.rampUp)) {
      p.assumptions.rampUp = p.assumptions.rampUp.map(r => cleanNum(r) ?? 1);
    }
  }

  const hasVal = (row) => row.name && cleanNum(row.amount ?? row.cost) !== undefined;

  if (Array.isArray(p.assets)) {
    p.assets = p.assets.filter(a => a.name && cleanNum(a.cost) !== undefined).map(a => ({
      ...a,
      cost: cleanNum(a.cost),
      gstRatePct: cleanNum(a.gstRatePct),
      year: cleanNum(a.year),
      bookLifeYears: cleanNum(a.bookLifeYears),
      salvagePct: cleanNum(a.salvagePct)
    }));
  }

  if (Array.isArray(p.opex)) {
    p.opex = p.opex.filter(hasVal).map(o => ({
      ...o,
      amount: cleanNum(o.amount),
      escalationPct: cleanNum(o.escalationPct),
      startYear: cleanNum(o.startYear),
      endYear: cleanNum(o.endYear)
    }));
  }

  if (Array.isArray(p.benefits)) {
    p.benefits = p.benefits.filter(hasVal).map(b => ({
      ...b,
      amount: cleanNum(b.amount),
      growthPct: cleanNum(b.growthPct),
      contributionPct: cleanNum(b.contributionPct),
      confidencePct: cleanNum(b.confidencePct),
      startYear: cleanNum(b.startYear),
      endYear: cleanNum(b.endYear)
    }));
  }

  return p;
}
