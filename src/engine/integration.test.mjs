import test from 'node:test';
import assert from 'node:assert';
import { normalizeInput } from './normalizeInput.js';
import { analyze, npv } from './engine.js';

function round2(val) {
  return Math.round(val * 100) / 100;
}

test('1. Hand-check fixture', (t) => {
  const p = normalizeInput({
    project: { lifeYears: 3 },
    assumptions: { discountRatePct: 10, taxEnabled: false },
    assets: [{ name: 'Mac', cost: 100000, gstRatePct: 0, itcClaimable: true, year: 0, salvagePct: 0, bookLifeYears: 10 }],
    opex: [],
    benefits: [{ name: 'Sav', amount: 40000, kind: 'saving', basis: 'fixed' }]
  });
  const res = analyze(p);
  const m = res.base.metrics;
  // NPV: -100k + 40k/1.1 + 40k/1.21 + 40k/1.331 = -100000 + 36363.63 + 33057.85 + 30045.00 = -533.51 roughly
  // Wait, payback: 2.5 yrs. IRR: 9.7%
  assert.ok(Math.abs(m.npv - -525.92) < 1, `NPV was ${m.npv}`);
  assert.ok(Math.abs(m.paybackYears - 2.5) < 0.01, `Payback was ${m.paybackYears}`);
  assert.ok(Math.abs(m.irr - 0.097) < 0.001, `IRR was ${m.irr}`);
});

test('2. GST logic', (t) => {
  const base = {
    project: { lifeYears: 3 },
    assumptions: { gstApplies: true },
    assets: [{ name: 'A', cost: 100000, gstRatePct: 18, itcClaimable: false, year: 0 }],
    opex: [], benefits: []
  };
  const r1 = analyze(normalizeInput(base));
  assert.strictEqual(r1.base.metrics.totalInvestment, 118000);

  base.assets[0].itcClaimable = true;
  const r2 = analyze(normalizeInput(base));
  assert.strictEqual(r2.base.metrics.totalInvestment, 100000);

  base.assumptions.gstApplies = false;
  base.assets[0].itcClaimable = false;
  const r3 = analyze(normalizeInput(base));
  assert.strictEqual(r3.base.metrics.totalInvestment, 100000);
});

test('3. Land logic', (t) => {
  const p = normalizeInput({
    project: { lifeYears: 3 },
    assumptions: {},
    assets: [{ name: 'L', category: 'land', cost: 100000, gstRatePct: 0, itcClaimable: false, year: 0, salvagePct: 100, bookLifeYears: 0 }],
    opex: [], benefits: []
  });
  const res = analyze(p);
  assert.strictEqual(res.base.years[1].bookDep, 0);
  assert.strictEqual(res.base.metrics.salvage, 100000);
});

test('4. Growth and Margin', (t) => {
  const p = normalizeInput({
    project: { lifeYears: 3 },
    assumptions: {},
    assets: [], opex: [],
    benefits: [{ name: 'Rev', kind: 'revenue', basis: 'growth', amount: 100000, growthPct: 10, contributionPct: 30 }]
  });
  const res = analyze(p);
  assert.strictEqual(res.base.years[1].cashBenefits, 30000);
  assert.strictEqual(res.base.years[2].cashBenefits, 33000);
  assert.strictEqual(res.base.years[3].cashBenefits, 36300);
});

test('5. Utilization logic', (t) => {
  const p = normalizeInput({
    project: { lifeYears: 3 },
    assumptions: { rampUp: [0.5, 0.8, 1.0] },
    assets: [],
    opex: [
      { name: 'Fixed', amount: 10000, basis: 'fixed' },
      { name: 'Var', amount: 10000, basis: 'variable' }
    ],
    benefits: []
  });
  const res = analyze(p);
  assert.strictEqual(res.base.years[1].opex, 10000 + 5000);
  assert.strictEqual(res.base.years[2].opex, 10000 + 8000);
});

test('6. pctRevenue opex', (t) => {
  const p = normalizeInput({
    project: { lifeYears: 3 },
    assumptions: {},
    assets: [],
    opex: [{ name: 'Comm', amount: 20, basis: 'pctRevenue' }],
    benefits: [{ name: 'Rev', amount: 100000, kind: 'revenue', contributionPct: 100 }]
  });
  const res = analyze(p);
  assert.strictEqual(res.base.years[1].opex, 20000);
});

test('7. Life change', (t) => {
  const p = normalizeInput({
    project: { lifeYears: 6 },
    assumptions: {},
    assets: [],
    opex: [{ name: 'End', amount: 10000, endYear: 3 }, { name: 'Full', amount: 10000 }],
    benefits: []
  });
  const res = analyze(p);
  assert.strictEqual(res.base.years.length, 7); // 0 to 6
  assert.strictEqual(res.base.years[3].opex, 20000);
  assert.strictEqual(res.base.years[4].opex, 10000);
});

test('8. Reconciliation invariants', (t) => {
  const p = normalizeInput({
    project: { lifeYears: 5 },
    assumptions: { discountRatePct: 10, gstApplies: true, taxEnabled: true },
    assets: [{ name: 'A1', category: 'plant_machinery', cost: 50000, gstRatePct: 18, itcClaimable: false, year: 0, salvagePct: 10 }],
    opex: [{ name: 'O1', amount: 5000 }],
    benefits: [{ name: 'B1', amount: 20000, kind: 'saving' }]
  });
  const res = analyze(p);
  const m = res.base.metrics;
  
  assert.strictEqual(m.totalInvestment, 50000 * 1.18);
  
  for (let i = 1; i <= 5; i++) {
    const y = res.base.years[i];
    assert.ok(Math.abs(y.ebitda - (y.cashBenefits - y.opex)) < 0.001);
  }
  
  const sumFcf = res.base.years.reduce((acc, y) => acc + y.fcf, 0);
  assert.ok(Math.abs(res.base.years[5].cumFcf - sumFcf) < 0.001);
  
  const fcfArr = res.base.years.map(y => y.fcf);
  const calcNpv = npv(0.10, fcfArr);
  assert.ok(Math.abs(calcNpv - m.npv) < 0.001);
});

test('9. Edge cases', (t) => {
  const zeroes = normalizeInput({
    project: { lifeYears: 5 }, assumptions: {}, assets: [], opex: [], benefits: []
  });
  const rZ = analyze(zeroes);
  assert.ok(!isNaN(rZ.base.metrics.npv));
  assert.strictEqual(rZ.base.metrics.irr, null);
  
  const noSign = normalizeInput({
    project: { lifeYears: 5 }, assumptions: {},
    assets: [{ name: 'A', cost: 100000, year: 0, salvagePct: 0 }],
    opex: [{ name: 'O', amount: 10000 }], benefits: []
  });
  const rS = analyze(noSign);
  assert.strictEqual(rS.base.metrics.irr, null);

  const huge = normalizeInput({ project: { lifeYears: 30 }, assets: [{ name: 'H', cost: 1e12 }] });
  const rHuge = analyze(huge);
  assert.ok(!isNaN(rHuge.base.metrics.npv) && isFinite(rHuge.base.metrics.npv));
  assert.strictEqual(rHuge.base.years.length, 31); // 0 to 30

  const life1 = normalizeInput({ project: { lifeYears: 1 }, assets: [{ name: '1', cost: 100 }] });
  const rLife1 = analyze(life1);
  assert.strictEqual(rLife1.base.years.length, 2); // 0 to 1

  const negAmounts = normalizeInput({
    project: { lifeYears: 2 },
    assets: [{ name: 'NegA', cost: -500 }],
    opex: [{ name: 'NegO', amount: -100 }],
    benefits: [{ name: 'NegB', amount: -200 }]
  });
  const rNeg = analyze(negAmounts);
  assert.ok(!isNaN(rNeg.base.metrics.npv) && isFinite(rNeg.base.metrics.npv));
  assert.strictEqual(rNeg.base.years[1].opex, -100);
  assert.strictEqual(rNeg.base.years[1].cashBenefits, -200);
});

test('10. Category totals matching metrics exactly', (t) => {
  const p1 = normalizeInput({
    project: { lifeYears: 3 }, assumptions: { gstApplies: true },
    assets: [
      { name: 'M1', category: 'plant_machinery', cost: 100000, gstRatePct: 18, itcClaimable: false },
      { name: 'V1', category: 'vehicle', cost: 50000, gstRatePct: 40, itcClaimable: false },
      { name: 'L1', category: 'land', cost: 200000, gstRatePct: 0, itcClaimable: false }
    ]
  });
  
  const r1 = analyze(p1);
  const totalInv1 = r1.base.metrics.totalInvestment;
  
  assert.strictEqual(totalInv1, (100000 * 1.18) + (50000 * 1.40) + 200000);
});

test('11. Soft-benefit share', (t) => {
  const p = normalizeInput({
    project: { lifeYears: 5 },
    benefits: [
      { name: 'Rev', kind: 'revenue', amount: 10000, confidencePct: 100 },
      { name: 'Prod', kind: 'other', amount: 5000, confidencePct: 80 } // 5000 * 0.8 = 4000
    ]
  });
  // The app computes: softSharePct = (4000 / 14000) * 100.
  // The engine just provides cashBenefits = 14000. Let's verify year 1 cash benefits.
  const r = analyze(p);
  assert.strictEqual(r.base.years[1].cashBenefits, 14000);
});
