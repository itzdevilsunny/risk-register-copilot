'use client';

import React, { useState } from 'react';
import { useRiskContext } from '../../context/RiskContext';
import { Search, Download, Filter, RefreshCw, FileText, Upload, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { ExecutivePDFModal } from './ExecutivePDFModal';
import { CSVImportModal } from './CSVImportModal';
import { CVEVulnerabilityScannerModal } from './CVEVulnerabilityScannerModal';

export const RiskFilters: React.FC = () => {
  const { filterState, setFilterState, resetFilters, teamMembers, risks, addToast } = useRiskContext();
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [isCveModalOpen, setIsCveModalOpen] = useState(false);

  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'Probability', 'Impact', 'Score', 'Severity', 'Status', 'Owner', 'Mitigation Plan', 'Due Date'];
    const rows = risks.map(r => [
      r.id,
      `"${r.title.replace(/"/g, '""')}"`,
      r.category,
      r.probability,
      r.impact,
      r.score,
      r.severity,
      r.status,
      `"${r.ownerName}"`,
      `"${r.mitigationPlan.replace(/"/g, '""')}"`,
      r.dueDate || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Risk_Register_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('CSV Exported', `Downloaded ${risks.length} risk items.`, 'success');
  };

  const categories = ['All', 'Technical', 'Resource', 'Financial', 'Schedule', 'Operational', 'Security', 'Compliance', 'External'];
  const severities = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const statuses = ['All', 'Open', 'Monitoring', 'Mitigated', 'Closed'];

  return (
    <>
      <ExecutivePDFModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        risks={risks}
      />
      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
      />
      <CVEVulnerabilityScannerModal
        isOpen={isCveModalOpen}
        onClose={() => setIsCveModalOpen(false)}
      />
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3.5">
        {/* Search & Top Action Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterState.searchQuery}
              onChange={(e) => setFilterState(prev => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Search risks by title, ID, category, or owner..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium"
            />
            {filterState.searchQuery && (
              <button
                onClick={() => setFilterState(prev => ({ ...prev, searchQuery: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Sort & Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort By */}
            <select
              value={filterState.sortBy}
              onChange={(e) => setFilterState(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
            >
              <option value="score_desc">Sort: Risk Score (High → Low)</option>
              <option value="score_asc">Sort: Risk Score (Low → High)</option>
              <option value="date_desc">Sort: Recently Created</option>
              <option value="title_asc">Sort: Title (A → Z)</option>
              <option value="probability_desc">Sort: Probability (High → Low)</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              icon={<ShieldAlert className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />}
              onClick={() => setIsCveModalOpen(true)}
            >
              CVE Scan
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={<Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
              onClick={() => setIsCSVModalOpen(true)}
            >
              Import CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={<FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
              onClick={() => setIsPDFModalOpen(true)}
            >
              PDF Report
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
              onClick={resetFilters}
              title="Reset Filters"
            >
              Reset
            </Button>
          </div>
        </div>

      {/* Filter Pills Bar */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Filter className="w-3 h-3 text-slate-400 dark:text-slate-500" /> Filters:
        </span>

        {/* Severity Pills */}
        <div className="flex flex-wrap items-center gap-1">
          {severities.map(sev => {
            const isSelected = filterState.severity === sev;
            return (
              <button
                key={sev}
                onClick={() => setFilterState(prev => ({ ...prev, severity: sev }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isSelected 
                    ? sev === 'Critical' ? 'bg-red-600 text-white shadow-xs'
                      : sev === 'High' ? 'bg-orange-600 text-white shadow-xs'
                      : sev === 'Medium' ? 'bg-amber-600 text-white shadow-xs'
                      : sev === 'Low' ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                }`}
              >
                {sev}
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Category Dropdown */}
        <select
          value={filterState.category}
          onChange={(e) => setFilterState(prev => ({ ...prev, category: e.target.value }))}
          className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
        >
          <option value="All">Category: All</option>
          {categories.filter(c => c !== 'All').map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Status Dropdown */}
        <select
          value={filterState.status}
          onChange={(e) => setFilterState(prev => ({ ...prev, status: e.target.value }))}
          className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
        >
          <option value="All">Status: All</option>
          {statuses.filter(s => s !== 'All').map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Owner Dropdown */}
        <select
          value={filterState.owner}
          onChange={(e) => setFilterState(prev => ({ ...prev, owner: e.target.value }))}
          className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
        >
          <option value="All">Owner: All</option>
          {teamMembers.map(m => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>
      </div>
    </div>
    </>
  );
};
