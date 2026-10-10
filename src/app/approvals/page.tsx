'use client';

import React, { useState } from 'react';
import { useRiskContext } from '../../context/RiskContext';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileCheck, 
  UserCheck, 
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  CheckCheck,
  Plus
} from 'lucide-react';

export default function ApprovalsPage() {
  const { approvals, reviews, risks, createApprovalRequest, updateApprovalStatus, addToast, currentUser } = useRiskContext();
  const [activeTab, setActiveTab] = useState<'approvals' | 'reviews'>('approvals');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [decisionComment, setDecisionComment] = useState('');

  // Request form state
  const [riskId, setRiskId] = useState(risks[0]?.id || '');
  const [type, setType] = useState<'Risk Acceptance' | 'Score Change' | 'Treatment Sign-off'>('Risk Acceptance');
  const [approverName, setApproverName] = useState('Chief Risk Officer (CRO)');
  const [reason, setReason] = useState('');

  const pendingApprovals = approvals.filter(a => a.status === 'Pending');
  const decidedApprovals = approvals.filter(a => a.status !== 'Pending');

  const filteredApprovals = approvals.filter(req => {
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = req.riskTitle.toLowerCase().includes(q);
      const matchId = req.riskId.toLowerCase().includes(q);
      const matchReq = req.requestedBy.toLowerCase().includes(q);
      const matchReason = req.reason.toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchReq && !matchReason) return false;
    }
    return true;
  });

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskId || !reason.trim()) return;

    const targetRisk = risks.find(r => r.id === riskId);

    createApprovalRequest({
      riskId,
      riskTitle: targetRisk?.title || 'Target Risk',
      type,
      requestedBy: currentUser.name,
      approverName,
      residualScore: targetRisk?.residualScore || 12,
      reason
    });

    setIsModalOpen(false);
    setReason('');
  };

  const handleDecision = (id: string, status: 'Approved' | 'Rejected', comment?: string) => {
    updateApprovalStatus(id, status, comment || decisionComment || undefined);
    setRejectModalId(null);
    setDecisionComment('');
  };

  const handleBatchApproveAll = async () => {
    if (pendingApprovals.length === 0) return;
    for (const req of pendingApprovals) {
      await updateApprovalStatus(req.id, 'Approved', `Bulk executive sign-off by ${currentUser.name}`);
    }
    addToast('Bulk Approval Complete', `Approved all ${pendingApprovals.length} pending risk requests.`, 'success');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Governance, Reviews & Approvals</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Formal risk reviews, residual risk acceptance sign-offs, and administrative score approvals with executive CRO audit trail.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {pendingApprovals.length > 0 && (
            <button
              onClick={handleBatchApproveAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm"
              title="Sign off all currently pending requests at once"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Approve All ({pendingApprovals.length})</span>
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Request Risk Acceptance</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 px-3 transition-colors border-b-2 ${
            activeTab === 'approvals'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Governance Sign-offs ({pendingApprovals.length} pending / {approvals.length} total)
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 px-3 transition-colors border-b-2 ${
            activeTab === 'reviews'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Scheduled Risk Reviews ({reviews.length})
        </button>
      </div>

      {/* Approvals Tab Content */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by risk ID, title, or requester..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-center">
              {(['all', 'Pending', 'Approved', 'Rejected'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {st === 'all' ? 'All Requests' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Pending Approval Cards */}
          {(statusFilter === 'all' || statusFilter === 'Pending') && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                  Pending Management Sign-off ({pendingApprovals.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingApprovals.map((req) => {
                  const targetRisk = risks.find(r => r.id === req.riskId);
                  const isAboveAppetite = targetRisk ? (targetRisk.aboveAppetite || targetRisk.residualScore > 12) : req.residualScore > 12;

                  return (
                    <div 
                      key={req.id} 
                      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-mono font-bold rounded text-[10px]">
                              {req.type}
                            </span>
                            {isAboveAppetite ? (
                              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-400 font-semibold rounded text-[10px] inline-flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> Residual {req.residualScore} &gt; Appetite
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-semibold rounded text-[10px] inline-flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Residual {req.residualScore} (Within Appetite)
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1.5">{req.riskTitle}</h4>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Risk ID: {req.riskId}</div>
                        </div>
                        <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/70 text-amber-800 dark:text-amber-300 rounded-full text-[10px] font-extrabold shrink-0 animate-pulse">
                          Pending
                        </span>
                      </div>

                      <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block mb-0.5">Rationale / Justification:</span>
                        <p className="italic text-slate-600 dark:text-slate-400">{req.reason}</p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                        <div>Requested by: <span className="font-semibold text-slate-800 dark:text-slate-200">{req.requestedBy}</span></div>
                        <div>Target Approver: <span className="font-semibold text-slate-800 dark:text-slate-200">{req.approverName}</span></div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => setRejectModalId(req.id)}
                          className="px-3 py-1.5 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Reject Request
                        </button>
                        <button
                          onClick={() => handleDecision(req.id, 'Approved')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> 1-Click CRO Sign-off
                        </button>
                      </div>
                    </div>
                  );
                })}
                {pendingApprovals.length === 0 && (
                  <div className="col-span-2 p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                    No pending approval requests. All risk acceptance decisions are up to date.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History of Decisions Table */}
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-3">
              Governance Decision Ledger ({decidedApprovals.length})
            </h3>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    <th className="px-5 py-3">Risk & Type</th>
                    <th className="px-4 py-3">Requested By</th>
                    <th className="px-4 py-3">Approver</th>
                    <th className="px-4 py-3">Decision</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {decidedApprovals.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-100">
                        <div>{req.riskTitle}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{req.riskId} · {req.type}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{req.requestedBy}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{req.approverName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          req.status === 'Approved' 
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300' 
                            : 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300'
                        }`}>
                          {req.status === 'Approved' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {req.decidedTimestamp ? new Date(req.decidedTimestamp).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                  {decidedApprovals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-slate-400 text-xs">
                        No historical decisions logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Completed Risk Review Records</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {reviews.map((rev) => (
              <div key={rev.id} className="py-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{rev.riskTitle}</div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{rev.reviewDate}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">{rev.summary}</div>
                <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Reviewer: {rev.reviewerName} ({rev.reviewerRole})</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-popover border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Request Formal Risk Acceptance</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Risk</label>
                <select
                  value={riskId}
                  onChange={e => setRiskId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 font-semibold"
                >
                  {risks.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.id}: {r.title} (Residual Score: {r.residualScore})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Request Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 font-semibold"
                >
                  <option value="Risk Acceptance">Risk Acceptance (Above Appetite)</option>
                  <option value="Score Change">Score Change Approval</option>
                  <option value="Treatment Sign-off">Treatment Strategy Sign-off</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Approver</label>
                <input
                  type="text"
                  value={approverName}
                  onChange={e => setApproverName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Governance Rationale / Business Justification</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State business reason for accepting residual risk exposure..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal with Comments */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-popover border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Reject Risk Acceptance Request</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Please provide mandatory rejection comments for audit trail.</p>
            <textarea
              rows={2}
              placeholder="e.g. Additional controls must be implemented before acceptance..."
              value={decisionComment}
              onChange={e => setDecisionComment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalId(null)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDecision(rejectModalId, 'Rejected')}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
