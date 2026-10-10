'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRiskContext } from '../context/RiskContext';
import { StatCard } from '../components/dashboard/StatCard';
import { RiskMatrix } from '../components/dashboard/RiskMatrix';
import { RiskDistribution } from '../components/dashboard/RiskDistribution';
import { RecentRisks } from '../components/dashboard/RecentRisks';
import { ExecutiveBriefingCard } from '../components/dashboard/ExecutiveBriefingCard';
import { LifecyclePipelineCard } from '../components/dashboard/LifecyclePipelineCard';
import { WhatIfSimulator } from '../components/dashboard/WhatIfSimulator';
import { LiveMonitoringTicker } from '../components/analytics/LiveMonitoringTicker';
import { Button } from '../ui/Button';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Sparkles,
  FileText,
  CheckSquare,
  ArrowRight,
  ShieldCheck,
  Flame,
  RotateCcw,
  RefreshCw,
  FolderKanban
} from 'lucide-react';
import { IncidentToRiskModal } from '../components/risks/IncidentToRiskModal';

export default function DashboardPage() {
  const { 
    risks, 
    actions, 
    evidence, 
    approvals, 
    kris,
    getFilteredRisks, 
    selectedProjectId, 
    setSelectedProjectId,
    projects,
    currentUser,
    workspaceSettings,
    refreshData,
    openCopilot,
    addToast
  } = useRiskContext();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [selectedMatrixCell, setSelectedMatrixCell] = useState<{ prob: any; imp: any } | null>(null);
  const [activeKpiFilter, setActiveKpiFilter] = useState<'all' | 'critical' | 'aboveAppetite' | null>(null);

  const filteredRisks = getFilteredRisks();

  const totalRisks = filteredRisks.length;
  const criticalHighRisks = filteredRisks.filter(r => r.severity === 'Critical' || r.severity === 'High').length;
  const criticalCount = filteredRisks.filter(r => r.severity === 'Critical').length;
  const highCount = filteredRisks.filter(r => r.severity === 'High').length;
  
  // Real database-calculated stats
  const aboveAppetiteRisks = filteredRisks.filter(r => r.aboveAppetite || ((r.residualScore ?? r.score) > workspaceSettings.riskAppetiteThreshold));
  const now = new Date();
  const overdueActionsCount = actions.filter(a => a.status !== 'Completed' && new Date(a.dueDate) < now).length;
  const expiringEvidenceCount = evidence.filter(e => e.validityExpiryDate && new Date(e.validityExpiryDate) < now).length;
  const pendingApprovalsCount = approvals.filter(a => a.status === 'Pending').length;

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      addToast('Workspace Synced', 'Refreshed latest risk scores, controls, and telemetry.', 'success');
    } catch (e) {
      addToast('Sync Error', 'Failed to synchronize with backend.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const matrixFilteredRisks = useMemo(() => {
    let result = filteredRisks;
    if (selectedMatrixCell) {
      result = result.filter(r => r.probability === selectedMatrixCell.prob && r.impact === selectedMatrixCell.imp);
    }
    if (activeKpiFilter === 'critical') {
      result = result.filter(r => r.severity === 'Critical' || r.severity === 'High');
    } else if (activeKpiFilter === 'aboveAppetite') {
      result = result.filter(r => r.aboveAppetite || ((r.residualScore ?? r.score) > workspaceSettings.riskAppetiteThreshold));
    }
    return result;
  }, [filteredRisks, selectedMatrixCell, activeKpiFilter, workspaceSettings.riskAppetiteThreshold]);

  const activeFilterLabel = activeKpiFilter === 'critical' 
    ? 'Critical / High Exposure' 
    : activeKpiFilter === 'aboveAppetite' 
      ? 'Above Risk Appetite' 
      : null;

  const handleClearAllFilters = () => {
    setSelectedMatrixCell(null);
    setActiveKpiFilter(null);
  };

  return (
    <div className="space-y-4 animate-in fade-in-50 pb-10">
      {/* Top Executive Header with Interactive Workstream Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Welcome back, {currentUser.name}
            </h1>
            
            {/* Interactive Workstream Project Selector */}
            <div className="flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-indigo-500" />
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Workstreams & Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Enterprise Risk Operating System · Connect Risks to Controls, Evidence, Actions, & Decisions.
          </p>
        </div>

        {/* Live Status Indicators & 1-Click Sync */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Engine</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{totalRisks} Active</span>
          </div>
        </div>
      </div>

      {/* 1-Click Action Shortcuts Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Link 
          href="/add" 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs shrink-0 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register Risk</span>
        </Link>
        <button 
          onClick={() => setIsIncidentModalOpen(true)} 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 rounded-xl font-bold shrink-0 transition-colors cursor-pointer"
        >
          <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          <span>Incident ➔ Risk</span>
        </button>
        <button 
          onClick={() => openCopilot()} 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold shrink-0 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Ask Copilot AI</span>
        </button>
        <Link 
          href="/report" 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold shrink-0 transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>Executive Report</span>
        </Link>
        <Link 
          href="/approvals" 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold shrink-0 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Governance Sign-Offs ({pendingApprovalsCount})</span>
        </Link>
      </div>

      {/* Risk Appetite Breach Alert Banner (Compact) */}
      {aboveAppetiteRisks.length > 0 && (
        <div className="p-2.5 px-3.5 rounded-xl bg-red-500/10 dark:bg-red-950/40 border border-red-300 dark:border-red-900/60 flex items-center justify-between gap-3 text-xs animate-in zoom-in-95">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1 rounded-md bg-red-600 text-white shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <strong className="text-red-950 dark:text-red-100">Risk Appetite Threshold Exceeded: </strong>
              <span className="text-red-800 dark:text-red-300 font-medium">
                {aboveAppetiteRisks.map(r => r.id).join(', ')} exceeds appetite threshold ({workspaceSettings.riskAppetiteThreshold}). Governance approval required.
              </span>
            </div>
          </div>
          <Link
            href="/approvals"
            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[11px] shrink-0 flex items-center gap-1 transition-colors"
          >
            <span>Review & Approve</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Real-Time Live Telemetry Stream */}
      <LiveMonitoringTicker />

      {/* 6 OPERATIONAL KPI CARDS (Immediate Executive Pulse) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
        <div 
          onClick={() => setActiveKpiFilter(activeKpiFilter === 'all' ? null : 'all')}
          className="cursor-pointer"
        >
          <StatCard
            label="Total Risks"
            value={totalRisks}
            subValue="in register"
            trend={{ text: "Active", type: "neutral" }}
            icon={<ShieldAlert className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
            iconBg="bg-indigo-50 dark:bg-indigo-950/60"
            href="/register"
          />
        </div>

        <div 
          onClick={() => setActiveKpiFilter(activeKpiFilter === 'critical' ? null : 'critical')}
          className="cursor-pointer"
        >
          <StatCard
            label="Critical / High"
            value={criticalHighRisks}
            subValue="high exposure"
            trend={{ text: criticalHighRisks > 3 ? 'Action Needed' : 'Controlled', type: criticalHighRisks > 3 ? 'negative' : 'positive' }}
            icon={<AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />}
            iconBg="bg-red-50 dark:bg-red-950/60"
            href="/register?severity=Critical"
          />
        </div>

        <div 
          onClick={() => setActiveKpiFilter(activeKpiFilter === 'aboveAppetite' ? null : 'aboveAppetite')}
          className="cursor-pointer"
        >
          <StatCard
            label="Above Appetite"
            value={aboveAppetiteRisks.length}
            subValue="requires approval"
            trend={{ text: aboveAppetiteRisks.length > 0 ? 'Breach' : 'Within Limit', type: aboveAppetiteRisks.length > 0 ? 'negative' : 'positive' }}
            icon={<ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
            iconBg="bg-amber-50 dark:bg-amber-950/60"
            href="/approvals"
          />
        </div>

        <StatCard
          label="Overdue Actions"
          value={overdueActionsCount}
          subValue="mitigation SLA"
          trend={{ text: overdueActionsCount > 0 ? 'Overdue' : 'On Track', type: overdueActionsCount > 0 ? 'negative' : 'positive' }}
          icon={<CheckSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
          iconBg="bg-purple-50 dark:bg-purple-950/60"
          href="/actions"
        />

        <StatCard
          label="Expiring Evidence"
          value={expiringEvidenceCount}
          subValue="compliance files"
          trend={{ text: expiringEvidenceCount > 0 ? 'Expired' : 'Valid', type: expiringEvidenceCount > 0 ? 'negative' : 'positive' }}
          icon={<FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-50 dark:bg-blue-950/60"
          href="/evidence"
        />

        <StatCard
          label="Pending Approvals"
          value={pendingApprovalsCount}
          subValue="governance queue"
          trend={{ text: pendingApprovalsCount > 0 ? 'Pending' : 'Cleared', type: pendingApprovalsCount > 0 ? 'neutral' : 'positive' }}
          icon={<Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-50 dark:bg-emerald-950/60"
          href="/approvals"
        />
      </div>

      {/* 10-STAGE CONTINUOUS OPERATING LIFECYCLE PIPELINE */}
      <LifecyclePipelineCard />

      {/* TWO-COLUMN ANALYTICAL & WORKABLE HUB */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Visual Threat Matrix & Active Risk Items (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <RiskMatrix 
            risks={filteredRisks} 
            selectedCell={selectedMatrixCell}
            onSelectCell={setSelectedMatrixCell}
          />
          <RecentRisks 
            risks={matrixFilteredRisks} 
            activeFilterCoord={selectedMatrixCell}
            activeFilterLabel={activeFilterLabel}
            onClearFilter={handleClearAllFilters}
          />
        </div>

        {/* Right Column: Financial Breakdown, Executive Briefing & Stress Testing (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <RiskDistribution risks={filteredRisks} />
          <ExecutiveBriefingCard />
          <WhatIfSimulator />
        </div>
      </div>

      {/* Incident-to-Risk Pipeline Modal */}
      <IncidentToRiskModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
      />
    </div>
  );
}
