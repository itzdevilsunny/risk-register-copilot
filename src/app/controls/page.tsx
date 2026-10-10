'use client';

import React, { useState } from 'react';
import { useRiskContext } from '../../context/RiskContext';
import { Control } from '../../types/risk';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Edit3, 
  Trash2,
  ExternalLink,
  Layers
} from 'lucide-react';

export default function ControlsPage() {
  const { controls, risks, addControl, updateControl, deleteControl, currentUser } = useRiskContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [effectivenessFilter, setEffectivenessFilter] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New control form state
  const [newControlName, setNewControlName] = useState('');
  const [newControlDesc, setNewControlDesc] = useState('');
  const [newControlCategory, setNewControlCategory] = useState('Operational');
  const [newControlType, setNewControlType] = useState<'Preventive' | 'Detective' | 'Corrective'>('Preventive');
  const [newControlObjective, setNewControlObjective] = useState('');
  const [newControlEffectiveness, setNewControlEffectiveness] = useState<'Effective' | 'Partially Effective' | 'Ineffective'>('Effective');
  const [newControlTestStatus, setNewControlTestStatus] = useState<'Passed' | 'Failed' | 'Pending Test'>('Passed');
  const [selectedRiskIds, setSelectedRiskIds] = useState<string[]>([]);

  const filteredControls = controls.filter(ctrl => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = ctrl.name.toLowerCase().includes(q);
      const matchDesc = ctrl.description.toLowerCase().includes(q);
      const matchId = ctrl.id.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchId) return false;
    }
    if (typeFilter !== 'All' && ctrl.type !== typeFilter) return false;
    if (effectivenessFilter !== 'All' && ctrl.effectiveness !== effectivenessFilter) return false;
    return true;
  });

  const handleCreateControl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newControlName.trim()) return;

    addControl({
      name: newControlName,
      description: newControlDesc,
      category: newControlCategory,
      type: newControlType,
      objective: newControlObjective,
      ownerName: currentUser.name,
      ownerRole: currentUser.role,
      implementationStatus: 'Implemented',
      effectiveness: newControlEffectiveness,
      testStatus: newControlTestStatus,
      lastTestDate: new Date().toISOString().split('T')[0],
      nextTestDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      linkedRiskIds: selectedRiskIds
    });

    setIsCreateModalOpen(false);
    setNewControlName('');
    setNewControlDesc('');
    setNewControlObjective('');
    setSelectedRiskIds([]);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Internal Controls Management</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Define, test, and link internal risk-mitigating controls across enterprise operations.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Control</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Active Controls</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">{controls.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Mapped to {risks.length} active risks</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Effective Controls</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {controls.filter(c => c.effectiveness === 'Effective').length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Passing internal audits</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Failed Test Warnings</span>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-2">
            {controls.filter(c => c.testStatus === 'Failed').length}
          </div>
          <div className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-1">Requires immediate remediation</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Tests</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {controls.filter(c => c.testStatus === 'Pending Test').length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Scheduled in current cycle</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search controls by name, ID, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Preventive">Preventive</option>
              <option value="Detective">Detective</option>
              <option value="Corrective">Corrective</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Effectiveness:</span>
            <select
              value={effectivenessFilter}
              onChange={(e) => setEffectivenessFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Effective">Effective</option>
              <option value="Partially Effective">Partially Effective</option>
              <option value="Ineffective">Ineffective</option>
            </select>
          </div>
        </div>
      </div>

      {/* Controls Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3.5">Control ID & Name</th>
                <th className="px-4 py-3.5">Category & Type</th>
                <th className="px-4 py-3.5">Owner</th>
                <th className="px-4 py-3.5">Effectiveness</th>
                <th className="px-4 py-3.5">Latest Test</th>
                <th className="px-4 py-3.5">Linked Risks</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-700 dark:text-slate-300">
              {filteredControls.map((ctrl) => {
                const linkedRisks = risks.filter(r => ctrl.linkedRiskIds?.includes(r.id));

                return (
                  <tr key={ctrl.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md shrink-0 border border-indigo-200 dark:border-indigo-800">
                          {ctrl.id}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{ctrl.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{ctrl.description}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{ctrl.category}</div>
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold mt-1 ${
                        ctrl.type === 'Preventive' 
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50' 
                          : ctrl.type === 'Detective'
                            ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                      }`}>
                        {ctrl.type}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{ctrl.ownerName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{ctrl.ownerRole}</div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <select
                        value={ctrl.effectiveness}
                        onChange={(e) => updateControl(ctrl.id, { effectiveness: e.target.value as any })}
                        className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border cursor-pointer focus:outline-hidden ${
                          ctrl.effectiveness === 'Effective'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : ctrl.effectiveness === 'Partially Effective'
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800'
                        }`}
                      >
                        <option value="Effective">Effective</option>
                        <option value="Partially Effective">Partially Effective</option>
                        <option value="Ineffective">Ineffective</option>
                      </select>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <select
                        value={ctrl.testStatus}
                        onChange={(e) => updateControl(ctrl.id, { 
                          testStatus: e.target.value as any, 
                          lastTestDate: new Date().toISOString().split('T')[0] 
                        })}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer focus:outline-hidden ${
                          ctrl.testStatus === 'Passed'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : ctrl.testStatus === 'Failed'
                            ? 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800'
                            : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        <option value="Passed">Passed</option>
                        <option value="Failed">Failed</option>
                        <option value="Pending Test">Pending Test</option>
                      </select>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Tested: {ctrl.lastTestDate || 'Today'}</div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {linkedRisks.length > 0 ? (
                          linkedRisks.map((r, idx) => (
                            <span key={`${r.id}-${idx}`} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                              {r.id}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">No linked risks</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => updateControl(ctrl.id, {
                          testStatus: 'Passed',
                          lastTestDate: new Date().toISOString().split('T')[0]
                        })}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer mr-1"
                        title="Pass Control Test"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteControl(ctrl.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Delete Control"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredControls.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                    No matching controls found. Click "Add New Control" to define an internal safeguard.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Control Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-popover border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Add New Internal Control</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateControl} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Control Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Automated Multifactor Authentication Policy"
                  value={newControlName}
                  onChange={e => setNewControlName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe the control mechanism..."
                  value={newControlDesc}
                  onChange={e => setNewControlDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={newControlCategory}
                    onChange={e => setNewControlCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    <option value="Operational">Operational</option>
                    <option value="Technical">Technical</option>
                    <option value="Security">Security</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Control Type</label>
                  <select
                    value={newControlType}
                    onChange={e => setNewControlType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    <option value="Preventive">Preventive</option>
                    <option value="Detective">Detective</option>
                    <option value="Corrective">Corrective</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Control Objective</label>
                <input
                  type="text"
                  placeholder="e.g. Prevent unauthorized access to production database"
                  value={newControlObjective}
                  onChange={e => setNewControlObjective(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Effectiveness</label>
                  <select
                    value={newControlEffectiveness}
                    onChange={e => setNewControlEffectiveness(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    <option value="Effective">Effective</option>
                    <option value="Partially Effective">Partially Effective</option>
                    <option value="Ineffective">Ineffective</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Test Status</label>
                  <select
                    value={newControlTestStatus}
                    onChange={e => setNewControlTestStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                    <option value="Pending Test">Pending Test</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Link to Active Risks</label>
                <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 space-y-1.5 bg-slate-50 dark:bg-slate-800/50">
                  {risks.map((r, idx) => (
                    <label key={`${r.id}-${idx}`} className="flex items-center gap-2 text-[11px] text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRiskIds.includes(r.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedRiskIds(prev => [...prev, r.id]);
                          else setSelectedRiskIds(prev => prev.filter(id => id !== r.id));
                        }}
                        className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{r.id}:</span>
                      <span className="truncate">{r.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold cursor-pointer"
                >
                  Save Control
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
