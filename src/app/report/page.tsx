'use client';

import React, { useState } from 'react';
import { useRiskContext } from '../../context/RiskContext';
import { 
  ShieldAlert, 
  Printer, 
  Sparkles, 
  DollarSign, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle,
  FileText,
  ShieldCheck,
  Building,
  Calendar
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function ReportPage() {
  const { risks, projects, controls, actions, evidence, kris, approvals, workspaceSettings, formatCurrency, addToast } = useRiskContext();
  const [reportType, setReportType] = useState<'executive' | 'board'>('executive');
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState<boolean>(false);
  const [briefingData, setBriefingData] = useState<{
    executiveSummary?: string;
    topPriorityActions?: string[];
    financialVulnerabilityScore?: number;
    governanceRating?: string;
    source?: string;
  } | null>(null);

  const totalRisks = risks.length;
  const criticalRisks = risks.filter(r => r.severity === 'Critical');
  const highRisks = risks.filter(r => r.severity === 'High');
  const aboveAppetiteRisks = risks.filter(r => r.aboveAppetite || ((r.residualScore ?? r.score) > workspaceSettings.riskAppetiteThreshold));
  const now = new Date();
  const overdueActions = actions.filter(a => a.status !== 'Completed' && new Date(a.dueDate) < now);

  const totalExposureUsd = risks.reduce((acc, r) => acc + (r.estimatedImpactUsd || r.score * 2500), 0);
  const avgProgress = totalRisks > 0 
    ? Math.round(risks.reduce((acc, r) => acc + r.mitigationProgress, 0) / totalRisks) 
    : 0;

  const handleGenerateBriefing = async () => {
    setIsGeneratingBriefing(true);
    try {
      const res = await fetch('/api/generate-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ risks })
      });
      const data = await res.json();
      if (res.ok && data) {
        setBriefingData(data);
        addToast('AI Briefing Generated', `Executive synthesis synthesized via ${data.source || 'Copilot AI'}.`, 'success');
      } else {
        addToast('Briefing Generation Failed', data.error || 'Could not synthesize briefing.', 'error');
      }
    } catch (err: any) {
      addToast('Network Note', 'Failed to reach AI briefing engine.', 'error');
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 bg-white text-slate-900 font-sans print:p-0 print:max-w-none">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Enterprise Risk Governance Reporting
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800">
              Audit & Board Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            MNB Research • Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-bold w-full sm:w-auto justify-center">
            <button
              onClick={() => setReportType('executive')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                reportType === 'executive' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Executive Summary Report
            </button>
            <button
              onClick={() => setReportType('board')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                reportType === 'board' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Board Governance Briefing
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<Sparkles className={`w-3.5 h-3.5 text-indigo-600 ${isGeneratingBriefing ? 'animate-spin' : ''}`} />}
            onClick={handleGenerateBriefing}
            disabled={isGeneratingBriefing}
          >
            {isGeneratingBriefing ? 'Synthesizing...' : briefingData ? 'Refresh AI Briefing' : 'Synthesize AI Briefing'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            Print / Export PDF
          </Button>
        </div>
      </div>

      {/* Printable Report Document Body */}
      <div className="space-y-6">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-0.5">
              MNB RESEARCH • BUSINESS OPERATIONS & TECHNOLOGY ADVISORY
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight">
              {reportType === 'executive' ? 'Executive Risk & Control Report' : 'Board Risk Governance Briefing'}
            </h1>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              Organization: {workspaceSettings?.workspaceName || 'MNB Research Business Operations'}
            </p>
          </div>
          <div className="sm:text-right text-xs text-slate-500 font-mono space-y-1">
            <div className="font-bold text-red-600 uppercase bg-red-50 px-2 py-0.5 border border-red-200 inline-block rounded">
              STRICTLY CONFIDENTIAL
            </div>
            <div>Date: {new Date().toISOString().split('T')[0]}</div>
            <div>Scoring Matrix: 5×5 Likelihood × Impact</div>
          </div>
        </div>

        {/* 4 Key Performance Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 rounded-lg border border-slate-300 bg-slate-50">
            <div className="text-xs font-bold text-slate-500 uppercase">Total Risk Register</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalRisks} Records</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{projects.length} Active Workstreams</div>
          </div>

          <div className="p-3.5 rounded-lg border border-red-300 bg-red-50/50">
            <div className="text-xs font-bold text-red-700 uppercase">Above Appetite</div>
            <div className="text-2xl font-black text-red-900 mt-1">{aboveAppetiteRisks.length} Risks</div>
            <div className="text-[10px] text-red-600 mt-0.5">Threshold Score &gt; {workspaceSettings.riskAppetiteThreshold}</div>
          </div>

          <div className="p-3.5 rounded-lg border border-indigo-300 bg-indigo-50/50">
            <div className="text-xs font-bold text-indigo-700 uppercase">Financial Exposure</div>
            <div className="text-2xl font-black text-indigo-950 mt-1 font-mono">
              {formatCurrency(totalExposureUsd)}
            </div>
            <div className="text-[10px] text-indigo-600 mt-0.5">Estimated Portfolio Impact</div>
          </div>

          <div className="p-3.5 rounded-lg border border-emerald-300 bg-emerald-50/50">
            <div className="text-xs font-bold text-emerald-700 uppercase">Control Effectiveness</div>
            <div className="text-2xl font-black text-emerald-950 mt-1">
              {controls.filter(c => c.effectiveness === 'Effective').length}/{controls.length}
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Controls Passing Audit</div>
          </div>
        </div>

        {/* Executive Summary Narrative */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              Executive Summary & Risk Posture Synthesis
            </h3>
            {briefingData?.governanceRating && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                Governance Status: {briefingData.governanceRating}
              </span>
            )}
          </div>

          <p className="text-slate-700 leading-relaxed">
            {briefingData?.executiveSummary ? (
              <span>{briefingData.executiveSummary}</span>
            ) : (
              <span>
                This governance report provides an objective overview of active operational, technical, resource, and schedule risks across 
                <strong> {workspaceSettings.workspaceName}</strong>. 
                Currently, <strong>{aboveAppetiteRisks.length} risk(s)</strong> exceed the organization's approved risk appetite threshold of {workspaceSettings.riskAppetiteThreshold}, 
                requiring explicit formal management sign-off or accelerated mitigation. Average mitigation readiness stands at <strong>{avgProgress}%</strong> across all active workstreams.
              </span>
            )}
          </p>

          {briefingData?.topPriorityActions && briefingData.topPriorityActions.length > 0 && (
            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                Key Strategic Action Priorities (Mandated by Leadership):
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                {briefingData.topPriorityActions.map((act, i) => (
                  <li key={i} className="leading-snug">{act}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Above Appetite Exposure Table */}
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide border-b border-slate-300 pb-1.5 flex items-center justify-between">
            <span>1. Risks Above Organizational Risk Appetite</span>
            <span className="text-xs font-bold text-red-600">{aboveAppetiteRisks.length} Action Items</span>
          </h2>

          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <table className="w-full text-left text-xs border-collapse min-w-[620px]">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2 pr-2">ID</th>
                  <th className="py-2 px-2">Risk Title & Process</th>
                  <th className="py-2 px-2">Inherent</th>
                  <th className="py-2 px-2">Residual</th>
                  <th className="py-2 px-2">Treatment</th>
                  <th className="py-2 px-2">Owner</th>
                  <th className="py-2 pl-2 text-right">Exposure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {aboveAppetiteRisks.map((r, idx) => (
                  <tr key={`${r.id}-${idx}`} className="align-top">
                    <td className="py-2.5 pr-2 font-mono font-bold text-slate-900">{r.id}</td>
                    <td className="py-2.5 px-2">
                      <div className="font-bold text-slate-900">{r.title}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{r.affectedProcess || r.description}</div>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 font-bold text-[10px] rounded">
                        {r.inherentScore} ({r.inherentProbability}×{r.inherentImpact})
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded">
                        {r.residualScore} ({r.residualProbability}×{r.residualImpact})
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-slate-700">{r.treatmentStrategy || 'Mitigate'}</td>
                    <td className="py-2.5 px-2 text-slate-800 font-medium">
                      {r.ownerName}
                      <div className="text-[10px] text-slate-500">{r.ownerRole}</div>
                    </td>
                    <td className="py-2.5 pl-2 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(r.estimatedImpactUsd || r.score * 2500)}
                    </td>
                  </tr>
                ))}
                {aboveAppetiteRisks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-slate-500 italic">
                      All residual risk scores are currently within the approved organizational appetite limit.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overdue Mitigation Actions Table */}
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide border-b border-slate-300 pb-1.5 flex items-center justify-between">
            <span>2. Overdue Mitigation Actions & SLA Exceptions</span>
            <span className="text-xs font-bold text-red-600">{overdueActions.length} Overdue SLA</span>
          </h2>

          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <table className="w-full text-left text-xs border-collapse min-w-[540px]">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="py-2 pr-2">Action Title</th>
                  <th className="py-2 px-2">Linked Risk</th>
                  <th className="py-2 px-2">Assignee</th>
                  <th className="py-2 px-2">Target Due Date</th>
                  <th className="py-2 pl-2 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {overdueActions.map(a => (
                  <tr key={a.id} className="align-top">
                    <td className="py-2.5 pr-2 font-bold text-slate-900">{a.title}</td>
                    <td className="py-2.5 px-2 font-mono font-semibold text-indigo-700">{a.riskId}</td>
                    <td className="py-2.5 px-2 text-slate-800">{a.assignedOwnerName}</td>
                    <td className="py-2.5 px-2 font-bold text-red-600">{a.dueDate} (Overdue)</td>
                    <td className="py-2.5 pl-2 text-right font-mono font-bold text-slate-900">{a.progressPct}%</td>
                  </tr>
                ))}
                {overdueActions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500 italic">
                      All assigned mitigation tasks are within target SLA due dates.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formal Governance Sign-off Block */}
        <div className="pt-8 border-t-2 border-slate-900 space-y-6">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
            3. Operational Governance Sign-off & Board Approval Block
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-xs pt-4">
            <div className="border-t border-slate-400 pt-2 space-y-1">
              <div className="font-bold text-slate-900">Sunny Prasad</div>
              <div className="text-slate-500">Business Operations Intern & Lead Risk Assessor</div>
              <div className="text-[10px] text-slate-400 pt-4">Signature: ___________________________</div>
            </div>

            <div className="border-t border-slate-400 pt-2 space-y-1">
              <div className="font-bold text-slate-900">Yash Raj</div>
              <div className="text-slate-500">Operations Lead & Executive Sponsor</div>
              <div className="text-[10px] text-slate-400 pt-4">Signature: ___________________________</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
