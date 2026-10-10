'use client';

import React, { useState } from 'react';
import { useRiskContext } from '../../context/RiskContext';
import { Button } from '../ui/Button';
import { 
  DollarSign, 
  X, 
  TrendingUp, 
  CheckCircle2, 
  Sparkles, 
  ArrowUpRight, 
  ShieldCheck, 
  Zap, 
  PieChart,
  Lock
} from 'lucide-react';

export interface ROIRiskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  estimatedLoss: number;
  estimatedMitigationCost: number;
  expectedLossReduction: number;
  netSavings: number;
  roiPercent: number;
  mitigationProgress: number;
}

interface RiskROIDetailModalProps {
  item: ROIRiskItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RiskROIDetailModal: React.FC<RiskROIDetailModalProps> = ({
  item,
  isOpen,
  onClose
}) => {
  const { updateRisk, formatCurrency, addToast } = useRiskContext();

  const [isFunding, setIsFunding] = useState<boolean>(false);

  if (!isOpen || !item) return null;

  const handleApproveFunding = () => {
    setIsFunding(true);
    const nextProgress = Math.min(100, item.mitigationProgress + 40);
    updateRisk(item.id, {
      mitigationProgress: nextProgress,
      status: nextProgress >= 100 ? 'Mitigated' : 'Monitoring'
    });

    addToast(
      'Capital Approved & Allocated',
      `Funded ${formatCurrency(item.estimatedMitigationCost)} for ${item.id}. Updated mitigation progress to ${nextProgress}%.`,
      'success'
    );
    setIsFunding(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-emerald-200 bg-emerald-500/30 px-2 py-0.5 rounded">
                  {item.id} &bull; {item.category}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  +{item.roiPercent}% ROI
                </span>
              </div>
              <h2 className="text-base font-extrabold tracking-tight mt-0.5">
                {item.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* ROI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Potential Loss</span>
              <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                {formatCurrency(item.estimatedLoss)}
              </div>
            </div>

            <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl text-center">
              <span className="text-[10px] font-bold text-indigo-700 uppercase">Mitigation Spend</span>
              <div className="text-lg font-black text-indigo-950 font-mono mt-0.5">
                {formatCurrency(item.estimatedMitigationCost)}
              </div>
            </div>

            <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Net Financial Savings</span>
              <div className="text-lg font-black text-emerald-950 font-mono mt-0.5">
                {formatCurrency(item.netSavings)}
              </div>
            </div>

            <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">ROI Multiplier</span>
              <div className="text-lg font-black text-emerald-950 font-mono mt-0.5">
                +{item.roiPercent}%
              </div>
            </div>
          </div>

          {/* Description & Plan */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Risk Context & Description</span>
            <p className="text-slate-800 font-medium text-xs leading-relaxed">{item.description}</p>
          </div>

          {/* Financial Breakdown Progress */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-emerald-600" /> Capital Loss Avoidance Breakdown
            </h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600">Mitigation Investment vs Loss Avoided</span>
                <span className="text-emerald-600 font-mono font-bold">
                  {formatCurrency(item.netSavings)} Net Savings
                </span>
              </div>

              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  className="bg-indigo-600 h-full"
                  style={{ width: `${Math.min(100, (item.estimatedMitigationCost / (item.estimatedLoss || 1)) * 100)}%` }}
                  title="Mitigation Cost"
                />
                <div 
                  className="bg-emerald-500 h-full"
                  style={{ width: `${Math.min(100, (item.netSavings / (item.estimatedLoss || 1)) * 100)}%` }}
                  title="Net Savings"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600" /> Capital Invested: {formatCurrency(item.estimatedMitigationCost)}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Capital Saved: {formatCurrency(item.netSavings)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          <Button
            variant="copilot"
            size="sm"
            icon={<ArrowUpRight className="w-3.5 h-3.5 text-emerald-200" />}
            onClick={handleApproveFunding}
            disabled={isFunding}
          >
            Approve & Fund Mitigation ({formatCurrency(item.estimatedMitigationCost)})
          </Button>
        </div>
      </div>
    </div>
  );
};
