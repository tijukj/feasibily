import test from 'node:test';
import assert from 'node:assert';
import { normalizeInput } from './normalizeInput.js';
import { analyze } from './engine.js';

test('normalizeInput blank-input safety', (t) => {
  const dirty = {
    project: { lifeYears: "" },
    assumptions: {
      discountRatePct: "",
      inflationPct: "",
      taxRatePct: null,
      rampUp: ["", 0.5, null]
    },
    assets: [
      { name: "A", cost: "1250000", gstRatePct: "", year: "", bookLifeYears: "", salvagePct: "" },
      { name: "", cost: "100" } // should be dropped
    ],
    opex: [
      { name: "O", amount: "1000", escalationPct: "", startYear: "", endYear: "" }
    ],
    benefits: [
      { name: "B", amount: "2000", growthPct: "", contributionPct: "", confidencePct: "", startYear: "", endYear: "" }
    ]
  };

  const clean = normalizeInput(dirty);

  assert.strictEqual(clean.project.lifeYears, undefined);
  assert.strictEqual(clean.assumptions.discountRatePct, undefined);
  assert.strictEqual(clean.assumptions.rampUp[0], 1);
  assert.strictEqual(clean.assumptions.rampUp[1], 0.5);
  assert.strictEqual(clean.assumptions.rampUp[2], 1);

  assert.strictEqual(clean.assets.length, 1);
  assert.strictEqual(clean.assets[0].cost, 1250000);
  assert.strictEqual(clean.assets[0].year, undefined);

  assert.strictEqual(clean.opex[0].amount, 1000);
  assert.strictEqual(clean.opex[0].escalationPct, undefined);
  assert.strictEqual(clean.opex[0].startYear, undefined);
  assert.strictEqual(clean.opex[0].endYear, undefined);

  assert.strictEqual(clean.benefits[0].amount, 2000);
  assert.strictEqual(clean.benefits[0].contributionPct, undefined);
  assert.strictEqual(clean.benefits[0].confidencePct, undefined);

  const clean2 = normalizeInput({
    project: { lifeYears: "  " },
    assumptions: { inflationPct: "  ", taxRatePct: "  " },
    assets: [
      { name: "A", cost: "100", salvagePct: " ", bookLifeYears: " ", year: " " }
    ],
    opex: [
      { name: "O", amount: "10", escalationPct: "  ", startYear: "  ", endYear: "  " }
    ],
    benefits: [
      { name: "B", amount: "20", contributionPct: "  ", confidencePct: "  " }
    ]
  });

  assert.strictEqual(clean2.project.lifeYears, undefined);
  assert.strictEqual(clean2.assets[0].salvagePct, undefined);
  assert.strictEqual(clean2.opex[0].escalationPct, undefined);
  assert.strictEqual(clean2.opex[0].startYear, undefined);
  assert.strictEqual(clean2.opex[0].endYear, undefined);
  assert.strictEqual(clean2.benefits[0].contributionPct, undefined);
});

test('Behaviour tests: analyze after normalizeInput', (t) => {
  const dirty = {
    project: { lifeYears: 3 }, 
    assumptions: { taxEnabled: true, taxRatePct: " ", inflationPct: 5, rampUp: ["", ""] },
    assets: [
      { name: "Mac", cost: "1000", salvagePct: " ", bookLifeYears: " " }
    ], 
    opex: [
      { name: "O", amount: "100", escalationPct: " " } // blank escalation
    ], 
    benefits: [
      { name: "Rev", amount: "1000", kind: "revenue", contributionPct: " ", confidencePct: " " }
    ]
  };

  const clean = analyze(normalizeInput(dirty));
  
  // blank escalationPct uses inflationPct (which is 5)
  // Opex yr 1 = 100, yr 2 = 100 * 1.05 = 105
  assert.strictEqual(clean.base.years[2].opex, 105);

  // blank rampUp does not zero benefits
  assert.strictEqual(clean.base.years[1].cashBenefits, 1000); // 100% * 1000

  // blank salvagePct uses defaults (5%) -> salvage of 1000 is 50
  assert.strictEqual(clean.base.metrics.salvage, 50);

  // blank bookLifeYears uses defaults (10 for 'other' fallback usually)
  // Dep for 1000 - 50 = 950. 950 / 10 = 95.
  assert.strictEqual(clean.base.years[1].bookDep, 95);

  const blankLife = normalizeInput({ project: { lifeYears: " " } });
  assert.strictEqual(blankLife.project.lifeYears, undefined);
  // The UI validation check will render the validation message because lifeYears is undefined.
});

test('Demonstrate Bug Regression Test', (t) => {
  const dirty = {
    project: { lifeYears: " " },
    assumptions: { taxEnabled: true, taxRatePct: " " },
    assets: [], opex: [], benefits: [
      { name: "Rev", amount: "1000", kind: "revenue", contributionPct: " ", confidencePct: " " }
    ]
  };

  // With normalizeInput, it passes:
  const clean = analyze(normalizeInput(dirty));
  assert.strictEqual(clean.base.years[1].cashBenefits, 1000);

  // Without normalizeInput, it fails:
  const dirtyResult = analyze(dirty);
  assert.strictEqual(dirtyResult.base.years[1].cashBenefits, 0);
});
