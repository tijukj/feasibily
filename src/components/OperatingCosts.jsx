import React from 'react';
import Card from './ui/Card';
import EditableTable from './ui/EditableTable';
import BenefitsVsOpexChart from './ui/BenefitsVsOpexChart';
import InfoTip from './ui/InfoTip';
import { formatINR } from '../utils/format';
import { AlertTriangle } from 'lucide-react';

const STANDARD_CATEGORIES = [
  "Labour", "Utilities", "Maintenance", "Raw Materials", "Rent", 
  "Software", "Insurance", "Logistics", "Marketing", "Other"
];

const BASIS_OPTIONS = [
  { value: 'fixed', label: 'Fixed every year' },
  { value: 'variable', label: 'Changes with activity' },
  { value: 'pctRevenue', label: '% of revenue' }
];

export default function OperatingCosts({ project, updateProject, results }) {
  const opex = project.opex || [];
  const projectLife = project.project?.lifeYears || 5;

  const handleChange = (newOpex) => {
    updateProject(p => ({ ...p, opex: newOpex }));
  };

  const handleToggleNoCosts = (e) => {
    updateProject(p => ({ ...p, project: { ...p.project, noOperatingCosts: e.target.checked } }));
  };

  const handleAddRow = () => {
    handleChange([...opex, {
      id: `o-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
      name: "New Cost",
      category: "Other",
      basis: "fixed",
      amount: 0,
      escalationPct: null,
      startYear: null,
      endYear: null
    }]);
  };

  const noOperatingCosts = !!project.project?.noOperatingCosts;

  const customCats = Array.from(new Set(opex.map(o => o.category).filter(c => c && !STANDARD_CATEGORIES.includes(c))));
  const allCategories = [...STANDARD_CATEGORIES, ...customCats];

  const hasPct = opex.some(o => o.basis === 'pctRevenue');
  const hasRev = project.benefits?.some(b => b.kind === 'revenue');
  const showRevWarning = hasPct && !hasRev;

  const columns = [
    { key: 'name', label: 'Name', type: 'text', placeholder: 'e.g. Rent', error: r => !r.name },
    { key: 'category', label: 'Category', type: 'text', listId: 'opex-cats', placeholder: 'Select or type...' },
    { key: 'basis', label: <div className="flex items-center">How it behaves <InfoTip text="Variable scales with how much of your capacity you actually use. Falls in the early ramp-up years and in scenarios with lower utilization." /></div>, type: 'select', options: BASIS_OPTIONS },
    { key: 'amount', label: hasPct ? 'Yearly amount / % of revenue' : 'Yearly amount', type: 'number', prefix: r => r.basis === 'pctRevenue' ? '' : '₹', suffix: r => r.basis === 'pctRevenue' ? '%' : '', max: r => r.basis === 'pctRevenue' ? 100 : undefined, error: r => r.amount === null || r.amount < 0 },
    { key: 'escalationPct', label: 'Yearly increase %', type: 'number', suffix: '%', min: -50, max: 100, placeholder: 'Default' },
    { key: 'startYear', label: 'Start year', type: 'number', min: 1, max: projectLife, placeholder: '1', error: r => r.startYear && (r.startYear < 1 || r.startYear > projectLife) },
    { key: 'endYear', label: 'End year', type: 'number', min: 1, max: projectLife, placeholder: String(projectLife), error: r => r.endYear && (r.endYear < 1 || r.endYear > projectLife || (r.startYear && r.endYear < r.startYear)) }
  ];

  // Derive estimated category breakdown (if no pctRevenue lines)
  const categoryTotals = {};
  if (!hasPct) {
    opex.forEach(o => {
      const cat = o.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (parseFloat(o.amount) || 0);
    });
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <datalist id="opex-cats">
        {allCategories.map(c => <option key={c} value={c} />)}
      </datalist>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-navy-900">Operating Costs</h2>
      </div>
      <p className="text-slate-600 mb-4">List the ongoing expenses required to run this project (e.g., salaries, utilities, rent).</p>

      <Card>
        <div className="mb-4 flex items-center">
          <input 
            type="checkbox" 
            id="no-costs"
            checked={noOperatingCosts} 
            onChange={handleToggleNoCosts} 
            className="w-4 h-4 text-navy-600 rounded border-slate-300 focus:ring-navy-500 mr-2" 
          />
          <label htmlFor="no-costs" className="text-sm font-medium text-slate-700 cursor-pointer">
            This project has no ongoing operating costs
          </label>
        </div>

        {showRevWarning && !noOperatingCosts && (
          <div className="mb-4 p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded flex items-center text-sm">
            <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
            <span>You have costs based on "% of revenue". This needs a Revenue increase line in <strong>Benefits</strong>.</span>
          </div>
        )}

        {!noOperatingCosts && (
          <EditableTable 
            columns={columns}
            rows={opex}
            onChange={handleChange}
            onAdd={handleAddRow}
            onDelete={id => handleChange(opex.filter(a => a.id !== id))}
            onDuplicate={r => {
              const dup = JSON.parse(JSON.stringify(r));
              dup.id = `o-${Date.now()}`;
              dup.name = dup.name + " (Copy)";
              handleChange([...opex, dup]);
            }}
            emptyMessage="No operating costs added. Click 'Add Row' to begin."
          />
        )}
      </Card>

      {results && results.base && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-1 space-y-6">
            <Card title="Operating Cost Summary">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Year-1 Operating Cost</span>
                  <span className="font-bold text-lg text-navy-900">{formatINR(results.base.years[1]?.opex || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Year-{projectLife} Operating Cost</span>
                  <span className="font-medium text-slate-700">{formatINR(results.base.years[projectLife]?.opex || 0)}</span>
                </div>
              </div>
            </Card>

            {!hasPct && Object.keys(categoryTotals).length > 0 && (
              <Card title="Year-1 Estimated by Category">
                <div className="space-y-2">
                  {Object.entries(categoryTotals).map(([cat, val]) => (
                    <div key={cat} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">{cat}</span>
                      <span className="font-medium text-navy-900">{formatINR(val)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
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
