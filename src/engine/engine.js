import { 
  TAX_DEP_RATES, 
  BOOK_LIFE_YEARS, 
  DEFAULT_THRESHOLDS 
} from './indiaConfig.js';
import { getAssetCapitalCost } from './assetUtils.js';

export function npv(rate, flows) {
  return flows.reduce((sum, f, t) => sum + f / Math.pow(1 + rate, t), 0);
}

export function irr(flows) {
  let hasPos = false, hasNeg = false;
  for (let f of flows) {
    if (f > 0) hasPos = true;
    if (f < 0) hasNeg = true;
  }
  if (!hasPos || !hasNeg) return null;

  const grid = [-0.99, -0.9, -0.75, -0.5, -0.25, -0.1, -0.05, 0, 0.02, 0.05, 0.1, 0.15, 0.2, 0.3, 0.5, 0.75, 1, 2, 5, 10, 50, 100];
  
  let r1 = null;
  let npv1 = null;
  
  for (let r of grid) {
    let currentNpv = npv(r, flows);
    if (Math.abs(currentNpv) < 1e-10) return r; // Exact hit
    if (r1 !== null && ((npv1 > 0 && currentNpv < 0) || (npv1 < 0 && currentNpv > 0))) {
      // Sign change found, bisect between r1 and r
      let low = r1;
      let high = r;
      for (let i = 0; i < 200; i++) {
        let mid = (low + high) / 2;
        if (Math.abs(high - low) < 1e-15) return mid;
        let midNpv = npv(mid, flows);
        if (Math.abs(midNpv) < 1e-10) return mid;
        
        if ((npv1 > 0 && midNpv > 0) || (npv1 < 0 && midNpv < 0)) {
          low = mid;
          npv1 = midNpv; // update the sign reference
        } else {
          high = mid;
        }
      }
      return (low + high) / 2;
    }
    r1 = r;
    npv1 = currentNpv;
  }
  return null;
}

export function mirr(flows, financeRate, reinvestRate) {
  const n = flows.length - 1;
  if (n <= 0) return null;

  let posFv = 0;
  let negPv = 0;

  for (let t = 0; t <= n; t++) {
    const f = flows[t];
    if (f > 0) {
      posFv += f * Math.pow(1 + reinvestRate, n - t);
    } else if (f < 0) {
      negPv += f / Math.pow(1 + financeRate, t);
    }
  }

  if (negPv === 0 || posFv === 0) return null;
  
  return Math.pow(posFv / -negPv, 1 / n) - 1;
}

export function payback(flows, rate = 0) {
  let cum = 0;
  for (let t = 0; t < flows.length; t++) {
    const dFlow = flows[t] / Math.pow(1 + rate, t);
    const prevCum = cum;
    cum += dFlow;
    
    if (t > 0 && prevCum < 0 && cum >= 0) {
      return (t - 1) + (-prevCum / dFlow);
    }
  }
  return null;
}

export function emi(loan, ratePct, years) {
  const i = ratePct / 100;
  if (i === 0) return loan / years;
  return loan * i / (1 - Math.pow(1 + i, -years));
}

export function runModel(input, overrides = {}) {
  const {
    costMult = 1,
    benefitMult = 1,
    capexMult = 1,
    utilization = 1,
    growthDelta = 0,
    discountRate: discountOverride = null
  } = overrides;

  const N = Math.max(1, Math.min(30, Math.round(input.project?.lifeYears || 1)));
  
  const drPct = input.assumptions?.discountRatePct ?? 12;
  const discountRate = discountOverride !== null ? discountOverride : drPct / 100;
  
  const taxEnabled = !!input.assumptions?.taxEnabled;
  const taxRatePct = input.assumptions?.taxRatePct ?? 25.17;
  const taxRate = taxRatePct / 100;
  const gstApplies = input.assumptions?.gstApplies ?? true;
  const inflationPct = input.assumptions?.inflationPct ?? 0;
  const nwcPct = input.assumptions?.nwcPct ?? 0;
  
  const financingAssumptions = input.assumptions?.financing || {};
  const rampUp = input.assumptions?.rampUp || [];

  // Init arrays
  const years = [];
  for (let t = 0; t <= N; t++) {
    years.push({
      t, benefits: 0, cashBenefits: 0, revenue: 0, opex: 0, ebitda: 0,
      bookDep: 0, taxDep: 0, tax: 0, leveredTax: 0, capex: 0, 
      fcf: 0, cumFcf: 0, dNwc: 0, nwc: 0,
      debtService: 0, interest: 0, principal: 0, cfads: 0, equity: 0
    });
  }

  let totalSalvage = 0;
  const wdvTrackers = [];

  // 1) ASSETS
  const assets = input.assets || [];
  for (const a of assets) {
    const cap = getAssetCapitalCost(a, gstApplies, capexMult);
    const yr = Math.max(0, Math.min(N, Math.round(a.year || 0)));
    
    years[yr].capex += cap;
    
    const salvageRate = (a.salvagePct ?? 5) / 100;
    totalSalvage += cap * salvageRate;
    
    // Book dep
    if (a.category !== 'land') {
      const bLife = a.bookLifeYears ?? BOOK_LIFE_YEARS[a.category] ?? 10;
      const annualBookDep = (cap * (1 - salvageRate)) / bLife;
      const maxLife = Math.min(bLife, N - yr);
      for (let i = 1; i <= maxLife; i++) {
        if (yr + i <= N) {
          years[yr + i].bookDep += annualBookDep;
        }
      }
    }
    
    // Tax dep
    const tRate = (a.taxDepRatePct ?? (TAX_DEP_RATES[a.category] * 100) ?? 15) / 100;
    wdvTrackers.push({
      startYear: yr + 1,
      wdv: cap,
      rate: tRate
    });
  }

  // Calculate tax dep for each year based on WDV
  for (let t = 1; t <= N; t++) {
    for (const tracker of wdvTrackers) {
      if (t >= tracker.startYear) {
        const dep = tracker.wdv * tracker.rate;
        years[t].taxDep += dep;
        tracker.wdv -= dep;
      }
    }
  }

  // 2) BENEFITS & 3) OPEX
  const benefitsDef = input.benefits || [];
  const opexDef = input.opex || [];
  
  // Need to process revenue first because pctRevenue opex depends on it
  for (let t = 1; t <= N; t++) {
    const ramp = rampUp[t - 1] !== undefined ? rampUp[t - 1] : 1;
    
    for (const b of benefitsDef) {
      const sYr = b.startYear ?? 1;
      const eYr = b.endYear ?? N;
      if (t >= sYr && t <= eYr) {
        const g = (b.basis === 'growth' ? (b.growthPct || 0) / 100 : 0) + growthDelta;
        const amount_t = (b.amount || 0) * Math.pow(1 + g, t - sYr) * ((b.confidencePct ?? 100) / 100) * ramp * utilization * benefitMult;
        
        years[t].benefits += amount_t;
        if (b.kind === 'revenue') {
          years[t].revenue += amount_t;
          years[t].cashBenefits += amount_t * ((b.contributionPct ?? 100) / 100);
        } else {
          years[t].cashBenefits += amount_t;
        }
      }
    }
    
    for (const o of opexDef) {
      const sYr = o.startYear ?? 1;
      const eYr = o.endYear ?? N;
      if (t >= sYr && t <= eYr) {
        if (o.basis === 'pctRevenue') {
          years[t].opex += years[t].revenue * (o.amount || 0) / 100 * costMult;
        } else {
          const esc = (o.escalationPct ?? inflationPct) / 100;
          let amount_t = (o.amount || 0) * Math.pow(1 + esc, t - sYr) * costMult;
          if (o.basis === 'variable') {
            amount_t *= utilization * ramp;
          }
          years[t].opex += amount_t;
        }
      }
    }
    
    // 4) ebitda
    years[t].ebitda = years[t].cashBenefits - years[t].opex;
    
    // 5) Working capital
    years[t].nwc = (nwcPct / 100) * years[t].benefits;
    years[t].dNwc = years[t].nwc - years[t - 1].nwc;
  }

  // Release NWC in year N
  years[N].dNwc -= years[N].nwc;

  // 6) TAX (unlevered)
  let lossPool = 0;
  for (let t = 1; t <= N; t++) {
    if (taxEnabled) {
      const taxable = years[t].ebitda - years[t].taxDep;
      if (taxable < 0) {
        lossPool += Math.abs(taxable);
        years[t].tax = 0;
      } else {
        if (lossPool > 0) {
          if (taxable <= lossPool) {
            lossPool -= taxable;
            years[t].tax = 0;
          } else {
            const remaining = taxable - lossPool;
            lossPool = 0;
            years[t].tax = remaining * taxRate;
          }
        } else {
          years[t].tax = taxable * taxRate;
        }
      }
    } else {
      years[t].tax = 0;
    }
  }

  // 7) PROJECT CASH FLOW
  let cumFcf = 0;
  for (let t = 0; t <= N; t++) {
    if (t === 0) {
      years[t].fcf = -years[t].capex;
    } else {
      years[t].fcf = years[t].ebitda - years[t].tax - years[t].capex - years[t].dNwc;
      if (t === N) {
        years[t].fcf += totalSalvage;
      }
    }
    cumFcf += years[t].fcf;
    years[t].cumFcf = cumFcf;
  }

  // 8) FINANCING
  let financing = null;
  if (financingAssumptions.enabled) {
    const loan = years[0].capex * (financingAssumptions.loanPct || 0) / 100;
    const interestPct = financingAssumptions.interestPct || 0;
    const tenorYears = financingAssumptions.tenorYears || 0;
    const annualInstalment = emi(loan, interestPct, tenorYears);
    
    let balance = loan;
    let leveredLossPool = 0;
    let minDscr = Infinity;
    let sumDscr = 0;
    let dscrCount = 0;
    
    years[0].equity = -(years[0].capex - loan);

    for (let t = 1; t <= N; t++) {
      if (t <= tenorYears) {
        years[t].interest = balance * interestPct / 100;
        years[t].principal = annualInstalment - years[t].interest;
        years[t].debtService = annualInstalment;
        balance -= years[t].principal;
      } else {
        years[t].interest = 0;
        years[t].principal = 0;
        years[t].debtService = 0;
      }

      // Levered Tax
      if (taxEnabled) {
        const taxable = years[t].ebitda - years[t].taxDep - years[t].interest;
        if (taxable < 0) {
          leveredLossPool += Math.abs(taxable);
          years[t].leveredTax = 0;
        } else {
          if (leveredLossPool > 0) {
            if (taxable <= leveredLossPool) {
              leveredLossPool -= taxable;
              years[t].leveredTax = 0;
            } else {
              const remaining = taxable - leveredLossPool;
              leveredLossPool = 0;
              years[t].leveredTax = remaining * taxRate;
            }
          } else {
            years[t].leveredTax = taxable * taxRate;
          }
        }
      } else {
        years[t].leveredTax = 0;
      }

      years[t].cfads = years[t].ebitda - years[t].leveredTax - years[t].dNwc;
      
      let eqFlow = years[t].cfads - years[t].debtService - years[t].capex;
      if (t === N) {
        eqFlow += totalSalvage;
        if (balance > 0) {
          eqFlow -= balance;
        }
      }
      years[t].equity = eqFlow;

      if (years[t].debtService > 0) {
        const dscr = years[t].cfads / years[t].debtService;
        if (dscr < minDscr) minDscr = dscr;
        sumDscr += dscr;
        dscrCount++;
      }
    }

    financing = {
      loan,
      annualInstalment,
      equityIrr: irr(years.map(y => y.equity)),
      minDscr: minDscr === Infinity ? null : minDscr,
      avgDscr: dscrCount > 0 ? sumDscr / dscrCount : null
    };
  }

  // 9) METRICS
  const fcfArray = years.map(y => y.fcf);
  const totalInvestment = years.reduce((s, y) => s + y.capex, 0);
  
  let pvCapex = 0;
  for (let t = 0; t <= N; t++) {
    pvCapex += years[t].capex / Math.pow(1 + discountRate, t);
  }

  const modelNpv = npv(discountRate, fcfArray);
  const modelIrr = irr(fcfArray);
  const modelMirr = mirr(fcfArray, discountRate, discountRate);
  const paybackYears = payback(fcfArray, 0);
  const discountedPaybackYears = payback(fcfArray, discountRate);
  
  const pi = pvCapex > 0 ? (modelNpv + pvCapex) / pvCapex : null;
  const totalFcf = fcfArray.reduce((a, b) => a + b, 0);
  const roi = totalInvestment > 0 ? totalFcf / totalInvestment : null;
  
  let sumAccIncome = 0;
  for (let t = 1; t <= N; t++) {
    sumAccIncome += (years[t].ebitda - years[t].bookDep - years[t].tax);
  }
  const accountingRoi = totalInvestment > 0 ? (sumAccIncome / N) / totalInvestment : null;

  const metrics = {
    discountRate,
    totalInvestment,
    gstCostIncluded: gstApplies && (input.assets || []).some(a => !a.itcClaimable),
    salvage: totalSalvage,
    npv: modelNpv,
    irr: modelIrr,
    mirr: modelMirr,
    paybackYears,
    discountedPaybackYears,
    pi,
    roi,
    accountingRoi
  };

  return { years, financing, metrics };
}

export function benefitBreakEven(input, baseOverrides = {}) {
  let low = 0;
  let high = 5;
  const npv0 = runModel(input, { ...baseOverrides, benefitMult: 0 }).metrics.npv;
  if (npv0 >= 0) return { multiplier: 0, marginOfSafety: 1 };
  
  const npv5 = runModel(input, { ...baseOverrides, benefitMult: 5 }).metrics.npv;
  if (npv5 < 0) return { multiplier: null, marginOfSafety: null };
  
  for (let i = 0; i < 50; i++) {
    let mid = (low + high) / 2;
    if (high - low < 1e-10) break;
    let midNpv = runModel(input, { ...baseOverrides, benefitMult: mid }).metrics.npv;
    if (Math.abs(midNpv) < 1e-10) {
      low = mid;
      high = mid;
      break;
    }
    if (midNpv < 0) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  const m = (low + high) / 2;
  return { multiplier: m, marginOfSafety: 1 - m };
}

export function unitBreakEven({ fixedCostsPerYear, pricePerUnit, variableCostPerUnit }) {
  const contribution = pricePerUnit - variableCostPerUnit;
  if (contribution > 0) {
    return {
      units: fixedCostsPerYear / contribution,
      contributionPerUnit: contribution
    };
  }
  return null;
}

export function sensitivity(input, swings = [-0.2, -0.1, 0.1, 0.2]) {
  const baseRes = runModel(input);
  const baseNpv = baseRes.metrics.npv;
  
  const variables = [
    { key: 'benefitMult', label: 'Benefits', isMult: true },
    { key: 'costMult', label: 'Operating costs', isMult: true },
    { key: 'capexMult', label: 'Initial investment', isMult: true },
    { key: 'utilization', label: 'Utilization', isMult: true },
    { key: 'discountRate', label: 'Discount rate', isMult: false }
  ];
  
  const rows = [];
  
  for (const v of variables) {
    const points = [];
    let minNpv = Infinity, maxNpv = -Infinity;
    for (const swing of swings) {
      const overrides = {};
      if (v.key === 'discountRate') {
        const baseDr = input.assumptions?.discountRatePct !== undefined 
          ? input.assumptions.discountRatePct / 100 
          : 0.12;
        overrides.discountRate = baseDr * (1 + swing);
      } else if (v.isMult) {
        overrides[v.key] = 1 + swing;
      }
      
      const res = runModel(input, overrides);
      const npv = res.metrics.npv;
      if (npv < minNpv) minNpv = npv;
      if (npv > maxNpv) maxNpv = npv;
      
      points.push({ swing, npv, irr: res.metrics.irr });
    }
    rows.push({
      key: v.key,
      label: v.label,
      points,
      range: maxNpv - minNpv
    });
  }
  
  rows.sort((a, b) => b.range - a.range);
  return { baseNpv, rows };
}

export const DEFAULT_SCENARIOS = [
  { name: 'Best case', benefitMult: 1.1, costMult: 0.95, utilization: 1, growthDelta: 0.01, capexMult: 1 },
  { name: 'Base case' }, // neutral implicitly
  { name: 'Worst case', benefitMult: 0.8, costMult: 1.15, utilization: 0.85, growthDelta: -0.01, capexMult: 1.1 }
];

export function runScenarios(input, list = DEFAULT_SCENARIOS) {
  return list.map(scen => {
    const overrides = { ...scen };
    delete overrides.name;
    const res = runModel(input, overrides);
    return {
      name: scen.name,
      npv: res.metrics.npv,
      irr: res.metrics.irr,
      paybackYears: res.metrics.paybackYears
    };
  });
}

export function assess(input, thresholds = {}) {
  const base = runModel(input);
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds };
  
  const lifeYears = input.project?.lifeYears ?? 1;
  const maxPayback = t.maxPaybackYears ?? (lifeYears * t.maxPaybackShareOfLife);
  const dr = base.metrics.discountRate;

  const checks = [
    { label: 'Positive NPV', pass: base.metrics.npv > 0 },
    { label: 'Return beats hurdle rate', pass: base.metrics.irr !== null && base.metrics.irr >= dr },
    { label: `Payback within ${maxPayback} years`, pass: base.metrics.paybackYears !== null && base.metrics.paybackYears <= maxPayback },
    { label: `Profitability index at least ${t.minPI}`, pass: base.metrics.pi !== null && base.metrics.pi >= t.minPI }
  ];

  let verdict = 'Caution';
  if (base.metrics.npv <= 0) {
    verdict = 'No-go';
  } else if (checks.every(c => c.pass)) {
    verdict = 'Go';
  }

  const breakEven = benefitBreakEven(input);
  const scenarios = runScenarios(input);
  const worstCase = scenarios.find(s => s.name === 'Worst case') || { npv: 0 };
  
  let risk = 'Medium';
  if (base.metrics.npv <= 0 || (breakEven.marginOfSafety !== null && breakEven.marginOfSafety < 0.10)) {
    risk = 'High';
  } else if (worstCase.npv > 0 && breakEven.marginOfSafety !== null && breakEven.marginOfSafety >= 0.25) {
    risk = 'Low';
  }

  return { verdict, risk, checks, breakEven, worstCaseNpv: worstCase.npv, base };
}

export function analyze(input, thresholds = {}) {
  return {
    ...assess(input, thresholds),
    sensitivity: sensitivity(input),
    scenarios: runScenarios(input)
  };
}
