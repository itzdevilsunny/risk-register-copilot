'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RiskItem, StatusLevel, TreatmentStrategy, ProbabilityLevel, ImpactLevel, calculateSeverity } from '../../types/risk';
import { Badge } from '../ui/Badge';
import { useRiskContext } from '../../context/RiskContext';
import { EditRiskModal } from './EditRiskModal';
import { MOCK_TEAM_MEMBERS } from '../../data/mockData';
import { exportRisksToCSV } from '../../lib/exportUtils';
import { 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Trash2, 
  Sparkles, 
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  CheckSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserCheck,
  Download,
  X,
  SlidersHorizontal,
  Flame
} from 'lucide-react';

interface RiskTableProps {
  risks: RiskItem[];
}

type SortField = 'id' | 'title' | 'category' | 'inherentScore' | 'residualScore' | 'ownerName' | 'status' | 'treatmentStrategy';
type SortOrder = 'asc' | 'desc';

export const RiskTable: React.FC<RiskTableProps> = ({ risks }) => {
  const router = useRouter();
  const { 
    updateRisk, 
    updateRiskStatus, 
    deleteRisk, 
    workspaceSettings, 
    controls, 
    actions, 
    evidence,
    addToast 
  } = useRiskContext();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingRisk, setEditingRisk] = useState<RiskItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeScorePickerId, setActiveScorePickerId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'All' | 'Critical' | 'High' | 'Medium' | 'Low' | 'AboveAppetite'>('All');

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('inherentScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  // 1. Filter by Quick Severity Chip
  const filteredByChip = useMemo(() => {
    if (severityFilter === 'All') return risks;
    if (severityFilter === 'Critical') return risks.filter(r => (r.inherentSeverity || r.severity) === 'Critical');
    if (severityFilter === 'High') return risks.filter(r => (r.inherentSeverity || r.severity) === 'High');
    if (severityFilter === 'Medium') return risks.filter(r => (r.inherentSeverity || r.severity) === 'Medium');
    if (severityFilter === 'Low') return risks.filter(r => (r.inherentSeverity || r.severity) === 'Low');
    if (severityFilter === 'AboveAppetite') {
      return risks.filter(r => r.aboveAppetite || ((r.residualScore ?? r.score) > workspaceSettings.riskAppetiteThreshold));
    }
    return risks;
  }, [risks, severityFilter, workspaceSettings.riskAppetiteThreshold]);

  // 2. Sort Logic
  const sortedRisks = useMemo(() => {
    return [...filteredByChip].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'inherentScore') {
        valA = a.inherentScore ?? a.score ?? 0;
        valB = b.inherentScore ?? b.score ?? 0;
      } else if (sortField === 'residualScore') {
        valA = a.residualScore ?? a.score ?? 0;
        valB = b.residualScore ?? b.score ?? 0;
      }

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredByChip, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedRisks.length / pageSize) || 1;
  const paginatedRisks = useMemo(() => {
    return sortedRisks.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [sortedRisks, currentPage, pageSize]);

  // Sorting Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 inline ml-1" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400 inline ml-1" />
      : <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400 inline ml-1" />;
  };

  // Toggle Row Expansion
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Multi-Select Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedRisks.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Batch Operations
  const handleBatchStatus = async (status: StatusLevel) => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await updateRiskStatus(id, status);
    }
    addToast('Batch Status Updated', `Updated ${selectedIds.length} risks to status "${status}".`, 'success');
  };

  const handleBatchOwner = async (ownerName: string) => {
    if (selectedIds.length === 0) return;
    const member = MOCK_TEAM_MEMBERS.find(m => m.name === ownerName);
    for (const id of selectedIds) {
      await updateRisk(id, {
        ownerName,
        ownerRole: member?.role || 'Risk Owner',
        ownerAvatar: member?.avatar
      });
    }
    addToast('Batch Owner Reassigned', `Reassigned ${selectedIds.length} risks to ${ownerName}.`, 'success');
  };

  const handleBatchStrategy = async (strategy: TreatmentStrategy) => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await updateRisk(id, { treatmentStrategy: strategy });
    }
    addToast('Batch Strategy Updated', `Updated treatment strategy to "${strategy}" for ${selectedIds.length} risks.`, 'success');
  };

  const handleBatchExport = () => {
    const selectedRisks = risks.filter(r => selectedIds.includes(r.id));
    exportRisksToCSV(selectedRisks, `selected_risks_${Date.now()}.csv`);
    addToast('Export Complete', `Exported ${selectedRisks.length} selected risk records to CSV.`, 'success');
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected risks? This cannot be undone.`)) return;
    for (const id of selectedIds) {
      await deleteRisk(id);
    }
    setSelectedIds([]);
    addToast('Batch Deleted', `Removed ${selectedIds.length} risks from register.`, 'info');
  };

  // Quick Inherent Score Update Popover Handler
  const handleUpdateInherentScore = async (risk: RiskItem, newP: ProbabilityLevel, newI: ImpactLevel) => {
    const newScore = newP * newI;
    const newSev = calculateSeverity(newScore);
    await updateRisk(risk.id, {
      inherentProbability: newP,
      inherentImpact: newI,
      inherentScore: newScore,
      inherentSeverity: newSev,
      probability: newP,
      impact: newI,
      score: newScore,
      severity: newSev
    });
    setActiveScorePickerId(null);
  };

  if (risks.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-card">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">No risks match the active filter parameters</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Try resetting your category, status, or search query to view all project threats.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Quick Severity Filter & Page Size Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-xs">
          {/* Severity Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" /> Filter:
            </span>

            {(['All', 'Critical', 'High', 'Medium', 'Low', 'AboveAppetite'] as const).map(chip => {
              const isActive = severityFilter === chip;
              return (
                <button
                  key={chip}
                  onClick={() => {
                    setSeverityFilter(chip);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {chip === 'AboveAppetite' ? 'Above Appetite' : chip}
                </button>
              );
            })}
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value={8}>8 per page</option>
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {/* Floating / Sticky Batch Operations Toolbar (Active when rows selected) */}
        {selectedIds.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-extrabold text-xs">
                {selectedIds.length} Selected
              </span>
              <span className="text-xs text-slate-300 font-medium">Bulk Operations:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Batch Status */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBatchStatus(e.target.value as StatusLevel);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1 font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="" disabled>Change Status...</option>
                <option value="Open">Set Open</option>
                <option value="Monitoring">Set Monitoring</option>
                <option value="Mitigated">Set Mitigated</option>
                <option value="Closed">Set Closed</option>
              </select>

              {/* Batch Owner */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBatchOwner(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1 font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="" disabled>Reassign Owner...</option>
                {MOCK_TEAM_MEMBERS.map(m => (
                  <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                ))}
              </select>

              {/* Batch Strategy */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBatchStrategy(e.target.value as TreatmentStrategy);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1 font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="" disabled>Treatment Strategy...</option>
                <option value="Mitigate">Mitigate</option>
                <option value="Accept">Accept</option>
                <option value="Transfer">Transfer</option>
                <option value="Avoid">Avoid</option>
                <option value="Escalate">Escalate</option>
              </select>

              {/* Batch CSV Export */}
              <button
                onClick={handleBatchExport}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              {/* Batch Delete */}
              <button
                onClick={handleBatchDelete}
                className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 font-semibold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              {/* Deselect All */}
              <button
                onClick={() => setSelectedIds([])}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
                title="Deselect All"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                  {/* Select All Checkbox */}
                  <th className="py-3 px-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={paginatedRisks.length > 0 && paginatedRisks.every(r => selectedIds.includes(r.id))}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-2 w-8 text-center"></th>
                  
                  {/* Sortable ID */}
                  <th 
                    className="py-3 px-3 cursor-pointer group hover:text-slate-900 dark:hover:text-white transition-colors"
                    onClick={() => handleSort('id')}
                  >
                    <span>ID</span>
                    {getSortIcon('id')}
                  </th>

                  {/* Sortable Title */}
                  <th 
                    className="py-3 px-4 cursor-pointer group hover:text-slate-900 dark:hover:text-white transition-colors"
                    onClick={() => handleSort('title')}
                  >
                    <span>Risk Title & Process</span>
                    {getSortIcon('title')}
                  </th>

                  {/* Sortable Category */}
                  <th 
                    className="py-3 px-3 cursor-pointer group hover:text-slate-900 dark:hover:text-white transition-colors"
                    onClick={() => handleSort('category')}
                  >
                    <span>Category</span>
                    {getSortIcon('category')}
                  </th>

                  {/* Sortable Inherent Score */}
                  <th 
                    className="py-3 px-3 cursor-pointer group hover:text-slate-900 dark:hover:text-white transition-colors"
                    onClick={() => handleSort('inherentScore')}
                  >
                    <span>Inherent Score</span>
                    {getSortIcon('inherentScore')}
                  </th>

                  {/* Sortable Residual Score */}
                  <th 
                    className="py-3 px-3 cursor-pointer group hover:text-slate-900 dark:hover:text-white transition-colors"
                    onClick={() => handleSort('residualScore')}
                  >
                    <span>Residual</span>
                    {getSortIcon('residualScore')}
                  </th>

                  {/* Sortable Strategy & Appetite */}
                  <th 
                    className="py-3 px-3 cursor-pointer group hover:text-slate-900 dark:hover:text-white transition-colors"
                    onClick={() => handleSort('treatmentStrategy')}
                  >
                    <span>Strategy & Appetite</span>
                    {getSortIcon('treatmentStrategy')}
                  </th>

                  {/* Sortable Owner */}
                  <th 
                    className="py-3 px-3 cursor-pointer group hover:text-slate-900 dark:hover:text-white transition-colors"
                    onClick={() => handleSort('ownerName')}
                  >
                    <span>Assigned Owner</span>
                    {getSortIcon('ownerName')}
                  </th>

                  {/* Sortable Status */}
                  <th 
                    className="py-3 px-3 cursor-pointer group hover:text-slate-900 dark:hover:text-white transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <span>Status</span>
                    {getSortIcon('status')}
                  </th>

                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {paginatedRisks.map((risk, idx) => {
                  const isExpanded = expandedId === risk.id;
                  const isSelected = selectedIds.includes(risk.id);
                  const isAboveAppetite = risk.aboveAppetite || ((risk.residualScore ?? risk.score) > workspaceSettings.riskAppetiteThreshold);
                  const isScorePickerOpen = activeScorePickerId === risk.id;

                  const linkedCtrls = controls.filter(c => c.linkedRiskIds?.includes(risk.id));
                  const linkedActs = actions.filter(a => a.riskId === risk.id);
                  const linkedEvs = evidence.filter(e => e.linkedRiskId === risk.id);

                  return (
                    <React.Fragment key={`${risk.id}-${idx}`}>
                      <tr className={`transition-colors ${
                        isSelected 
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/30' 
                          : isExpanded 
                          ? 'bg-slate-50/70 dark:bg-slate-800/40' 
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}>
                        
                        {/* Row Checkbox */}
                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(risk.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>

                        {/* Toggle Expand Icon */}
                        <td className="py-3.5 px-2 text-center">
                          <button
                            onClick={() => toggleExpand(risk.id)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 transition-colors"
                            title="Toggle Details"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>

                        {/* Risk ID */}
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {risk.id}
                        </td>

                        {/* Risk Title & Department */}
                        <td className="py-3.5 px-4 max-w-sm">
                          <div>
                            <button
                              onClick={() => router.push(`/risk/${risk.id}`)}
                              className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 text-left transition-colors flex items-center gap-1.5"
                            >
                              <span>{risk.title}</span>
                              {risk.aiSuggested && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
                                  AI
                                </span>
                              )}
                            </button>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {risk.department || 'MNB Research'} • {risk.description}
                            </p>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <Badge variant="category">{risk.category}</Badge>
                        </td>

                        {/* Interactive Inherent Score Cell */}
                        <td className="py-3.5 px-3 whitespace-nowrap relative">
                          <div 
                            onClick={() => setActiveScorePickerId(isScorePickerOpen ? null : risk.id)}
                            className="flex items-center gap-1.5 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-fit"
                            title="Click to quickly re-score Probability & Impact"
                          >
                            <span className={`px-2 py-0.5 rounded text-xs font-mono font-extrabold text-white ${
                              risk.inherentSeverity === 'Critical' ? 'bg-red-600' :
                              risk.inherentSeverity === 'High' ? 'bg-orange-600' :
                              risk.inherentSeverity === 'Medium' ? 'bg-amber-600' : 'bg-emerald-600'
                            }`}>
                              {risk.inherentScore ?? risk.score}
                            </span>
                            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              P:{risk.inherentProbability ?? risk.probability} × I:{risk.inherentImpact ?? risk.impact}
                            </div>
                          </div>

                          {/* Quick Score Popover */}
                          {isScorePickerOpen && (
                            <div className="absolute top-12 left-0 z-30 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-52 space-y-2 animate-in zoom-in-95">
                              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-1.5">
                                <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                                  Quick Inherent Score:
                                </span>
                                <button 
                                  onClick={() => setActiveScorePickerId(null)}
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Probability (P):</span>
                                <div className="grid grid-cols-5 gap-1">
                                  {([1, 2, 3, 4, 5] as const).map(p => (
                                    <button
                                      key={p}
                                      onClick={() => handleUpdateInherentScore(risk, p, (risk.inherentImpact || risk.impact || 3) as ImpactLevel)}
                                      className={`py-1 rounded text-[11px] font-bold ${
                                        (risk.inherentProbability || risk.probability) === p
                                          ? 'bg-indigo-600 text-white'
                                          : 'bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 text-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      {p}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Impact (I):</span>
                                <div className="grid grid-cols-5 gap-1">
                                  {([1, 2, 3, 4, 5] as const).map(i => (
                                    <button
                                      key={i}
                                      onClick={() => handleUpdateInherentScore(risk, (risk.inherentProbability || risk.probability || 3) as ProbabilityLevel, i)}
                                      className={`py-1 rounded text-[11px] font-bold ${
                                        (risk.inherentImpact || risk.impact) === i
                                          ? 'bg-indigo-600 text-white'
                                          : 'bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 text-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      {i}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Residual Score */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-xs font-mono font-extrabold border ${
                              risk.residualSeverity === 'Critical' ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50' :
                              risk.residualSeverity === 'High' ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50' :
                              risk.residualSeverity === 'Medium' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                            }`}>
                              {risk.residualScore ?? risk.score}
                            </span>
                            <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              P:{risk.residualProbability ?? risk.probability} × I:{risk.residualImpact ?? risk.impact}
                            </div>
                          </div>
                        </td>

                        {/* Strategy, Appetite & Inline Strategy Dropdown */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="space-y-1">
                            <select
                              value={risk.treatmentStrategy || 'Mitigate'}
                              onChange={(e) => updateRisk(risk.id, { treatmentStrategy: e.target.value as TreatmentStrategy })}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-hidden"
                            >
                              <option value="Mitigate">Mitigate</option>
                              <option value="Accept">Accept</option>
                              <option value="Transfer">Transfer</option>
                              <option value="Avoid">Avoid</option>
                              <option value="Escalate">Escalate</option>
                            </select>

                            <div>
                              {isAboveAppetite ? (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 inline-flex items-center gap-1 border border-red-200 dark:border-red-900/50">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Above Appetite
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                                  Within Appetite
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Inline Owner Dropdown */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <select
                            value={risk.ownerName}
                            onChange={(e) => {
                              const newOwner = e.target.value;
                              const member = MOCK_TEAM_MEMBERS.find(m => m.name === newOwner);
                              updateRisk(risk.id, {
                                ownerName: newOwner,
                                ownerRole: member?.role || risk.ownerRole,
                                ownerAvatar: member?.avatar
                              });
                            }}
                            className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-hidden"
                          >
                            {MOCK_TEAM_MEMBERS.map(m => (
                              <option key={m.id} value={m.name}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Inline Status Dropdown */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <select
                            value={risk.status}
                            onChange={(e) => updateRiskStatus(risk.id, e.target.value as StatusLevel)}
                            className={`text-xs font-semibold px-2 py-1 rounded-md border cursor-pointer focus:outline-hidden ${
                              risk.status === 'Open' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' :
                              risk.status === 'Monitoring' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                              risk.status === 'Mitigated' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                              'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <option value="Open">Open</option>
                            <option value="Monitoring">Monitoring</option>
                            <option value="Mitigated">Mitigated</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingRisk(risk)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Edit Risk"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => router.push(`/risk/${risk.id}`)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Open Detail View"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${risk.id}?`)) {
                                  deleteRisk(risk.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                              title="Delete Risk"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row Details */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 animate-in fade-in-50">
                          <td colSpan={11} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              {/* Linked Controls */}
                              <div className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                <h5 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Linked Controls ({linkedCtrls.length})
                                </h5>
                                {linkedCtrls.length > 0 ? (
                                  <div className="space-y-1">
                                    {linkedCtrls.map(c => (
                                      <div key={c.id} className="p-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded text-[11px]">
                                        <div className="font-bold text-slate-800 dark:text-slate-200">{c.name}</div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{c.type} • {c.effectiveness}</div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">No controls linked yet.</p>
                                )}
                              </div>

                              {/* Mitigation Actions */}
                              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                                  <CheckSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Linked Actions ({linkedActs.length})
                                </h5>
                                {linkedActs.length > 0 ? (
                                  <div className="space-y-1">
                                    {linkedActs.map(a => (
                                      <div key={a.id} className="p-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded text-[11px] flex justify-between">
                                        <div>
                                          <div className="font-bold text-slate-800 dark:text-slate-200">{a.title}</div>
                                          <div className="text-[10px] text-slate-500 dark:text-slate-400">Due: {a.dueDate}</div>
                                        </div>
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{a.progressPct}%</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">No mitigation actions defined yet.</p>
                                )}
                              </div>

                              {/* Evidence Files & Details */}
                              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                                  <FileCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Linked Evidence ({linkedEvs.length})
                                </h5>
                                {linkedEvs.length > 0 ? (
                                  <div className="space-y-1">
                                    {linkedEvs.map(e => (
                                      <div key={e.id} className="p-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded text-[11px]">
                                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{e.fileName}</div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Uploaded by {e.uploadedBy}</div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">No evidence files uploaded.</p>
                                )}
                                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-right">
                                  <button
                                    onClick={() => router.push(`/risk/${risk.id}`)}
                                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                  >
                                    View full detail view →
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min((currentPage - 1) * pageSize + 1, sortedRisks.length)}</span> to{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(currentPage * pageSize, sortedRisks.length)}</span> of{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{sortedRisks.length}</span> risks
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Risk Modal */}
      <EditRiskModal
        risk={editingRisk}
        isOpen={!!editingRisk}
        onClose={() => setEditingRisk(null)}
      />
    </>
  );
};
