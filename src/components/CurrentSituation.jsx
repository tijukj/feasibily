import React, { useState } from 'react';
import Card from './ui/Card';
import Field from './ui/Field';
import EditableTable from './ui/EditableTable';
import NumberInput from './ui/NumberInput';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function CurrentSituation({ project, updateProject, setActiveTab }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const data = project.currentSituation || { existingCosts: [], outsourcing: "", challenges: "", annualVolume: "" };

  const handleChange = (k, v) => {
    updateProject(p => ({ ...p, currentSituation: { ...p.currentSituation, [k]: v } }));
  };

  const handleAddCost = () => {
    const newCost = { id: `ec-${Date.now()}`, name: "New Cost Line", amount: 0 };
    handleChange('existingCosts', [...(data.existingCosts || []), newCost]);
  };

  const columns = [
    { key: 'name', label: 'Cost Description', type: 'text', placeholder: 'e.g. Current rent, Outsourcing fees' },
    { key: 'amount', label: 'Yearly Amount (₹)', type: 'number', prefix: '₹', width: '200px' }
  ];

  const handleTurnIntoSavings = () => {
    updateProject(p => {
      const existingBenefits = p.benefits || [];
      const newBenefits = [];
      const costs = p.currentSituation?.existingCosts || [];
      
      costs.forEach(cost => {
        if (!cost.amount) return;
        const name = `Saving: ${cost.name}`;
        // Skip duplicates
        if (existingBenefits.some(b => b.name === name)) return;
        
        newBenefits.push({
          id: `b-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
          name: name,
          kind: 'saving',
          basis: 'fixed',
          amount: cost.amount,
          confidencePct: 100,
          startYear: 1
        });
      });
      
      return { ...p, benefits: [...existingBenefits, ...newBenefits] };
    });
    
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 5000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-bold text-navy-900">Current Situation</h2>
          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs font-medium border border-slate-200">Optional</span>
        </div>
      </div>
      
      <p className="text-slate-600 mb-6">Record your existing operations to establish a baseline before the new project.</p>

      <Card title="Existing Annual Costs">
        <EditableTable 
          columns={columns}
          rows={data.existingCosts || []}
          onChange={v => handleChange('existingCosts', v)}
          onAdd={handleAddCost}
          onDelete={id => handleChange('existingCosts', data.existingCosts.filter(c => c.id !== id))}
          emptyMessage="No existing costs added. Click 'Add Row' to establish your baseline."
        />
        
        {data.existingCosts?.length > 0 && (
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <div className="font-medium text-slate-700">
              Total Existing Costs: <span className="font-bold text-navy-900 ml-2">₹{(data.existingCosts.reduce((acc, c) => acc + (parseFloat(c.amount) || 0), 0)).toLocaleString('en-IN')}</span>
            </div>
            <button 
              onClick={handleTurnIntoSavings}
              className="flex items-center text-sm font-medium px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded transition-colors"
            >
              Turn these costs into savings <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}

        {showConfirm && (
          <div className="mt-4 p-3 bg-green-50 text-green-800 border border-green-200 rounded flex items-center text-sm animate-fadeIn">
            <CheckCircle className="w-4 h-4 mr-2" />
            Savings added to Benefits! 
            <button onClick={() => setActiveTab('benefits')} className="ml-2 underline font-medium hover:text-green-900">Go to Benefits tab</button>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Outsourcing Details">
          <Field label="Who do you currently outsource to, and what are the fees?">
            <textarea 
              value={data.outsourcing} 
              onChange={e => handleChange('outsourcing', e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-navy-500 min-h-[100px] text-sm"
              placeholder="e.g. Currently paying Vendor X ₹5,00,000 per year for assembly..."
            />
          </Field>
        </Card>

        <Card title="Operational Challenges">
          <Field label="What issues will this project solve?">
            <textarea 
              value={data.challenges} 
              onChange={e => handleChange('challenges', e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-navy-500 min-h-[100px] text-sm"
              placeholder="e.g. Delays in delivery, high defect rate..."
            />
          </Field>
        </Card>
      </div>

      <Card title="Current Volume">
        <Field label="Annual Volume (Units/Transactions)" helperText="If applicable, how many units do you process yearly today?">
          <NumberInput value={data.annualVolume} onChange={v => handleChange('annualVolume', v)} className="max-w-md" />
        </Field>
      </Card>
    </div>
  );
}
