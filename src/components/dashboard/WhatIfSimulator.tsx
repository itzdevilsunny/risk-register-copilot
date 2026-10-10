'use client';

import React, { useState, useMemo } from 'react';
import { useRiskContext } from '../../context/RiskContext';
import { Sliders, ShieldCheck, TrendingDown, RotateCcw, Info } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const WhatIfSimulator: React.FC = () => {
  const { risks } = useRiskContext();

  // Simulated mitigation state per risk ID: riskId -> simulatedProgress (0 to 100)
  const [simulatedProgress, setSimulatedProgress] = useState<Record<string, number>>({});

  const formatUSD = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${Math.round(val).toLocaleString()}`;
  };

  // Calculate baseline vs simulated portfolio financial exposure
  const stats = useMemo(() => {
    let baselineTotal = 0;
    let simulatedTotal = 0;

    risks.forEach(r => {
      const baseImpact = r.estimatedImpactUsd || (r.score * 2500);
      baselineTotal += baseImpact;

      const currentProg = simulatedProgress[r.id] !== undefined 
        ? simulatedProgress[r.id] 
        : r.mitigationProgress || 0;

      // Exposure remaining scales inversely with mitigation progress (100% progress = 15% residual risk floor)
      const residualFactor = 1 - (currentProg / 100) * 0.85;
      simulatedTotal += baseImpact * residualFactor;
    });

    const projectedAvoidance = Math.max(0, baselineTotal - simulatedTotal);
    const reductionPercent = baselineTotal > 0 ? Math.round((projectedAvoidance / baselineTotal) * 100) : 0;

    const chartData = [
      { name: 'Baseline Exposure', amount: Math.round(baselineTotal), fill: '#ef4444' },
      { name: 'Simulated Residual', amount: Math.round(simulatedTotal), fill: '#10b981' }
    ];

    return {
      baselineTotal,
      simulatedTotal,
      projectedAvoidance,
      reductionPercent,
      chartData
    };
  }, [risks, simulatedProgress]);

  const handleSliderChange = (riskId: string, value: number) => {
    setSimulatedProgress(prev => ({
      ...prev,
      [riskId]: value
    }));
  };

  const handleResetSim = () => {
    setSimulatedProgress({});
  };

  const handleMaximizeAll = () => {
    const maxed: Record<string, number> = {};
    risks.forEach(r => {
      maxed[r.id] = 100;
    });
    setSimulatedProgress(maxed);
  };

  const handleStressTechOutage = () => {
    const next: Record<string, number> = {};
    risks.forEach(r => {
      if (r.category === 'Technical' || r.category === 'Operational') {
        next[r.id] = 10;
      } else {
        next[r.id] = r.mitigationProgress || 0;
      }
    });
    setSimulatedProgress(next);
  };

  const handleStressSecuritySurge = () => {
    const next: Record<string, number> = {};
    risks.forEach(r => {
      if (r.category === 'Security' || r.severity === 'Critical') {
        next[r.id] = 5;
      } else {
        next[r.id] = r.mitigationProgress || 0;
      }
    });
    setSimulatedProgress(next);
  };

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Scenario Simulation (Stress Testing)
            </h3>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono-code font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Hypothetical Model
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Simulate portfolio residual exposure under hypothetical mitigation completion rates. Official risk records remain unmodified.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            onClick={handleStressTechOutage}
            className="px-2 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 cursor-pointer transition-colors"
          >
            🔥 Outage Shock
          </button>

          <button
            onClick={handleStressSecuritySurge}
            className="px-2 py-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 cursor-pointer transition-colors"
          >
            ⚡ Threat Surge
          </button>

          <button
            onClick={handleMaximizeAll}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 cursor-pointer transition-colors"
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Max 100%</span>
          </button>

          <button
            onClick={handleResetSim}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* KPI Cards & Comparison Bar Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* KPI Stats */}
        <div className="space-y-2.5">
          <div className="p-3 rounded-lg bg-slate-900 dark:bg-slate-800/80 text-white shadow-2xs border border-slate-800 dark:border-slate-700 space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Baseline Projected Exposure</span>
            <div className="text-xl font-black font-mono-code text-red-400">{formatUSD(stats.baselineTotal)}</div>
            <p className="text-[10px] text-slate-400">Current unmitigated portfolio baseline</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 dark:bg-slate-800/80 text-white shadow-2xs border border-emerald-900/60 dark:border-emerald-800/60 space-y-0.5">
            <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider block">Simulated Post-Mitigation Exposure</span>
            <div className="text-xl font-black font-mono-code text-emerald-400">{formatUSD(stats.simulatedTotal)}</div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 pt-0.5">
              <TrendingDown className="w-3 h-3" />
              <span>{stats.reductionPercent}% Residual Reduction</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 space-y-0.5">
            <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">Projected Exposure Avoidance</span>
            <div className="text-xl font-black font-mono-code text-indigo-900 dark:text-indigo-300">{formatUSD(stats.projectedAvoidance)}</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Hypothetical exposure avoided</p>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="lg:col-span-2 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Portfolio Exposure Comparison ($ USD)</span>
          </h4>

          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickFormatter={(val) => formatUSD(val)} />
                <Tooltip 
                  formatter={(val: any) => [formatUSD(Number(val)), 'Exposure']} 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: '1px solid #334155', fontSize: '11px' }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interactive Risk Sliders Table */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          Active Risk Items & Mitigation Assumption Sliders
        </h4>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto pr-1">
          {risks.map((r, idx) => {
            const currentVal = simulatedProgress[r.id] !== undefined ? simulatedProgress[r.id] : (r.mitigationProgress || 0);
            return (
              <div key={`${r.id}-${idx}`} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-code text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {r.id}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{r.title}</h5>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>Owner: {r.ownerName}</span>
                    <span>•</span>
                    <span className="font-mono-code text-slate-700 dark:text-slate-300 font-bold">Score: {r.score}/25</span>
                    <span>•</span>
                    <span className="font-mono-code text-slate-700 dark:text-slate-300">Base: {formatUSD(r.estimatedImpactUsd || r.score * 2500)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-64 shrink-0">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={currentVal}
                    onChange={(e) => handleSliderChange(r.id, Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="font-mono-code text-xs font-extrabold text-indigo-600 dark:text-indigo-400 w-12 text-right">
                    {currentVal}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
