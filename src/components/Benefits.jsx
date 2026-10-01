import React from 'react';
import Card from './ui/Card';
import EditableTable from './ui/EditableTable';
import BenefitsVsOpexChart from './ui/BenefitsVsOpexChart';
import InfoTip from './ui/InfoTip';
import { formatINR } from '../utils/format';
import { AlertTriangle } from 'lucide-react';

const BENEFIT_TYPES = [
  "Revenue increase",
  "Cost saving",
  "Productivity gain",
  "Waste reduction",
  "Other"
];

const TYPE_MAPPING = {
  "Revenue increase": { kind: "revenue", confidencePct: 100 },
  "Cost saving": { kind: "saving", confidencePct: 100 },
  "Productivity gain": { kind: "other", confidencePct: 80 },
  "Waste reduction": { kind: "other", confidencePct: 80 },
  "Other": { kind: "other", confidencePct: 80 }
};

export default function Benefits({ project, updateProject, results }) {
  const benefits = project.benefits || [];
  const projectLife = project.project?.lifeYears || 5;

  const handleChange = (newBenefits) => {
    // Intercept category changes to auto-fill kind and confidence, and fix contributionPct
    const updated = newBenefits.map(b => {
      const oldB = benefits.find(o => o.id === b.id) || {};
      
      let mapped = { ...b };
      
      if (b.category !== oldB.category) {
        const mapping = TYPE_MAPPING[b.category] || TYPE_MAPPING["Other"];
        mapped.kind = mapping.kind;
        mapped.confidencePct = mapping.confidencePct;
        if (b.category !== "Revenue increase") {
          mapped.contributionPct = null;
        } else if (b.category === "Revenue increase" && !mapped.contributionPct) {
          mapped.contributionPct = 100;
        }
      }

      // Handle basis based on growthPct
      const growth = parseFloat(mapped.growthPct) || 0;
      mapped.basis = growth !== 0 ? 'growth' : 'fixed';

      return mapped;
    });
    updateProject(p => ({ ...p, benefits: updated }));
  };

  const handleAddRow = () => {
    handleChange([...benefits, {
      id: `b-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
      name: "New Benefit",
      category: "Revenue increase",
      kind: "revenue",
      basis: "fixed",
      amount: 0,
      growthPct: 0,
      contributionPct: 100,
      confidencePct: 100,
      startYear: null,
      endYear: null
    }]);
  };

  const columns = [
    { key: 'name', label: 'Name', type: 'text', placeholder: 'e.g. Extra Sales', error: r => !r.name },
    { key: 'category', label: 'Type', type: 'select', options: BENEFIT_TYPES },
    { key: 'amount', label: 'Yearly amount', type: 'number', prefix: '₹', error: r => r.amount === null || r.amount < 0 },
    { key: 'growthPct', label: 'Grows every year by %', type: 'number', suffix: '%', min: -50, max: 100, placeholder: '0' },
    { key: 'contributionPct', label: <div className="flex items-center">Margin after direct costs % <InfoTip text="If you earn extra revenue, some of it goes to direct costs such as materials. Enter what share of revenue is left as contribution. Leave 100 if you enter direct costs as a separate cost line." /></div>, type: 'number', suffix: '%', min: 0, max: 100, disabled: r => r.category !== 'Revenue increase', placeholder: r => r.category === 'Revenue increase' ? '100' : '-' },
    { key: 'confidencePct', label: <div className="flex items-center">How sure are you % <InfoTip text="Lower this for benefits that are hard to measure. The model counts only this share of the amount." /></div>, type: 'number', suffix: '%', min: 0, max: 100, error: r => r.confidencePct === null || r.confidencePct < 0 || r.confidencePct > 100 },
    { key: 'startYear', label: 'Start year', type: 'number', min: 1, max: projectLife, placeholder: '1', error: r => r.startYear && (r.startYear < 1 || r.startYear > projectLife) },
    { key: 'endYear', label: 'End year', type: 'number', min: 1, max: projectLife, placeholder: String(projectLife), error: r => r.endYear && (r.endYear < 1 || r.endYear > projectLife || (r.startYear && r.endYear < r.startYear)) }
  ];

  let softBenefitsTotal = 0;
  let allBenefitsTotal = 0;

  benefits.forEach(b => {
    const val = (parseFloat(b.amount) || 0) * ((parseFloat(b.confidencePct) || 0) / 100);
    allBenefitsTotal += val;
    if (b.kind === 'other') {
      softBenefitsTotal += val;
    }
  });

  const softSharePct = allBenefitsTotal > 0 ? (softBenefitsTotal / allBenefitsTotal) * 100 : 0;
  const showSoftWarning = softSharePct > 40;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-navy-900">Benefits</h2>
      </div>
      <p className="text-slate-600 mb-4">List the expected financial returns, cost savings, and productivity gains from this project.</p>

      <Card>
        <EditableTable 
          columns={columns}
          rows={benefits}
          onChange={handleChange}
          onAdd={handleAddRow}
          onDelete={id => handleChange(benefits.filter(a => a.id !== id))}
          onDuplicate={r => {
            const dup = JSON.parse(JSON.stringify(r));
            dup.id = `b-${Date.now()}`;
            dup.name = dup.name + " (Copy)";
            handleChange([...benefits, dup]);
          }}
          emptyMessage="No benefits added. Click 'Add Row' to begin."
        />
      </Card>

      {results && results.base && benefits.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-1 space-y-6">
            <Card title="Benefits Summary">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Year-1 Net Benefits</span>
                  <span className="font-bold text-lg text-navy-900">{formatINR(results.base.years[1]?.cashBenefits || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Year-{projectLife} Net Benefits</span>
                  <span className="font-medium text-slate-700">{formatINR(results.base.years[projectLife]?.cashBenefits || 0)}</span>
                </div>
                
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-slate-500">Share from soft benefits</span>
                    <span className={`font-medium ${showSoftWarning ? 'text-amber-600' : 'text-slate-700'}`}>
                      {softSharePct.toFixed(1)}%
                    </span>
                  </div>
                  {showSoftWarning && (
                    <div className="flex items-start text-xs text-amber-700 bg-amber-50 p-2 rounded">
                      <AlertTriangle className="w-4 h-4 mr-1 shrink-0" />
                      <span>Many of your benefits are hard to measure. Check the Risk Analysis tab.</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card title="Benefits vs Operating Costs by Year" className="h-full flex flex-col">
              <div className="flex-1 min-h-[300px]">
                <BenefitsVsOpexChart results={results} />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
