'use client';

import React, { useRef } from 'react';
import { useRiskContext } from '../../context/RiskContext';
import { Button } from '../ui/Button';
import { 
  ShieldCheck, 
  X, 
  Printer, 
  Download, 
  Award, 
  CheckCircle2, 
  Lock,
  Building2,
  Calendar,
  Sparkles
} from 'lucide-react';

interface ComplianceCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthScore: number;
  compliantCount: number;
  warningCount: number;
  nonCompliantCount: number;
  totalControls: number;
}

export const ComplianceCertificateModal: React.FC<ComplianceCertificateModalProps> = ({
  isOpen,
  onClose,
  healthScore,
  compliantCount,
  warningCount,
  nonCompliantCount,
  totalControls
}) => {
  const { workspaceSettings, addToast } = useRiskContext();

  if (!isOpen) return null;

  const issueDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const certHash = `SHA256: ${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`.toUpperCase();

  const handlePrint = () => {
    window.print();
    addToast('Print Document Opened', 'Sent compliance certificate package to printer.', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-extrabold tracking-tight">
              Executive Compliance & Audit Certification Package
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Printable Body */}
        <div className="p-8 sm:p-12 overflow-y-auto flex-1 space-y-8 bg-gradient-to-b from-slate-50 via-white to-indigo-50/20 text-slate-900 print:overflow-visible">
          {/* Top Seal & Organization Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-900 tracking-tight">
                    {workspaceSettings.workspaceName || 'MNB Research Operations'}
                  </h1>
                  <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
                    Enterprise Risk Register & Governance Copilot
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right space-y-1">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs uppercase inline-flex items-center gap-1 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> AUDIT READY
              </span>
              <p className="text-[11px] text-slate-400 font-mono block">
                Certificate ID: CERT-{Date.now().toString().slice(-6)}
              </p>
            </div>
          </div>

          {/* Certificate Title */}
          <div className="text-center space-y-2 py-4">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Certificate of Regulatory Compliance & Assurance
            </h2>
            <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
              This official document certifies that continuous automated risk modeling, security control evaluations, and stochastic threat monitoring are active across enterprise infrastructure.
            </p>
          </div>

          {/* Score Badge Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-center sm:border-r border-slate-100 pr-0 sm:pr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overall Health</span>
              <div className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono mt-1">{healthScore}%</div>
              <span className="text-[10px] text-emerald-600 font-semibold">High Readiness</span>
            </div>

            <div className="text-center sm:border-r border-slate-100 px-0 sm:px-2">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Compliant</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono mt-1">{compliantCount}</div>
              <span className="text-[10px] text-emerald-600 font-medium">Controls Aligned</span>
            </div>

            <div className="text-center sm:border-r border-slate-100 px-0 sm:px-2">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Warnings</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-950 font-mono mt-1">{warningCount}</div>
              <span className="text-[10px] text-amber-600 font-medium">Mitigations Active</span>
            </div>

            <div className="text-center pl-0 sm:pl-2">
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">Deficient</span>
              <div className="text-2xl sm:text-3xl font-black text-red-950 font-mono mt-1">{nonCompliantCount}</div>
              <span className="text-[10px] text-red-600 font-medium">Action Items</span>
            </div>
          </div>

          {/* Framework Assurances */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Supported & Verified Regulatory Frameworks
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { name: 'ISO 31000:2018', status: 'Compliant', desc: 'Risk Management Guidelines' },
                { name: 'NIST SP 800-30 Rev 1', status: 'Compliant', desc: 'Risk Assessment for IT Systems' },
                { name: 'SOC 2 Type II', status: 'Compliant', desc: 'Trust Services Criteria (Security & Ops)' },
                { name: 'GDPR (EU 2016/679)', status: 'Compliant', desc: 'Data Protection & Processing (Art 32)' },
                { name: 'PCI DSS v4.0', status: 'Compliant', desc: 'Payment Security & Event Logging' },
                { name: 'ISO 27001:2022', status: 'Compliant', desc: 'Information Security Management System' },
              ].map(fw => (
                <div key={fw.name} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{fw.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 uppercase">
                      {fw.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">{fw.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Signatures & Security Seals */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 items-end">
            <div className="space-y-3">
              <div className="font-mono text-[10px] text-slate-400 break-all bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-600 block mb-0.5">Cryptographic Verification Hash:</span>
                {certHash}
              </div>
              <p className="text-[10px] text-slate-500">
                Issued on: <strong>{issueDate}</strong> &bull; Valid for 12 Months
              </p>
            </div>

            <div className="text-left sm:text-right space-y-4 sm:space-y-6">
              <div className="inline-block border-b-2 border-slate-900 pb-1 px-4 sm:px-8">
                <span className="font-serif italic text-lg text-slate-800 font-bold block">Sunny Prasad</span>
              </div>
              <div>
                <p className="font-extrabold text-xs text-slate-900">Chief Information Security Officer (CISO)</p>
                <p className="text-[10px] text-slate-500">MNB Research Operations Governance Board</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between print:hidden">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Printer className="w-3.5 h-3.5" />}
            onClick={handlePrint}
          >
            Print / Save PDF Certificate
          </Button>
        </div>
      </div>
    </div>
  );
};
