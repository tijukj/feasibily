import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, Download, Plus, Copy, Trash2, Folder, PieChart, 
  TrendingUp, FileText, AlertCircle, BarChart2, Activity, Map, Database, X, CheckCircle2, Circle
} from 'lucide-react';
import { initialProjectState } from './store/initialState';
import { analyze } from './engine/engine.js';
import { normalizeInput } from './engine/normalizeInput.js';
import { APP_NAME } from './config';
import { formatINR } from './utils/format';
import StepNav from './components/ui/StepNav';

import ProjectDetails from './components/ProjectDetails';
import CurrentSituation from './components/CurrentSituation';
import InvestmentPlan from './components/InvestmentPlan';
import OperatingCosts from './components/OperatingCosts';
import Benefits from './components/Benefits';
import FinancialAnalysis from './components/FinancialAnalysis';
import RiskAnalysis from './components/RiskAnalysis';
import Reports from './components/Reports';

const exampleData = {
  id: 'example-1',
  schemaVersion: 1,
  project: { name: "Retail Outlet Example", company: "Generic Retail Co", industry: "Retail", projectType: "Expansion", lifeYears: 5 },
  currentSituation: { existingCosts: [], outsourcing: "", challenges: "", annualVolume: "" },
  assumptions: { discountRatePct: 12, inflationPct: 5, taxEnabled: true, taxRatePct: 25.17, gstApplies: true, nwcPct: 10, rampUp: [0.5, 0.8, 1, 1, 1], financing: { enabled: true, loanPct: 60, interestPct: 10, tenorYears: 3 } },
  assets: [
    { id: 'a1', name: 'Shop Fit-out', category: 'furniture', cost: 1200000, gstRatePct: 18, itcClaimable: true, year: 0, bookLifeYears: 10, salvagePct: 10 }
  ],
  opex: [
    { id: 'o1', name: 'Rent', category: 'fixed', basis: 'fixed', amount: 300000, escalationPct: 5, startYear: 1 },
    { id: 'o2', name: 'Staff', category: 'fixed', basis: 'fixed', amount: 450000, escalationPct: 8, startYear: 1 }
  ],
  benefits: [
    { id: 'b1', name: 'Retail Sales Revenue', kind: 'revenue', basis: 'growth', amount: 2500000, growthPct: 10, contributionPct: 100, confidencePct: 90, startYear: 1 }
  ],
  scenarios: [], thresholds: {}
};

const tabs = [
  { id: 'details', name: 'Project Details', icon: FileText, component: ProjectDetails, group: 'input' },
  { id: 'situation', name: 'Current Situation', icon: Map, component: CurrentSituation, group: 'input' },
  { id: 'investment', name: 'Investment Plan', icon: PieChart, component: InvestmentPlan, group: 'input' },
  { id: 'opex', name: 'Operating Costs', icon: Activity, component: OperatingCosts, group: 'input' },
  { id: 'benefits', name: 'Benefits', icon: TrendingUp, component: Benefits, group: 'input' },
  { id: 'financial', name: 'Financial Analysis', icon: BarChart2, component: FinancialAnalysis, group: 'output' },
  { id: 'risk', name: 'Risk Analysis', icon: AlertCircle, component: RiskAnalysis, group: 'output' },
  { id: 'reports', name: 'Reports', icon: FileText, component: Reports, group: 'output' },
];

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 5);
}

function LockedView({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
      <AlertCircle className="w-12 h-12 mb-4 text-slate-300" />
      <h2 className="text-xl font-medium text-slate-700 mb-2">{title} Locked</h2>
      <p>Please complete the earlier steps (Project Details, Investment, Opex, Benefits) first.</p>
    </div>
  );
}

function App() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('feasibly_projects_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.projects) return parsed;
      } catch (e) {}
    }
    const defaultProj = { id: generateId(), ...initialProjectState };
    return { projects: [defaultProj], activeProjectId: defaultProj.id };
  });

  const [activeTab, setActiveTab] = useState('details');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showExportTooltip, setShowExportTooltip] = useState(false);

  useEffect(() => {
    localStorage.setItem('feasibly_projects_v1', JSON.stringify(data));
    document.title = APP_NAME;
  }, [data]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsSettingsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const activeProject = data.projects.find(p => p.id === data.activeProjectId) || data.projects[0];

  // Validation logic
  const p = activeProject.project;
  const isDetailsComplete = !!(p.name && p.company && p.industry && p.projectType && p.lifeYears);
  const isSituationComplete = true; // Always optional/neutral
  const isInvestmentComplete = activeProject.assets && activeProject.assets.some(a => a.name && a.cost > 0);
  const isOpexComplete = activeProject.project?.noOperatingCosts || (activeProject.opex && activeProject.opex.some(o => o.name && o.amount > 0));
  const isBenefitsComplete = activeProject.benefits && activeProject.benefits.some(b => b.name && b.amount > 0);
  
  const isBaseComplete = isDetailsComplete && isInvestmentComplete && isOpexComplete && isBenefitsComplete;

  const getStatusIcon = (tabId) => {
    if (tabId === 'details') return isDetailsComplete ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-slate-600" />;
    if (tabId === 'situation') return <Circle className="w-4 h-4 text-slate-600 opacity-50" />;
    if (tabId === 'investment') return isInvestmentComplete ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-slate-600" />;
    if (tabId === 'opex') return isOpexComplete ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-slate-600" />;
    if (tabId === 'benefits') return isBenefitsComplete ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-slate-600" />;
    return null;
  };

  const updateActiveProject = (updater) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id === prev.activeProjectId) {
          return typeof updater === 'function' ? updater(p) : { ...p, ...updater };
        }
        return p;
      })
    }));
  };

  const createProject = () => {
    const newProj = { id: generateId(), ...initialProjectState };
    setData(prev => ({ projects: [...prev.projects, newProj], activeProjectId: newProj.id }));
    setActiveTab('details');
  };

  const duplicateProject = () => {
    const copy = JSON.parse(JSON.stringify(activeProject));
    copy.id = generateId();
    copy.project.name = copy.project.name + " (Copy)";
    setData(prev => ({ projects: [...prev.projects, copy], activeProjectId: copy.id }));
  };

  const deleteProject = (id) => {
    setData(prev => {
      const filtered = prev.projects.filter(p => p.id !== id);
      if (filtered.length === 0) {
        const newProj = { id: generateId(), ...initialProjectState };
        return { projects: [newProj], activeProjectId: newProj.id };
      }
      return { projects: filtered, activeProjectId: filtered[0].id };
    });
  };

  const loadExample = () => {
    const example = JSON.parse(JSON.stringify(exampleData));
    example.id = generateId();
    setData(prev => ({ projects: [...prev.projects, example], activeProjectId: example.id }));
    setIsSettingsOpen(false);
  };

  const clearData = () => {
    updateActiveProject({ ...initialProjectState });
    setIsSettingsOpen(false);
  };

  const exportProject = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeProject));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${activeProject.project.name || 'Project'}.json`);
    dlAnchorElem.click();
  };

  const importProject = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (imported.schemaVersion) {
          imported.id = generateId();
          setData(prev => ({ projects: [...prev.projects, imported], activeProjectId: imported.id }));
        } else {
          alert('Invalid project file');
        }
      } catch (err) {
        alert('Error parsing JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const results = useMemo(() => {
    if (!isBaseComplete) return null;
    try {
      const cleanProject = normalizeInput(activeProject);
      return analyze(cleanProject, cleanProject.thresholds || {});
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [activeProject, isBaseComplete]);

  const activeTabDef = tabs.find(t => t.id === activeTab) || tabs[0];
  const ActiveComponent = activeTabDef.component;
  const isLocked = activeTabDef.group === 'output' && !isBaseComplete;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-fadeIn">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold flex items-center"><Settings className="w-5 h-5 mr-2" /> Global Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="pt-4 border-t">
                <h3 className="font-bold mb-3 text-sm text-slate-500 uppercase tracking-wider">Data Management</h3>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => { if(window.confirm('Clear all data for this project?')) clearData(); }}
                    className="flex-1 flex items-center justify-center py-2 px-4 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Clear Data
                  </button>
                  <button 
                    onClick={loadExample}
                    className="flex-1 flex items-center justify-center py-2 px-4 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 rounded font-medium transition-colors"
                  >
                    <Database className="w-4 h-4 mr-2" /> Load Example
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-slate-50 flex justify-end rounded-b-xl">
              <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-2 bg-navy-600 text-white rounded hover:bg-navy-700 font-medium">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-64 bg-navy-900 text-white flex flex-col shadow-xl z-10 shrink-0">
        <div className="p-6 border-b border-navy-700">
          <div className="flex items-center space-x-3 mb-2">
            <BarChart2 className="w-8 h-8 text-accent-orange" />
            <h1 className="text-xl font-bold text-accent-orange leading-tight">{APP_NAME}</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Project Feasibility Tool</p>
        </div>
        
        {/* Project Selector */}
        <div className="p-4 bg-navy-800">
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Active Project</label>
          <select 
            value={data.activeProjectId} 
            onChange={(e) => setData(prev => ({...prev, activeProjectId: e.target.value}))}
            className="w-full bg-navy-900 border border-navy-600 rounded p-2 text-sm text-white mb-2"
          >
            {data.projects.map(p => (
              <option key={p.id} value={p.id}>{p.project.name || 'Unnamed Project'}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2 text-xs">
            <button onClick={createProject} className="flex items-center bg-navy-700 hover:bg-navy-600 px-2 py-1 rounded"><Plus className="w-3 h-3 mr-1"/> New</button>
            <button onClick={duplicateProject} className="flex items-center bg-navy-700 hover:bg-navy-600 px-2 py-1 rounded"><Copy className="w-3 h-3 mr-1"/> Dup</button>
            <button onClick={() => { if(window.confirm('Delete project?')) deleteProject(activeProject.id); }} className="flex items-center text-red-400 hover:bg-navy-700 px-2 py-1 rounded"><Trash2 className="w-3 h-3 mr-1"/> Del</button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs mt-2 pt-2 border-t border-navy-700">
            <button onClick={exportProject} className="flex items-center text-blue-300 hover:bg-navy-700 px-2 py-1 rounded"><Download className="w-3 h-3 mr-1"/> Export</button>
            <label className="flex items-center text-blue-300 hover:bg-navy-700 px-2 py-1 rounded cursor-pointer">
              <Folder className="w-3 h-3 mr-1"/> Import
              <input type="file" accept=".json" onChange={importProject} className="hidden" />
            </label>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto pt-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const locked = tab.group === 'output' && !isBaseComplete;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-6 py-3 text-left transition-colors ${
                  isActive 
                    ? 'bg-navy-800 border-r-4 border-accent-orange text-white' 
                    : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                } ${locked ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center">
                  <Icon className={`w-5 h-5 mr-3 shrink-0 ${isActive ? 'text-accent-orange' : 'text-slate-400'}`} />
                  <span className="font-medium text-sm leading-tight">{tab.name}</span>
                </div>
                {tab.group === 'input' && getStatusIcon(tab.id)}
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-navy-700 shrink-0 space-y-3">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center justify-center py-2 px-4 bg-navy-800 hover:bg-navy-700 rounded text-sm transition-colors text-slate-300"
          >
            <Settings className="w-4 h-4 mr-2 shrink-0" />
            Settings
          </button>
          <div className="relative group">
            <button 
              className="w-full flex items-center justify-center py-2 px-4 bg-slate-600 rounded text-sm font-medium text-slate-300 shadow-lg cursor-not-allowed opacity-50"
              onMouseEnter={() => setShowExportTooltip(true)}
              onMouseLeave={() => setShowExportTooltip(false)}
            >
              <Download className="w-4 h-4 mr-2 shrink-0" />
              Export to Excel
            </button>
            {showExportTooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap">
                Coming soon
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Branding Header */}
        <div className="bg-slate-800 text-white px-6 py-2 text-sm flex justify-between items-center shrink-0">
          <span className="font-medium">{activeProject.project.company || APP_NAME} <span className="mx-2 text-slate-500">|</span> {activeProject.project.name}</span>
        </div>

        {/* Summary Bar */}
        <div className="bg-white border-b shadow-sm px-6 py-4 flex justify-between items-center shrink-0 z-0 h-20">
          {results ? (
            <div className="flex space-x-8">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase">Total Investment</p>
                <p className="text-lg font-bold">{formatINR(results.base.metrics.totalInvestment, true)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase">NPV</p>
                <p className={`text-lg font-bold ${results.base.metrics.npv >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {formatINR(Math.round(results.base.metrics.npv), true)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase">IRR</p>
                <p className={`text-lg font-bold ${results.base.metrics.irr >= results.base.metrics.discountRate ? 'text-green-600' : (results.base.metrics.irr !== null ? 'text-red-500' : 'text-slate-500')}`}>
                  {results.base.metrics.irr !== null ? `${(results.base.metrics.irr * 100).toFixed(1)}%` : 'Not applicable'}
                </p>
                {results.base.metrics.irr === null && (
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">No sign change in cash flows</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase">Payback</p>
                <p className={`text-lg font-bold ${results.base.metrics.paybackYears !== null ? 'text-green-600' : 'text-slate-500'}`}>
                  {results.base.metrics.paybackYears !== null ? `${results.base.metrics.paybackYears.toFixed(1)} Yrs` : 'Not applicable'}
                </p>
              </div>
              <div className="flex items-center ml-4">
                <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                  results.verdict === 'Go' ? 'bg-green-100 text-green-700 border border-green-200' : 
                  results.verdict === 'No-go' ? 'bg-red-100 text-red-700 border border-red-200' : 
                  'bg-amber-100 text-amber-700 border border-amber-200'
                }`}>
                  Verdict: {results.verdict}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-amber-500" />
              <span>{!activeProject.project?.lifeYears ? 'Enter project life in Project Details to view live results' : 'Complete all setup steps to view live results'}</span>
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-4xl mx-auto pb-12">
            {isLocked ? (
              <LockedView title={activeTabDef.name} />
            ) : (
              <ActiveComponent project={activeProject} updateProject={updateActiveProject} setActiveTab={setActiveTab} results={results} />
            )}
            <StepNav currentTabId={activeTab} tabs={tabs} setActiveTab={setActiveTab} />
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
