import React, { useState } from 'react';
import Card from './ui/Card';
import Field from './ui/Field';
import NumberInput from './ui/NumberInput';
import InfoTip from './ui/InfoTip';
import { formatINR, formatPct, formatPayback, formatNumber, isInvalid } from '../utils/format.js';
import { CheckCircle2, XCircle, AlertTriangle, Info, Settings2, Calculator, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { unitBreakEven } from '../engine/engine.js';

function formatMoney(val, useLakhs) {
  if (isInvalid(val)) return '-';
  const prefix = val < 0 ? '(' : '';
  const suffix = val < 0 ? ')' : '';
  const numStr = formatINR(Math.abs(val), useLakhs);
  return `${prefix}${numStr}${suffix}`;
}

export default function FinancialAnalysis({ project, updateProject, setActiveTab, results }) {
  const [useLakhs, setUseLakhs] = useState(true);
  const [showFinancing, setShowFinancing] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showUnits, setShowUnits] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Units break even local state
  const [unitsData, setUnitsData] = useState({ fixedCostsPerYear: '', pricePerUnit: '', variableCostPerUnit: '' });
  
  if (!results || !results.base) return null;

  const { verdict, risk, checks, breakEven, worstCaseNpv, base } = results;
  const metrics = base.metrics;
  const years = base.years;

  const isGo = verdict === 'Go';
  const isNoGo = verdict === 'No-go';
  const verdictColor = isGo ? 'bg-green-50 border-green-200 text-green-900' : isNoGo ? 'bg-red-50 border-red-200 text-red-900' : 'bg-amber-50 border-amber-200 text-amber-900';
  
  let verdictText = "Positive value, but some checks failed.";
  if (isGo) verdictText = "This project clears all your checks.";
  if (isNoGo) verdictText = "This project does not earn back its cost at your discount rate.";

  const sumFcfYears = years.slice(1).reduce((sum, y) => sum + y.fcf, 0);
  const nullIrrReason = sumFcfYears <= 0 
    ? "The project never earns back its investment, so no return rate exists."
    : "Cash flows do not change sign, so no return rate can be calculated.";

  const handleFinancingChange = (key, val) => {
    updateProject(prev => {
      const f = prev.assumptions.financing || { enabled: false, loanPct: 0, interestPct: 0, tenorYears: 0 };
      return { ...prev, assumptions: { ...prev.assumptions, financing: { ...f, [key]: val } } };
    });
  };

  const financing = project.assumptions?.financing || { enabled: false, loanPct: 0, interestPct: 0, tenorYears: 0 };
  const thresholds = project.thresholds || {};

  const handleThresholdChange = (key, val) => {
    updateProject(prev => ({ ...prev, thresholds: { ...(prev.thresholds || {}), [key]: val } }));
  };

  const unitsResult = unitsData.fixedCostsPerYear !== '' && unitsData.pricePerUnit !== '' && unitsData.variableCostPerUnit !== ''
    ? unitBreakEven({
        fixedCostsPerYear: Number(unitsData.fixedCostsPerYear),
        pricePerUnit: Number(unitsData.pricePerUnit),
        variableCostPerUnit: Number(unitsData.variableCostPerUnit)
      })
    : null;

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* VERDICT BANNER */}
      <div className={`p-6 rounded-xl border-2 ${verdictColor} shadow-sm`}>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-3xl font-black mb-2 uppercase tracking-tight">{verdict}</h2>
            <p className="text-lg font-medium opacity-90 mb-6">{verdictText}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {checks.map((c, i) => (
                <div key={i} className="flex items-center text-sm font-medium">
                  {c.pass ? <CheckCircle2 className="w-5 h-5 mr-2 text-green-600 shrink-0" /> : <XCircle className="w-5 h-5 mr-2 text-red-500 shrink-0" />}
                  <span className="opacity-90">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/60 p-4 rounded-lg min-w-[200px] border border-black/5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold uppercase tracking-wider opacity-70">Risk Level</span>
              <InfoTip text="High if value is not positive or benefits can fall less than 10% before it stops paying off; Low if the worst case is still positive and benefits can fall at least 25%; otherwise Medium." />
            </div>
            <div className={`text-xl font-bold ${risk === 'High' ? 'text-red-600' : risk === 'Low' ? 'text-green-600' : 'text-amber-600'}`}>
              {risk}
            </div>
          </div>
        </div>
      </div>

      {/* ACTION PANELS */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => setShowFinancing(!showFinancing)} className={`px-4 py-2 rounded-full text-sm font-bold flex items-center border transition-colors ${showFinancing ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-navy-700 border-slate-300 hover:bg-slate-50'}`}>
          <Calculator className="w-4 h-4 mr-2" /> Financing {financing.enabled && <span className="ml-2 w-2 h-2 rounded-full bg-green-400"></span>}
        </button>
        <button onClick={() => setShowRules(!showRules)} className={`px-4 py-2 rounded-full text-sm font-bold flex items-center border transition-colors ${showRules ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-navy-700 border-slate-300 hover:bg-slate-50'}`}>
          <Settings2 className="w-4 h-4 mr-2" /> Decision rules
        </button>
        <button onClick={() => setShowUnits(!showUnits)} className={`px-4 py-2 rounded-full text-sm font-bold flex items-center border transition-colors ${showUnits ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-navy-700 border-slate-300 hover:bg-slate-50'}`}>
          <Calculator className="w-4 h-4 mr-2" /> Units break-even
        </button>
        <button onClick={() => setShowHelp(!showHelp)} className={`px-4 py-2 rounded-full text-sm font-bold flex items-center border transition-colors ${showHelp ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-navy-700 border-slate-300 hover:bg-slate-50'}`}>
          <HelpCircle className="w-4 h-4 mr-2" /> How to read this
        </button>
      </div>

      {/* PANELS CONTENT */}
      <div className="space-y-4">
        {showFinancing && (
          <Card title="Financing">
            <div className="space-y-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={financing.enabled} onChange={(e) => handleFinancingChange('enabled', e.target.checked)} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${financing.enabled ? 'bg-navy-600' : 'bg-slate-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${financing.enabled ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <span className="font-medium text-slate-700">Use a loan</span>
              </label>

              {financing.enabled ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Field label="Loan amount (% of Year 0 investment)">
                      <NumberInput value={financing.loanPct} onChange={v => handleFinancingChange('loanPct', v)} suffix="%" max={100} />
                    </Field>
                    <Field label="Interest rate">
                      <NumberInput value={financing.interestPct} onChange={v => handleFinancingChange('interestPct', v)} suffix="%" />
                    </Field>
                    <Field label="Tenor (years)">
                      <NumberInput value={financing.tenorYears} onChange={v => handleFinancingChange('tenorYears', v)} max={project.project.lifeYears} />
                    </Field>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase">Loan Impact</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Loan amount</span>
                        <span className="font-bold">{formatINR(results.base.financing.loanAmount, true)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Yearly instalment (EMI)</span>
                        <span className="font-bold">{formatINR(results.base.financing.emi, true)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Return on Equity</span>
                        <span className="font-bold">{formatPct(results.base.financing.equityIrr)}</span>
                      </div>
                      <div className="pt-3 border-t flex justify-between items-center">
                        <span className="text-slate-500 flex items-center">Min Debt Cover <InfoTip text="Debt service cover is cash available divided by loan repayments. Banks usually look for at least 1.25." /></span>
                        <span className={`font-bold ${!results.base.financing.minDscr ? '' : results.base.financing.minDscr < 1.0 ? 'text-red-600' : results.base.financing.minDscr <= 1.25 ? 'text-amber-600' : 'text-green-600'}`}>
                          {formatNumber(results.base.financing.minDscr, 2)}x
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Avg Debt Cover</span>
                        <span className="font-bold">{formatNumber(results.base.financing.avgDscr, 2)}x</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded">
                  Using a loan changes your exact cash required upfront and alters the risk profile. Turn this on to calculate debt service coverage and returns on equity.
                </p>
              )}
            </div>
          </Card>
        )}

        {showRules && (
          <Card title="Decision Rules">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Maximum acceptable payback (years)" helperText={`Default is half of project life (${formatNumber(project.project.lifeYears / 2, 1)} years)`}>
                <NumberInput value={thresholds.maxPaybackYears} onChange={v => handleThresholdChange('maxPaybackYears', v)} placeholder={formatNumber(project.project.lifeYears / 2, 1)} />
              </Field>
              <Field label="Minimum Profitability Index" helperText="Default is 1.0">
                <NumberInput value={thresholds.minPI} onChange={v => handleThresholdChange('minPI', v)} placeholder="1.0" />
              </Field>
            </div>
            <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm flex items-start">
              <Info className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
              <div>
                The return-rate check uses your discount rate of <strong>{formatPct(project.assumptions.discountRatePct / 100)}</strong>. 
                You can change this in <button onClick={() => setActiveTab('details')} className="underline font-bold hover:text-blue-900">Project Details</button>.
              </div>
            </div>
          </Card>
        )}

        {showUnits && (
          <Card title="Units Break-Even">
            <p className="text-sm text-slate-500 mb-6">Calculate how many units you need to sell per year to cover fixed costs.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Field label="Yearly fixed costs">
                <NumberInput value={unitsData.fixedCostsPerYear} onChange={v => setUnitsData(d => ({ ...d, fixedCostsPerYear: v }))} prefix="₹" />
              </Field>
              <Field label="Price per unit">
                <NumberInput value={unitsData.pricePerUnit} onChange={v => setUnitsData(d => ({ ...d, pricePerUnit: v }))} prefix="₹" />
              </Field>
              <Field label="Variable cost per unit">
                <NumberInput value={unitsData.variableCostPerUnit} onChange={v => setUnitsData(d => ({ ...d, variableCostPerUnit: v }))} prefix="₹" />
              </Field>
            </div>
            {unitsResult ? (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-sm text-slate-500 mb-1">Contribution per unit: <strong className={unitsResult.contributionPerUnit > 0 ? 'text-green-600' : 'text-red-600'}>{formatINR(unitsResult.contributionPerUnit)}</strong></div>
                <div className="text-lg">
                  Break-even volume: <strong>{formatNumber(unitsResult.units, 0)} units/year</strong>
                </div>
              </div>
            ) : (unitsData.fixedCostsPerYear !== '' && unitsData.pricePerUnit !== '' && unitsData.variableCostPerUnit !== '') ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Variable cost is higher than price! You lose money on every unit, so you can never break even.
              </div>
            ) : null}
          </Card>
        )}

        {showHelp && (
          <Card title="How to read this page">
            <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
              <p><strong>Verdict:</strong> A high-level decision based on your defined rules. A project should ideally have a positive NPV and a return rate higher than your discount rate.</p>
              <p><strong>Net Present Value (NPV):</strong> The absolute value added by this project in today's money. If it's above zero, the project creates wealth.</p>
              <p><strong>Internal Rate of Return (IRR):</strong> The percentage return generated by the cash flows. Compare this to what you could earn elsewhere (your discount rate).</p>
              <p><strong>Payback:</strong> How long it takes to get your initial investment back from the net cash flows.</p>
              <p><strong>Benefit break-even:</strong> Measures your safety margin. If it says 20%, it means your expected benefits can fall by 20% and the project will still break even.</p>
            </div>
          </Card>
        )}
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Net Present Value</h3>
          <div className={`text-2xl font-black mb-2 ${metrics.npv >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatINR(metrics.npv, true)}
          </div>
          <p className="text-xs text-slate-500 leading-tight">Value created, in today's money, after earning your required return.</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Return Rate (IRR)</h3>
          <div className={`text-2xl font-black mb-2 ${metrics.irr >= metrics.discountRate ? 'text-green-600' : metrics.irr !== null ? 'text-amber-600' : 'text-slate-500'}`}>
            {formatPct(metrics.irr)}
          </div>
          {metrics.irr === null ? (
            <p className="text-xs text-slate-500 leading-tight">{nullIrrReason}</p>
          ) : (
            <p className="text-xs text-slate-500 leading-tight">The yearly return the project earns on its investment.</p>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Modified Return (MIRR)</h3>
          <div className="text-2xl font-black mb-2 text-navy-700">
            {formatPct(metrics.mirr)}
          </div>
          <p className="text-xs text-slate-500 leading-tight">A more cautious return that assumes profits are reinvested at your discount rate.</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Payback</h3>
          <div className="text-2xl font-black mb-2 text-navy-700">
            {formatPayback(metrics.paybackYears)}
          </div>
          <p className="text-xs text-slate-500 leading-tight">Discounted: {formatPayback(metrics.discountedPaybackYears)}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Profitability Index</h3>
          <div className={`text-2xl font-black mb-2 ${metrics.pi >= 1 ? 'text-green-600' : 'text-red-600'}`}>
            {formatNumber(metrics.pi, 2)}
          </div>
          <p className="text-xs text-slate-500 leading-tight">Value per rupee invested; above 1.0 is good.</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">ROI (Total)</h3>
          <div className={`text-2xl font-black mb-2 ${metrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPct(metrics.roi)}
          </div>
          <p className="text-xs text-slate-500 leading-tight">Total net gain as a share of total investment.</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Avg Yearly ROI</h3>
          <div className="text-2xl font-black mb-2 text-navy-700">
            {formatPct(metrics.accountingRoi)}
          </div>
          <p className="text-xs text-slate-500 leading-tight">Based on average accounting profit and investment.</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Benefit Break-Even</h3>
          <div className="text-2xl font-black mb-2 text-navy-700">
            {isInvalid(breakEven.multiplier) ? 'Not applicable' : breakEven.marginOfSafety === 1 ? 'Zero required' : formatPct(breakEven.marginOfSafety)}
          </div>
          <p className="text-xs text-slate-500 leading-tight">
            {breakEven.marginOfSafety === 1 ? 'Pays off even without ongoing benefits' : isInvalid(breakEven.multiplier) ? 'The project never pays off' : `Benefits can fall ${(breakEven.marginOfSafety * 100).toFixed(1)}% before the project stops paying off`}
          </p>
        </div>
      </div>

      {/* CASH FLOW TABLE */}
      <Card title={
        <div className="flex justify-between items-center w-full">
          <span>Annual Cash Flow</span>
          <label className="flex items-center space-x-2 text-sm font-normal cursor-pointer">
            <span className={!useLakhs ? 'text-navy-900 font-bold' : 'text-slate-500'}>Full ₹</span>
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={useLakhs} onChange={(e) => setUseLakhs(e.target.checked)} />
              <div className="block bg-slate-300 w-8 h-5 rounded-full"></div>
              <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${useLakhs ? 'transform translate-x-3 bg-navy-600' : ''}`}></div>
            </div>
            <span className={useLakhs ? 'text-navy-900 font-bold' : 'text-slate-500'}>Lakhs / Cr</span>
          </label>
        </div>
      }>
        <div className="overflow-x-auto -mx-6 px-6 pb-4">
          <table className="w-full text-sm text-right whitespace-nowrap">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="text-slate-500 uppercase text-xs border-b-2">
                <th className="py-3 px-4 font-bold text-left">Year</th>
                <th className="py-3 px-4 font-bold">Benefits</th>
                <th className="py-3 px-4 font-bold">Operating Costs</th>
                <th className="py-3 px-4 font-bold">Operating Profit</th>
                <th className="py-3 px-4 font-bold">Tax</th>
                <th className="py-3 px-4 font-bold">Investment</th>
                <th className="py-3 px-4 font-black text-navy-900 bg-slate-50">Net Cash Flow</th>
                <th className="py-3 px-4 font-bold">Cumulative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {years.map((y) => {
                const isPaybackRow = metrics.paybackYears !== null && Math.ceil(metrics.paybackYears) === y.year && y.year > 0;
                return (
                  <tr key={y.year} className={`hover:bg-slate-50 transition-colors ${isPaybackRow ? 'bg-green-50/50' : ''}`}>
                    <td className="py-3 px-4 text-left font-medium text-slate-700">
                      {y.year === 0 ? 'Year 0' : `Year ${y.year}`}
                      {isPaybackRow && <span className="ml-2 text-[10px] font-bold bg-green-200 text-green-800 px-1.5 py-0.5 rounded uppercase tracking-wider">Payback</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatMoney(y.cashBenefits, useLakhs)}</td>
                    <td className="py-3 px-4 text-slate-600">{formatMoney(-y.opex, useLakhs)}</td>
                    <td className="py-3 px-4 font-medium">{formatMoney(y.ebitda, useLakhs)}</td>
                    <td className="py-3 px-4 text-slate-600">{formatMoney(-y.tax, useLakhs)}</td>
                    <td className="py-3 px-4 text-slate-600">{formatMoney(-y.capex, useLakhs)}</td>
                    <td className={`py-3 px-4 font-bold bg-slate-50/50 ${y.fcf < 0 ? 'text-red-600' : 'text-navy-900'}`}>{formatMoney(y.fcf, useLakhs)}</td>
                    <td className={`py-3 px-4 font-medium ${y.cumFcf < 0 ? 'text-red-500' : 'text-green-600'}`}>{formatMoney(y.cumFcf, useLakhs)}</td>
                  </tr>
                );
              })}
              {/* Totals Row */}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <td className="py-4 px-4 text-left text-navy-900">Total</td>
                <td className="py-4 px-4 text-navy-900">{formatMoney(years.reduce((s, y) => s + y.cashBenefits, 0), useLakhs)}</td>
                <td className="py-4 px-4 text-navy-900">{formatMoney(years.reduce((s, y) => s - y.opex, 0), useLakhs)}</td>
                <td className="py-4 px-4 text-navy-900">{formatMoney(years.reduce((s, y) => s + y.ebitda, 0), useLakhs)}</td>
                <td className="py-4 px-4 text-navy-900">{formatMoney(years.reduce((s, y) => s - y.tax, 0), useLakhs)}</td>
                <td className="py-4 px-4 text-navy-900">{formatMoney(years.reduce((s, y) => s - y.capex, 0), useLakhs)}</td>
                <td className={`py-4 px-4 font-black ${years.reduce((s, y) => s + y.fcf, 0) < 0 ? 'text-red-600' : 'text-navy-900'}`}>{formatMoney(years.reduce((s, y) => s + y.fcf, 0), useLakhs)}</td>
                <td className="py-4 px-4 text-slate-400">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
