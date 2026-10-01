export const initialProjectState = {
  schemaVersion: 1,
  project: { name: "New Project", company: "", industry: "", projectType: "", lifeYears: 5 },
  currentSituation: { existingCosts: [], outsourcing: "", challenges: "", annualVolume: "" },
  assumptions: { 
    discountRatePct: 12, 
    inflationPct: 0, 
    taxEnabled: false, 
    taxRatePct: 25.17,
    gstApplies: true, 
    nwcPct: 0, 
    rampUp: [],
    financing: { enabled: false, loanPct: 0, interestPct: 0, tenorYears: 0 } 
  },
  assets: [],
  opex: [],
  benefits: [],
  scenarios: [], 
  thresholds: {}
};
