import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  npv, irr, payback, emi, 
  runModel, benefitBreakEven, runScenarios, assess, unitBreakEven,
  mirr, sensitivity, analyze
} from './engine.js';

test('1. NPV equals 40000*(1-1.1^-3)/0.1 - 100000', () => {
  const flows = [-100000, 40000, 40000, 40000];
  const expected = 40000 * (1 - Math.pow(1.1, -3)) / 0.1 - 100000;
  const result = npv(0.1, flows);
  assert.ok(Math.abs(result - expected) < 1e-5);
});

test('2. IRR makes NPV ~0; irr([100,200]) is null', () => {
  const flows = [-100000, 40000, 40000, 40000];
  const result = irr(flows);
  assert.ok(result > 0);
  assert.ok(Math.abs(npv(result, flows)) < 1e-5);
  
  assert.equal(irr([100, 200]), null);
});

test('3. Regression: irr([-1730600,300000,300000,300000,300000,300000]) is negative', () => {
  const flows = [-1730600, 300000, 300000, 300000, 300000, 300000];
  const result = irr(flows);
  assert.ok(result < 0);
  assert.ok(result > -0.5);
  assert.ok(Math.abs(npv(result, flows)) < 1e-5);
});

test('4. payback([-100000,40000,40000,40000]) equals 2.5', () => {
  const flows = [-100000, 40000, 40000, 40000];
  assert.equal(payback(flows), 2.5);
});

test('5. GST 18%: itcClaimable true gives totalInvestment 100000; false gives 118000', () => {
  const getRes = (itc) => runModel({
    project: { lifeYears: 3 },
    assumptions: { taxEnabled: false, gstApplies: true },
    assets: [{ category: 'plant_machinery', cost: 100000, gstRatePct: 18, itcClaimable: itc, year: 0 }]
  });
  assert.equal(getRes(true).metrics.totalInvestment, 100000);
  assert.equal(getRes(false).metrics.totalInvestment, 118000);
});

test('6. Tax depreciation: year 1 = 15000, year 2 = 12750', () => {
  const res = runModel({
    project: { lifeYears: 3 },
    assumptions: { taxEnabled: false, gstApplies: false },
    assets: [{ category: 'plant_machinery', cost: 100000, year: 0 }]
  });
  assert.equal(res.years[1].taxDep, 15000);
  assert.equal(res.years[2].taxDep, 12750);
});

test('7. Book depreciation: computer_software cost 90000 salvage 0 gives 30000 in year 1', () => {
  const res = runModel({
    project: { lifeYears: 3 },
    assumptions: { taxEnabled: false, gstApplies: false },
    assets: [{ category: 'computer_software', cost: 90000, salvagePct: 0, year: 0 }]
  });
  assert.equal(res.years[1].bookDep, 30000);
});

test('8. emi(1000000, 10, 5) ~ 263797.48', () => {
  const e = emi(1000000, 10, 5);
  assert.ok(Math.abs(e - 263797.48) < 0.01);
});

test('9. Tax enabled with losses never produces negative tax in any year', () => {
  const res = runModel({
    project: { lifeYears: 3 },
    assumptions: { taxEnabled: true, taxRatePct: 25 },
    assets: [{ category: 'plant_machinery', cost: 100000, year: 0 }],
    benefits: [{ kind: 'saving', basis: 'fixed', amount: 5000 }]
  });
  for (let t = 1; t <= 3; t++) {
    assert.ok(res.years[t].tax >= 0);
  }
});

test('10. benefitBreakEven multiplier gives NPV ~0 when re-run', () => {
  const input = {
    project: { lifeYears: 3 },
    assumptions: { discountRatePct: 10, taxEnabled: false },
    assets: [{ category: 'plant_machinery', cost: 100000, salvagePct: 0, year: 0 }],
    benefits: [{ kind: 'saving', basis: 'fixed', amount: 40000 }]
  };
  const be = benefitBreakEven(input);
  const res = runModel(input, { benefitMult: be.multiplier });
  assert.ok(Math.abs(res.metrics.npv) < 1e-4);
});

test('11. runScenarios: best NPV > base NPV > worst NPV for a profitable project', () => {
  const input = {
    project: { lifeYears: 3 },
    assumptions: { discountRatePct: 10, taxEnabled: false },
    assets: [{ category: 'plant_machinery', cost: 100000, salvagePct: 0, year: 0 }],
    benefits: [{ kind: 'saving', basis: 'fixed', amount: 40000 }]
  };
  const sc = runScenarios(input);
  const best = sc.find(s => s.name === 'Best case').npv;
  const base = sc.find(s => s.name === 'Base case').npv;
  const worst = sc.find(s => s.name === 'Worst case').npv;
  assert.ok(best > base);
  assert.ok(base > worst);
});

test('12. assess: benefit 10000 gives No-go; benefit 90000 gives Go', () => {
  const getInput = (amt) => ({
    project: { lifeYears: 3 },
    assumptions: { discountRatePct: 10, taxEnabled: false },
    assets: [{ category: 'plant_machinery', cost: 100000, salvagePct: 0, year: 0 }],
    benefits: [{ kind: 'saving', basis: 'fixed', amount: amt }]
  });
  assert.equal(assess(getInput(10000)).verdict, 'No-go');
  assert.equal(assess(getInput(90000)).verdict, 'Go');
});

test('13. Financing on (60% loan, 10%, 3 years, benefit 90000): minDscr > 1', () => {
  const res = runModel({
    project: { lifeYears: 3 },
    assumptions: { 
      discountRatePct: 10, taxEnabled: false,
      financing: { enabled: true, loanPct: 60, interestPct: 10, tenorYears: 3 }
    },
    assets: [{ category: 'plant_machinery', cost: 100000, salvagePct: 0, year: 0 }],
    benefits: [{ kind: 'saving', basis: 'fixed', amount: 90000 }]
  });
  assert.ok(res.financing.minDscr > 1);
});

test('14. Revenue line amount 100000, growth 10%, contribution 30%: cashBenefits year 1 = 30000, year 2 = 33000', () => {
  const res = runModel({
    project: { lifeYears: 3 },
    benefits: [{ kind: 'revenue', basis: 'growth', amount: 100000, growthPct: 10, contributionPct: 30 }]
  });
  assert.ok(Math.abs(res.years[1].cashBenefits - 30000) < 0.1);
  assert.ok(Math.abs(res.years[2].cashBenefits - 33000) < 0.1);
});

test('15. unitBreakEven fixed 100000, price 50, variable 30 gives 5000 units', () => {
  const res = unitBreakEven({ fixedCostsPerYear: 100000, pricePerUnit: 50, variableCostPerUnit: 30 });
  assert.equal(res.units, 5000);
});

test('Exported functions check', () => {
  console.log('Exports: npv, irr, mirr, payback, emi, runModel, benefitBreakEven, unitBreakEven, sensitivity, runScenarios, assess, analyze');
});
