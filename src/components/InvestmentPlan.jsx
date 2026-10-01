import React from 'react';
import Card from './ui/Card';
import EditableTable from './ui/EditableTable';
import InfoTip from './ui/InfoTip';
import { formatINR } from '../utils/format';
import { ASSET_CATEGORIES, BOOK_LIFE_YEARS, GST_SLABS } from '../engine/indiaConfig';
import { getAssetCapitalCost } from '../engine/assetUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function InvestmentPlan({ project, updateProject, results }) {
  const assets = project.assets || [];
  const gstApplies = project.assumptions?.gstApplies !== false; // defaults to true
  const projectLife = project.project?.lifeYears || 5;

  const handleChange = (newAssets) => {
    // Intercept category changes to auto-fill bookLifeYears and itcClaimable
    const updatedAssets = newAssets.map(a => {
      const oldA = assets.find(o => o.id === a.id) || {};
      if (a.category !== oldA.category) {
        if (a.category === 'land') {
          return { ...a, bookLifeYears: 0, gstRatePct: 0, salvagePct: 100, itcClaimable: false };
        }
        const newLife = BOOK_LIFE_YEARS[a.category] || 10;
        const newItc = (a.category !== 'vehicle' && a.category !== 'building_commercial');
        return { ...a, bookLifeYears: newLife, itcClaimable: newItc };
      }
      // Re-enforce land rules if somehow changed
      if (a.category === 'land') {
        return { ...a, bookLifeYears: 0, gstRatePct: 0, salvagePct: 100, itcClaimable: false };
      }
      return a;
    });
    updateProject(p => ({ ...p, assets: updatedAssets }));
  };

  const handleAddAsset = () => {
    const newAsset = {
      id: `a-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
      name: "New Asset",
      category: 'plant_machinery',
      cost: 0,
      gstRatePct: 18,
      itcClaimable: true,
      year: 0,
      bookLifeYears: BOOK_LIFE_YEARS['plant_machinery'],
      salvagePct: 5
    };
    handleChange([...assets, newAsset]);
  };

  const columns = [
    { key: 'name', label: 'Asset Name', type: 'text', placeholder: 'e.g. Printing Machine', error: r => !r.name },
    { key: 'category', label: 'Category', type: 'select', options: ASSET_CATEGORIES.map(c => ({ value: c.key, label: c.label })) },
    { key: 'cost', label: 'Cost', type: 'number', prefix: '₹', error: r => r.cost === null || r.cost < 0 },
  ];

  if (gstApplies) {
    columns.push({ key: 'gstRatePct', label: 'GST %', type: 'select', options: GST_SLABS });
    columns.push({ 
      key: 'itcClaimable', 
      label: <div className="flex items-center">Claim GST Input <InfoTip text="Registered businesses can usually claim GST credit on equipment. Credit on cars and construction of buildings is often restricted. Confirm with your CA." /></div>, 
      type: 'checkbox' 
    });
  }

  columns.push(
    { key: 'year', label: 'Purchase Year (0=Start)', type: 'number', min: 0, max: projectLife, error: r => r.year < 0 || r.year > projectLife || r.year === null },
    { key: 'bookLifeYears', label: 'Useful Life (yrs)', type: 'number', min: 1, disabled: r => r.category === 'land', error: r => r.category !== 'land' && (!r.bookLifeYears || r.bookLifeYears < 1) },
    { key: 'salvagePct', label: 'Resale % at End', type: 'number', suffix: '%', min: 0, max: 100, error: r => r.salvagePct < 0 || r.salvagePct > 100 || r.salvagePct === null }
  );

  // Group investment by category
  const categoryTotals = {};
  assets.forEach(a => {
    const finalCost = getAssetCapitalCost(a, gstApplies);
    const catLabel = ASSET_CATEGORIES.find(c => c.key === a.category)?.label || a.category;
    categoryTotals[catLabel] = (categoryTotals[catLabel] || 0) + finalCost;
  });

  const chartData = results?.base?.years.slice(1).map(y => ({
    year: `Year ${y.year}`,
    bookDep: Math.round(y.bookDep)
  })) || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold text-navy-900">Investment Plan</h2>
      <p className="text-slate-600 mb-6">List all capital assets, equipment, and setup costs required for this project.</p>

      <Card>
        <EditableTable 
          columns={columns}
          rows={assets}
          onChange={handleChange}
          onAdd={handleAddAsset}
          onDelete={id => handleChange(assets.filter(a => a.id !== id))}
          onDuplicate={r => {
            const dup = JSON.parse(JSON.stringify(r));
            dup.id = `a-${Date.now()}`;
            dup.name = dup.name + " (Copy)";
            handleChange([...assets, dup]);
          }}
          emptyMessage="No assets planned yet. Click 'Add Row' to begin."
        />
      </Card>

      {results && assets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card title="Investment Summary">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Investment</span>
                  <span className="font-bold text-lg text-navy-900">{formatINR(results.base.metrics.totalInvestment)}</span>
                </div>
                {gstApplies && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Unclaimable GST Included</span>
                    <span className="font-medium text-slate-700">{formatINR(results.base.metrics.gstCostIncluded)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">First-Year Depreciation</span>
                  <span className="font-medium text-slate-700">{formatINR(results.base.years[1]?.bookDep || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Est. Resale Value (End)</span>
                  <span className="font-medium text-slate-700">{formatINR(results.base.metrics.salvage)}</span>
                </div>
              </div>
            </Card>

            <Card title="By Category">
              <div className="space-y-2">
                {Object.entries(categoryTotals).map(([cat, val]) => (
                  <div key={cat} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">{cat}</span>
                    <span className="font-medium text-navy-900">{formatINR(val)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card title="Accounting Depreciation (Straight-Line)" className="h-full flex flex-col">
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis tickFormatter={v => formatINR(v, true)} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <RechartsTooltip 
                      formatter={(val) => [formatINR(val), "Depreciation"]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="bookDep" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-400 mt-4 italic">
                * Depreciation shown here is the accounting (straight-line) view. For tax savings the model separately uses income-tax rates on a reducing balance.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
