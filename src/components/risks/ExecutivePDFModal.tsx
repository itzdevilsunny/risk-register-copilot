'use client';

import React from 'react';
import { RiskItem } from '../../types/risk';
import { FileText, Printer, X, ShieldAlert, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';

interface ExecutivePDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  risks: RiskItem[];
}

export const ExecutivePDFModal: React.FC<ExecutivePDFModalProps> = ({ isOpen, onClose, risks }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalRisks = risks.length;
  const criticalCount = risks.filter(r => r.severity === 'Critical').length;
  const highCount = risks.filter(r => r.severity === 'High').length;
  const mediumCount = risks.filter(r => r.severity === 'Medium').length;
  const lowCount = risks.filter(r => r.severity === 'Low').length;
  const openCount = risks.filter(r => r.status === 'Open').length;
  const mitigatedCount = risks.filter(r => r.status === 'Mitigated' || r.status === 'Closed').length;

  const totalFinancialExposure = risks.reduce((acc, r) => acc + (r.estimatedImpactUsd || 0), 0);
  const avgProgress = totalRisks > 0 
    ? Math.round(risks.reduce((acc, r) => acc + (r.mitigationProgress || 0), 0) / totalRisks) 
    : 0;

  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Modal Header & Action Bar (Hidden during Print) */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold">Executive PDF Audit Report Preview</h2>
              <p className="text-[11px] text-slate-400">Print or Save as PDF for MNB Research Governance</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="copilot"
              size="sm"
              icon={<Printer className="w-4 h-4 text-white" />}
              onClick={handlePrint}
            >
              Print / Save as PDF
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="printable-report" className="p-8 sm:p-10 space-y-6 overflow-y-auto bg-white text-slate-900 font-sans print:p-0 print:overflow-visible">
          
          {/* Document Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xs tracking-wider uppercase mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>MNB Research · Business Operations</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Risk Audit & Governance Summary</h1>
              <p className="text-xs text-slate-500 mt-1">
                Automated Operational Risk Analysis, Severity Profiling & Mitigation Matrix
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="font-mono font-bold text-slate-900 block">REF: MNB-RSK-AUDIT-2026</span>
              <span className="text-slate-500">{formattedDate}</span>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                STATUS: AUDITED
              </span>
            </div>
          </div>

          {/* Executive Metrics Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Registered</span>
              <span className="text-xl font-black text-slate-900">{totalRisks} Risks</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Critical / High Severity</span>
              <span className="text-xl font-black text-red-600">{criticalCount + highCount}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Financial Exposure</span>
              <span className="text-xl font-black text-indigo-600">
                ${(totalFinancialExposure / 1000).toFixed(1)}k USD
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mitigation Readiness</span>
              <span className="text-xl font-black text-emerald-600">{avgProgress}%</span>
            </div>
          </div>

          {/* Severity Breakdown Bar */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Severity Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold">
              <div className="p-2 rounded bg-red-50 border border-red-200 text-red-900">
                Critical (≥17): {criticalCount}
              </div>
              <div className="p-2 rounded bg-orange-50 border border-orange-200 text-orange-900">
                High (10-16): {highCount}
              </div>
              <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900">
                Medium (5-9): {mediumCount}
              </div>
              <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
                Low (1-4): {lowCount}
              </div>
            </div>
          </div>

          {/* Full Risk Inventory Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Active Risk Inventory</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-200 min-w-[580px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                    <th className="p-2 border-r border-slate-200">ID</th>
                    <th className="p-2 border-r border-slate-200">Title</th>
                    <th className="p-2 border-r border-slate-200">Category</th>
                    <th className="p-2 border-r border-slate-200 text-center">P × I</th>
                    <th className="p-2 border-r border-slate-200 text-center">Score</th>
                    <th className="p-2 border-r border-slate-200">Severity</th>
                    <th className="p-2 border-r border-slate-200">Owner</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {risks.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-2 font-mono font-bold text-slate-600 border-r border-slate-200">{r.id}</td>
                      <td className="p-2 font-semibold text-slate-900 border-r border-slate-200">{r.title}</td>
                      <td className="p-2 text-slate-600 border-r border-slate-200">{r.category}</td>
                      <td className="p-2 text-center text-slate-600 font-mono border-r border-slate-200">{r.probability} × {r.impact}</td>
                      <td className="p-2 text-center font-bold text-slate-900 border-r border-slate-200">{r.score}</td>
                      <td className="p-2 font-bold border-r border-slate-200">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          r.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                          r.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                          r.severity === 'Medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {r.severity}
                        </span>
                      </td>
                      <td className="p-2 text-slate-700 border-r border-slate-200">{r.ownerName}</td>
                      <td className="p-2 font-semibold text-slate-800">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sign-off & Governance Stamp */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-xs">
            <div>
              <span className="font-bold text-slate-900 block mb-1">Prepared By:</span>
              <p className="text-slate-600">Sunny Prasad</p>
              <p className="text-slate-400 text-[11px]">Business Operations Intern, MNB Research</p>
            </div>
            <div>
              <span className="font-bold text-slate-900 block mb-1">Executive Sign-Off:</span>
              <div className="h-8 border-b border-dashed border-slate-300 mb-1" />
              <p className="text-slate-400 text-[11px]">Operations Lead & Risk Governance Board</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
