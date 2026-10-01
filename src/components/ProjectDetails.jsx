import React, { useState } from 'react';
import Card from './ui/Card';
import Field from './ui/Field';
import TextInput from './ui/TextInput';
import SelectInput from './ui/SelectInput';
import NumberInput from './ui/NumberInput';
import InfoTip from './ui/InfoTip';
import { TAX_PRESETS } from '../engine/indiaConfig';
import { ChevronDown, ChevronRight } from 'lucide-react';

const INDUSTRIES = [
  "Manufacturing", "Retail", "Construction", "Logistics", 
  "Hospitality", "Healthcare", "Agriculture", "Renewable Energy", 
  "IT / SaaS", "Education", "Other"
];

const PROJECT_TYPES = [
  "New revenue project", "Cost saving / replacement", 
  "Expansion", "Capacity addition", "Other"
];

export default function ProjectDetails({ project, updateProject }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleProjChange = (k, v) => {
    updateProject(p => ({ ...p, project: { ...p.project, [k]: v } }));
  };

  const handleAssumpChange = (k, v) => {
    updateProject(p => ({ ...p, assumptions: { ...p.assumptions, [k]: v } }));
  };

  const { project: pData, assumptions: aData } = project;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-navy-900">Project Details</h2>
      </div>

      <Card title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Project Name" errorText={!pData.name ? "Required" : ""}>
            <TextInput value={pData.name} onChange={v => handleProjChange('name', v)} placeholder="e.g. Factory Expansion" />
          </Field>
          <Field label="Company Name" errorText={!pData.company ? "Required" : ""}>
            <TextInput value={pData.company} onChange={v => handleProjChange('company', v)} placeholder="e.g. Acme Corp" />
          </Field>
          <Field label="Industry">
            <SelectInput value={pData.industry} onChange={v => handleProjChange('industry', v)} options={INDUSTRIES} placeholder="Select industry..." />
          </Field>
          <Field label="Project Type">
            <SelectInput value={pData.projectType} onChange={v => handleProjChange('projectType', v)} options={PROJECT_TYPES} placeholder="Select type..." />
          </Field>
          <Field label="Project Life (Years)" errorText={!pData.lifeYears ? "Required (1-30)" : ""}>
            <NumberInput value={pData.lifeYears} onChange={v => handleProjChange('lifeYears', v)} min={1} max={30} suffix=" yrs" />
          </Field>
        </div>
      </Card>

      <Card title="Financial Assumptions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label={<>Discount Rate <InfoTip text="The minimum yearly return you expect. If unsure, use your loan interest rate plus a few points for risk."/></>}>
            <NumberInput value={aData.discountRatePct} onChange={v => handleAssumpChange('discountRatePct', v)} suffix="%" />
          </Field>
          <Field label={<>Inflation / Cost Increase <InfoTip text="Yearly expected increase in operating costs."/></>}>
            <NumberInput value={aData.inflationPct} onChange={v => handleAssumpChange('inflationPct', v)} suffix="%" />
          </Field>
          
          <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 pt-4 border-t border-slate-100">
            <div className="space-y-4">
              <label className="flex items-center space-x-2 font-medium text-slate-700">
                <input type="checkbox" checked={aData.taxEnabled} onChange={e => handleAssumpChange('taxEnabled', e.target.checked)} className="w-4 h-4 text-navy-600 rounded" />
                <span>Include income tax</span>
              </label>
              
              {aData.taxEnabled && (
                <div className="pl-6 space-y-3">
                  <SelectInput 
                    value={TAX_PRESETS.some(p => p.rate === aData.taxRatePct) ? aData.taxRatePct : "custom"} 
                    onChange={v => {
                      if (v !== "custom") handleAssumpChange('taxRatePct', parseFloat(v));
                    }}
                    options={[...TAX_PRESETS.map(p => ({value: p.rate, label: `${p.label} (${p.rate}%)`})), {value: 'custom', label: 'Custom rate'}]}
                  />
                  {!TAX_PRESETS.some(p => p.rate === aData.taxRatePct) && (
                    <NumberInput value={aData.taxRatePct} onChange={v => handleAssumpChange('taxRatePct', v)} suffix="%" placeholder="Enter custom rate %" />
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center space-x-2 font-medium text-slate-700">
                <input type="checkbox" checked={aData.gstApplies} onChange={e => handleAssumpChange('gstApplies', e.target.checked)} className="w-4 h-4 text-navy-600 rounded" />
                <span>Include GST in investment costs</span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center text-navy-700 font-medium hover:text-navy-900">
          {showAdvanced ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
          Advanced Settings
        </button>
        
        {showAdvanced && (
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            <Field label="Working Capital (% of yearly benefits)">
              <NumberInput value={aData.nwcPct} onChange={v => handleAssumpChange('nwcPct', v)} suffix="%" />
            </Field>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Capacity Ramp-up (%)</label>
              <div className="flex space-x-2">
                {[1, 2, 3].map(yr => {
                  const val = aData.rampUp && aData.rampUp[yr-1] !== undefined ? aData.rampUp[yr-1] * 100 : 100;
                  return (
                    <div key={yr} className="flex-1">
                      <span className="text-xs text-slate-500 mb-1 block">Year {yr}</span>
                      <NumberInput 
                        value={val} 
                        onChange={v => {
                          const newRamp = [...(aData.rampUp || [1, 1, 1])];
                          newRamp[yr-1] = v / 100;
                          handleAssumpChange('rampUp', newRamp);
                        }} 
                        suffix="%" 
                        min={0} 
                        max={100}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
