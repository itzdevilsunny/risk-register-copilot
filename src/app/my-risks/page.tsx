'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRiskContext } from '../../context/RiskContext';
import { Badge } from '../../components/ui/Badge';
import { 
  UserCheck, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  CheckCircle2, 
  Search,
  Filter,
  CheckSquare,
  Square,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { StatusLevel } from '../../types/risk';

export default function MyRisksPage() {
  const router = useRouter();
  const { risks, currentUser, updateRisk, toggleChecklistItem, addToast } = useRiskContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'All' | 'Critical' | 'High' | 'Medium' | 'Low'>('All');
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(null);

  const myAllRisks = useMemo(() => {
    return risks.filter(r => 
      (r.ownerName && (r.ownerName.toLowerCase().includes('sunny') || r.ownerName === currentUser?.name)) ||
      (r.coOwnerName && (r.coOwnerName.toLowerCase().includes('sunny') || r.coOwnerName === currentUser?.name))
    );
  }, [risks, currentUser]);

  const filteredRisks = useMemo(() => {
    return myAllRisks.filter(r => {
      if (severityFilter !== 'All' && r.severity !== severityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mTitle = r.title.toLowerCase().includes(q);
        const mDesc = r.description.toLowerCase().includes(q);
        const mId = r.id.toLowerCase().includes(q);
        if (!mTitle && !mDesc && !mId) return false;
      }
      return true;
    });
  }, [myAllRisks, severityFilter, searchQuery]);

  const criticalCount = myAllRisks.filter(r => r.severity === 'Critical' || r.severity === 'High').length;
  const avgReadiness = myAllRisks.length > 0 
    ? Math.round(myAllRisks.reduce((a, b) => a + b.mitigationProgress, 0) / myAllRisks.length) 
    : 100;

  const handleStatusChange = async (riskId: string, newStatus: StatusLevel, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateRisk(riskId, { status: newStatus });
    addToast('Status Updated', `Risk ${riskId} moved to ${newStatus}.`, 'info');
  };

  const handleChecklistToggle = async (riskId: string, checklistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleChecklistItem(riskId, checklistId);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>My Assigned Risks & Actions</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Personal operational command center for risks and mitigation checklists owned by {currentUser?.name || 'Sunny Prasad'}.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">My Assigned Risks</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{myAllRisks.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Assigned to your profile</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Critical / High Exposure</span>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{criticalCount} Items</div>
          <div className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-0.5">Requires priority mitigation</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Mitigation Readiness</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{avgReadiness}%</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Across active checklists</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search my risks by ID, title, or summary..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-center flex-wrap">
          {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                severityFilter === sev
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Risks Stream */}
      <div className="space-y-3">
        {filteredRisks.map((risk, idx) => {
          const isExpanded = expandedRiskId === risk.id;

          return (
            <div
              key={`${risk.id}-${idx}`}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700">
                    {risk.id}
                  </span>
                  <div>
                    <h3 
                      onClick={() => router.push(`/risk/${risk.id}`)}
                      className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{risk.title}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{risk.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100">
                    Score {risk.score}
                  </span>
                  <Badge severity={risk.severity} />
                  
                  {/* Inline Status Switcher */}
                  <select
                    value={risk.status}
                    onChange={(e) => handleStatusChange(risk.id, e.target.value as StatusLevel, e as any)}
                    className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="Open">Open</option>
                    <option value="Monitoring">Monitoring</option>
                    <option value="Mitigated">Mitigated</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Progress and Checklist Controls */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Target Resolution: <strong className="text-slate-800 dark:text-slate-200">{risk.dueDate || 'Nov 30, 2024'}</strong></span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {risk.checklist?.filter(c => c.completed).length || 0}/{risk.checklist?.length || 0} checklist items
                  </span>
                  {risk.checklist && risk.checklist.length > 0 && (
                    <button
                      onClick={() => setExpandedRiskId(isExpanded ? null : risk.id)}
                      className="px-2 py-0.5 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      <span>{isExpanded ? 'Hide Checklist' : 'Checklist Items'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Checklist Stream */}
              {isExpanded && risk.checklist && risk.checklist.length > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 mt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Mitigation Checklist Action Items (1-Click Completion)
                  </div>
                  <div className="space-y-1.5">
                    {risk.checklist.map((item) => (
                      <div
                        key={item.id}
                        onClick={(e) => handleChecklistToggle(risk.id, item.id, e)}
                        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs"
                      >
                        {item.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className={`font-medium ${item.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredRisks.length === 0 && (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
            No risks match the active filters for your account.
          </div>
        )}
      </div>
    </div>
  );
}
