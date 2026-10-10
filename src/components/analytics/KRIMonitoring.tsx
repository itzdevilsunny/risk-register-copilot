'use client';

import React, { useState, useMemo } from 'react';
import { useRiskContext } from '../../context/RiskContext';
import { Button } from '../ui/Button';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  Zap, 
  RefreshCw,
  BellRing,
  Gauge,
  ShieldAlert,
  Plus,
  Download,
  ChevronRight
} from 'lucide-react';
import { AddKRIModal } from '../kri/AddKRIModal';
import { AIKRIScanModal } from '../kri/AIKRIScanModal';
import { KRIDetailModal } from '../kri/KRIDetailModal';

export interface KRIItem {
  id: string;
  name: string;
  category: string;
  currentValue: number;
  unit: string;
  targetThreshold: number;
  criticalThreshold: number;
  status: 'Normal' | 'Warning' | 'Breached';
  linkedRiskId: string;
  lastUpdated: string;
}

const INITIAL_KRIS: KRIItem[] = [
  {
    id: 'KRI-101',
    name: 'Production API Response Latency (p99)',
    category: 'Technical',
    currentValue: 124,
    unit: 'ms',
    targetThreshold: 150,
    criticalThreshold: 300,
    status: 'Normal',
    linkedRiskId: 'RSK-101',
    lastUpdated: '2 mins ago'
  },
  {
    id: 'KRI-102',
    name: 'Database Connection Pool Lock Saturation',
    category: 'Technical',
    currentValue: 68,
    unit: '%',
    targetThreshold: 50,
    criticalThreshold: 80,
    status: 'Warning',
    linkedRiskId: 'RSK-101',
    lastUpdated: 'Just now'
  },
  {
    id: 'KRI-103',
    name: 'Monthly Cloud Infrastructure Budget Variance',
    category: 'Financial',
    currentValue: 14.2,
    unit: '%',
    targetThreshold: 5.0,
    criticalThreshold: 20.0,
    status: 'Warning',
    linkedRiskId: 'RSK-103',
    lastUpdated: '1 hour ago'
  },
  {
    id: 'KRI-104',
    name: 'Senior Engineering Team Turnover Rate',
    category: 'Resource',
    currentValue: 18.5,
    unit: '%',
    targetThreshold: 8.0,
    criticalThreshold: 15.0,
    status: 'Breached',
    linkedRiskId: 'RSK-102',
    lastUpdated: '3 hours ago'
  },
  {
    id: 'KRI-105',
    name: 'Unmitigated Security Compliance Deficiencies',
    category: 'Compliance',
    currentValue: 0,
    unit: 'items',
    targetThreshold: 1,
    criticalThreshold: 3,
    status: 'Normal',
    linkedRiskId: 'RSK-104',
    lastUpdated: '5 mins ago'
  }
];

export const KRIMonitoring: React.FC = () => {
  const { risks, kris, recordKRIObservation, addKRI, updateRiskStatus, addToast } = useRiskContext();

  const [kriList, setKriList] = useState<KRIItem[]>(INITIAL_KRIS);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isAIScanModalOpen, setIsAIScanModalOpen] = useState<boolean>(false);
  const [activeKriDetail, setActiveKriDetail] = useState<KRIItem | null>(null);

  // Sync with persistent KRIs from server
  React.useEffect(() => {
    if (kris && kris.length > 0) {
      const mapped: KRIItem[] = kris.map(k => ({
        id: k.id,
        name: k.name,
        category: (risks.find(r => r.id === k.linkedRiskId)?.category || 'Technical'),
        currentValue: k.currentValue,
        unit: k.measurementUnit,
        targetThreshold: k.warningThreshold,
        criticalThreshold: k.criticalThreshold,
        status: (k.triggerStatus === 'Critical' ? 'Breached' : k.triggerStatus === 'Warning' ? 'Warning' : 'Normal') as any,
        linkedRiskId: k.linkedRiskId,
        lastUpdated: k.lastUpdated || 'Recently'
      }));
      setKriList(mapped);
    }
  }, [kris, risks]);

  const handleAddKRI = (newKri: KRIItem) => {
    setKriList(prev => [newKri, ...prev]);
    addKRI({
      name: newKri.name,
      description: `Monitored threshold indicator for ${newKri.linkedRiskId}`,
      linkedRiskId: newKri.linkedRiskId,
      ownerName: 'Sunny Prasad',
      measurementUnit: newKri.unit,
      dataSource: 'Telemetry Script',
      currentValue: newKri.currentValue,
      warningThreshold: newKri.targetThreshold,
      criticalThreshold: newKri.criticalThreshold,
      reportingFrequency: 'Weekly',
      trendDirection: 'Stable',
      triggerStatus: newKri.status === 'Breached' ? 'Critical' : newKri.status === 'Warning' ? 'Warning' : 'Normal'
    });
  };

  const handleSimulateSpike = async (id: string) => {
    const target = kriList.find(k => k.id === id);
    if (!target) return;
    const spikedVal = Math.round(target.currentValue * 1.8 * 10) / 10;
    const isBreached = spikedVal >= target.criticalThreshold;

    // Record persistent observation on server
    await recordKRIObservation(id, spikedVal, 'Live threshold stress observation');

    if (isBreached) {
      addToast(
        '⚠️ KRI SLA Breach Triggered!',
        `${target.name} reached ${spikedVal} ${target.unit} (Threshold: ${target.criticalThreshold} ${target.unit}). Auto-escalated linked risk ${target.linkedRiskId}.`,
        'error'
      );
      updateRiskStatus(target.linkedRiskId, 'Open');
    }

    const updated = {
      ...target,
      currentValue: spikedVal,
      status: (isBreached ? 'Breached' : spikedVal >= target.targetThreshold ? 'Warning' : 'Normal') as any,
      lastUpdated: 'Just now'
    };

    setKriList(prev => prev.map(k => k.id === id ? updated : k));
    if (activeKriDetail?.id === id) {
      setActiveKriDetail(updated);
    }
  };

  const handleResetMetric = (id: string) => {
    setKriList(prev => prev.map(kri => {
      if (kri.id !== id) return kri;

      const initial = INITIAL_KRIS.find(i => i.id === id);
      const resetVal = initial ? initial.currentValue : Math.round(kri.targetThreshold * 0.6);

      const updated = {
        ...kri,
        currentValue: resetVal,
        status: (resetVal >= kri.criticalThreshold ? 'Breached' : resetVal >= kri.targetThreshold ? 'Warning' : 'Normal') as any,
        lastUpdated: 'Just now'
      };

      if (activeKriDetail?.id === id) {
        setActiveKriDetail(updated);
      }

      addToast('Metric Restored', `Restored metric ${kri.id} baseline to ${resetVal} ${kri.unit}.`, 'info');
      return updated;
    }));
  };

  const handleResetKRIAll = () => {
    setKriList(INITIAL_KRIS);
    addToast('KRI Telemetry Reset', 'Restored baseline SLA indicator thresholds.', 'info');
  };

  const handleExportKRIText = () => {
    const lines = [
      `=================================================================`,
      `ENTERPRISE KEY RISK INDICATOR (KRI) TELEMETRY AUDIT REPORT`,
      `Generated: ${new Date().toISOString().split('T')[0]} | MNB Research Operations`,
      `=================================================================\n`,
      `MONITORED INDICATORS (${kriList.length} Metrics):`,
      `Breached SLA Triggers: ${kriList.filter(k => k.status === 'Breached').length}`,
      `Warning Level: ${kriList.filter(k => k.status === 'Warning').length}`,
      `Normal Status: ${kriList.filter(k => k.status === 'Normal').length}\n`,
      `DETAILED KRI TELEMETRY FEED:`,
      `-----------------------------------------------------------------`
    ];

    kriList.forEach(k => {
      lines.push(`[${k.id}] ${k.name} (${k.category})`);
      lines.push(`  Status: ${k.status.toUpperCase()} | Live Value: ${k.currentValue} ${k.unit}`);
      lines.push(`  Target Threshold: ${k.targetThreshold} ${k.unit} | Critical Breach: ${k.criticalThreshold} ${k.unit}`);
      lines.push(`  Linked Risk Register Item: ${k.linkedRiskId} | Last Telemetry Update: ${k.lastUpdated}`);
      lines.push(`-----------------------------------------------------------------`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KRI_Telemetry_Audit_Report_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('KRI Report Exported', 'Downloaded KRI telemetry audit report.', 'success');
  };

  return (
    <>
      <AddKRIModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddKRI={handleAddKRI}
      />

      <AIKRIScanModal
        isOpen={isAIScanModalOpen}
        onClose={() => setIsAIScanModalOpen(false)}
        kris={kriList}
      />

      <KRIDetailModal
        kri={activeKriDetail}
        isOpen={!!activeKriDetail}
        onClose={() => setActiveKriDetail(null)}
        onSimulateSpike={handleSimulateSpike}
        onResetMetric={handleResetMetric}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Gauge className="w-4.5 h-4.5" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Key Risk Indicator (KRI) Early-Warning Telemetry
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time metric thresholds monitoring operational performance and auto-escalating SLA breach threats.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="copilot"
              size="sm"
              icon={<Sparkles className="w-3.5 h-3.5 text-indigo-200" />}
              onClick={() => setIsAIScanModalOpen(true)}
            >
              Run AI KRI Anomaly Scan
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5 text-indigo-600" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add KRI Metric
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5 text-indigo-600" />}
              onClick={handleExportKRIText}
            >
              Export Report (.TXT)
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5 text-slate-600" />}
              onClick={handleResetKRIAll}
            >
              Reset Metrics
            </Button>
          </div>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Active KRIs</span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">{kriList.length} Metrics</div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Continuous telemetry feed</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20 shadow-2xs">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Warning Level</span>
            <div className="text-2xl font-black text-amber-950 dark:text-amber-200 mt-1 font-mono">
              {kriList.filter(k => k.status === 'Warning').length} Indicators
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Approaching target threshold</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/20 shadow-2xs">
            <span className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Breached SLA Triggers</span>
            <div className="text-2xl font-black text-red-950 dark:text-red-200 mt-1 font-mono">
              {kriList.filter(k => k.status === 'Breached').length} Critical
            </div>
            <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold">Auto-escalated to Risk Register</span>
          </div>
        </div>

        {/* KRI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kriList.map((kri) => (
            <div 
              key={kri.id}
              onClick={() => setActiveKriDetail(kri)}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-2xs space-y-3 cursor-pointer group hover:shadow-md ${
                kri.status === 'Breached' ? 'border-red-300 dark:border-red-900 ring-1 ring-red-200 dark:ring-red-950' :
                kri.status === 'Warning' ? 'border-amber-300 dark:border-amber-900' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {kri.id}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {kri.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1 group-hover:text-indigo-600 transition-colors">{kri.name}</h3>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                  kri.status === 'Breached' ? 'bg-red-100 text-red-800' :
                  kri.status === 'Warning' ? 'bg-amber-100 text-amber-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {kri.status}
                </span>
              </div>

              {/* Current Value Gauge */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">Live Value</span>
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                    {kri.currentValue} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">{kri.unit}</span>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                  <div>Warning Limit: <strong className="text-slate-800 dark:text-slate-200 font-mono">{kri.targetThreshold} {kri.unit}</strong></div>
                  <div>Critical Breach: <strong className="text-red-700 dark:text-red-400 font-mono">{kri.criticalThreshold} {kri.unit}</strong></div>
                </div>
              </div>

              {/* Inline Quick Telemetry Observation Logger */}
              <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Risk: <strong className="text-slate-700 dark:text-slate-300 font-mono">{kri.linkedRiskId}</strong>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleResetMetric(kri.id)}
                    className="px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                    title="Reset to baseline"
                  >
                    Reset
                  </button>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Zap className="w-3 h-3 text-amber-500" />}
                    onClick={() => handleSimulateSpike(kri.id)}
                  >
                    Spike
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
