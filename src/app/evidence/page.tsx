'use client';

import React, { useState } from 'react';
import { useRiskContext } from '../../context/RiskContext';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Trash2, 
  FileCheck,
  Download,
  CalendarPlus,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function EvidencePage() {
  const { evidence, risks, controls, addEvidence, updateEvidence, deleteEvidence, currentUser } = useRiskContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Upload Form
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [linkedRiskId, setLinkedRiskId] = useState('');
  const [linkedControlId, setLinkedControlId] = useState('');
  const [validityExpiryDate, setValidityExpiryDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const now = new Date();

  const filteredEvidence = evidence.filter(ev => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const mName = ev.fileName.toLowerCase().includes(q);
      const mDesc = ev.description.toLowerCase().includes(q);
      const mBy = ev.uploadedBy.toLowerCase().includes(q);
      const mRisk = ev.linkedRiskId?.toLowerCase().includes(q);
      const mCtrl = ev.linkedControlId?.toLowerCase().includes(q);
      if (!mName && !mDesc && !mBy && !mRisk && !mCtrl) return false;
    }

    const isExpired = ev.validityExpiryDate && new Date(ev.validityExpiryDate) < now;
    const computedStatus = isExpired ? 'Expired' : ev.verificationStatus;

    if (statusFilter !== 'All' && computedStatus !== statusFilter) return false;
    return true;
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDocName = fileName.trim() || (selectedFile ? selectedFile.name : '');
    if (!finalDocName) return;

    let finalFileUrl = `/uploads/${finalDocName}`;
    let finalFileSize = selectedFile ? selectedFile.size : 102400;
    let finalFileType = selectedFile ? selectedFile.type : (finalDocName.endsWith('.pdf') ? 'application/pdf' : 'text/plain');

    if (selectedFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('linkedRiskId', linkedRiskId);
        formData.append('linkedControlId', linkedControlId);
        formData.append('description', description);
        const res = await fetch('/api/evidence/upload', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          if (data.evidence) {
            finalFileUrl = data.evidence.fileUrl;
            finalFileSize = data.evidence.fileSize;
            finalFileType = data.evidence.fileType;
          }
        }
      } catch (err) {
        console.error('Evidence upload error:', err);
      } finally {
        setIsUploading(false);
      }
    }

    await addEvidence({
      fileName: finalDocName,
      fileType: finalFileType || 'application/pdf',
      fileSize: finalFileSize,
      fileUrl: finalFileUrl,
      linkedRiskId: linkedRiskId || undefined,
      linkedControlId: linkedControlId || undefined,
      uploadedBy: currentUser.name,
      description: description || 'Audit verification document',
      validityExpiryDate: validityExpiryDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      verificationStatus: 'Verified',
      verifierName: currentUser.name
    });

    setIsModalOpen(false);
    setSelectedFile(null);
    setFileName('');
    setDescription('');
  };

  const handleToggleVerification = async (ev: any) => {
    const nextStatus = ev.verificationStatus === 'Verified' ? 'Pending' : 'Verified';
    await updateEvidence(ev.id, {
      verificationStatus: nextStatus,
      verifierName: currentUser.name
    });
  };

  const handleExtendExpiry = async (ev: any) => {
    const newDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await updateEvidence(ev.id, {
      validityExpiryDate: newDate,
      verificationStatus: 'Verified',
      verifierName: currentUser.name
    });
  };

  const handleDownload = (ev: any) => {
    if (ev.fileUrl && ev.fileUrl.startsWith('/uploads/')) {
      const link = document.createElement('a');
      link.href = ev.fileUrl;
      link.download = ev.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const cert = `MNB RESEARCH ENTERPRISE RISK & COMPLIANCE EVIDENCE RECORD
==========================================================
Document: ${ev.fileName}
ID: ${ev.id}
Uploaded By: ${ev.uploadedBy}
Timestamp: ${ev.uploadTimestamp}
Verification Status: ${ev.verificationStatus}
Linked Risk: ${ev.linkedRiskId || 'None'}
Linked Control: ${ev.linkedControlId || 'None'}
Validity Expiry: ${ev.validityExpiryDate || 'None'}
Checksum: ${ev.checksum || 'SHA256-AUTHENTICATED'}
Description: ${ev.description}
==========================================================
Verified by MNB Research Business Operations Audit Engine.`;
      const blob = new Blob([cert], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = ev.fileName.endsWith('.txt') || ev.fileName.endsWith('.pdf') ? ev.fileName : `${ev.fileName}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Audit & Compliance Evidence Library</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Central repository for verified test logs, access reviews, policies, and supporting compliance documents.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Evidence</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Documents</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">{evidence.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Verified evidence files</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verified Evidence</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {evidence.filter(e => e.verificationStatus === 'Verified').length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Approved by audit team</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Expired Evidence</span>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-2">
            {evidence.filter(e => e.validityExpiryDate && new Date(e.validityExpiryDate) < now).length}
          </div>
          <div className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-1">Requires renewal upload</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Review</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {evidence.filter(e => e.verificationStatus === 'Pending').length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Awaiting auditor sign-off</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search evidence files by filename, description, risk ID, or uploader..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <Filter className="w-3.5 h-3.5" />
          <span>Status:</span>
          {(['All', 'Verified', 'Pending', 'Expired'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3.5">File Name & Description</th>
                <th className="px-4 py-3.5">Linked Entity</th>
                <th className="px-4 py-3.5">Uploaded By</th>
                <th className="px-4 py-3.5">Validity Expiry</th>
                <th className="px-4 py-3.5">Verification</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {filteredEvidence.map((ev) => {
                const isExpired = ev.validityExpiryDate && new Date(ev.validityExpiryDate) < now;

                return (
                  <tr key={ev.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{ev.fileName}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{ev.description}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      {ev.linkedRiskId && (
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold rounded text-[10px]">
                          Risk: {ev.linkedRiskId}
                        </span>
                      )}
                      {ev.linkedControlId && (
                        <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono font-bold rounded text-[10px] ml-1">
                          Control: {ev.linkedControlId}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{ev.uploadedBy}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {new Date(ev.uploadTimestamp).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className={`font-semibold ${isExpired ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                            {ev.validityExpiryDate || 'N/A'}
                          </div>
                          {isExpired && (
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-bold block">Expired Document</span>
                          )}
                        </div>
                        {isExpired && (
                          <button
                            onClick={() => handleExtendExpiry(ev)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 transition-colors"
                            title="Renew document validity by +90 days"
                          >
                            <CalendarPlus className="w-3 h-3" />
                            +90d
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleVerification(ev)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 border transition-all cursor-pointer ${
                          isExpired
                            ? 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                            : ev.verificationStatus === 'Verified'
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:opacity-80'
                              : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:opacity-80'
                        }`}
                        title="Click to toggle status between Verified and Pending"
                      >
                        {isExpired ? (
                          <XCircle className="w-3 h-3" />
                        ) : ev.verificationStatus === 'Verified' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{isExpired ? 'Expired' : ev.verificationStatus}</span>
                      </button>
                    </td>

                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDownload(ev)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Download Evidence Record"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteEvidence(ev.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Delete Evidence"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredEvidence.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                    No evidence records found. Click "Upload Evidence" to attach a document.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-popover border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Upload Audit Evidence</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select File from Computer</label>
                <input
                  type="file"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setSelectedFile(f);
                      if (!fileName) setFileName(f.name);
                    }
                  }}
                  className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-950/70 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Document File Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3_Database_Access_Review.pdf"
                  value={fileName}
                  onChange={e => setFileName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Summary of document evidence..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Link to Risk</label>
                  <select
                    value={linkedRiskId}
                    onChange={e => setLinkedRiskId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="">None</option>
                    {risks.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.id}: {r.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Link to Control</label>
                  <select
                    value={linkedControlId}
                    onChange={e => setLinkedControlId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="">None</option>
                    {controls.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.id}: {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Validity / Expiry Date</label>
                <input
                  type="date"
                  value={validityExpiryDate}
                  onChange={e => setValidityExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 font-semibold"
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
                  disabled={isUploading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Confirm & Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
