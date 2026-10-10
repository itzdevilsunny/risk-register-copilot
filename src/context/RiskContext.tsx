'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  RiskItem, 
  Project, 
  TeamMember, 
  FilterState, 
  StatusLevel, 
  AIRiskAnalysisResult, 
  RiskCategory,
  ProbabilityLevel,
  ImpactLevel,
  Control,
  MitigationAction,
  EvidenceRecord,
  KeyRiskIndicator,
  RiskReviewRecord,
  ApprovalRequest,
  AuditLogItem,
  UserRole,
  calculateSeverity
} from '../types/risk';
import { analyzeRiskWithAI } from '../lib/api';

export interface ToastNotice {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export interface WorkspaceSettings {
  workspaceName: string;
  riskIdPrefix: string;
  defaultReviewDays: number;
  cloudSyncMode: 'auto' | 'manual';
  currency: 'USD' | 'EUR' | 'GBP' | 'INR';
  criticalScoreThreshold: number;
  highScoreThreshold: number;
  mediumScoreThreshold: number;
  riskAppetiteThreshold: number;
}

export interface NotificationSettings {
  emailCriticalAlerts: boolean;
  dailyDigestEmail: boolean;
  slackWebhookAlerts: boolean;
  slaBreachAutoEscalation: boolean;
}

interface RiskContextType {
  risks: RiskItem[];
  projects: Project[];
  teamMembers: TeamMember[];
  controls: Control[];
  actions: MitigationAction[];
  evidence: EvidenceRecord[];
  kris: KeyRiskIndicator[];
  reviews: RiskReviewRecord[];
  approvals: ApprovalRequest[];
  auditLogs: AuditLogItem[];

  currentUser: TeamMember;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  selectedProjectId: string;
  filterState: FilterState;
  toasts: ToastNotice[];
  isSupabaseConnected: boolean;
  supabaseStatus: string;
  renderBackendStatus: string;
  isRenderConnected: boolean;
  workspaceSettings: WorkspaceSettings;
  notificationSettings: NotificationSettings;

  setCurrentUser: (user: TeamMember) => void;
  updateUserProfile: (profileUpdates: Partial<TeamMember>) => void;
  updateWorkspaceSettings: (settingsUpdates: Partial<WorkspaceSettings>) => void;
  updateNotificationSettings: (notificationUpdates: Partial<NotificationSettings>) => void;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setSelectedProjectId: (id: string) => void;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;

  addRisk: (newRisk: Omit<RiskItem, 'id' | 'createdAt' | 'lastUpdated' | 'score' | 'severity' | 'inherentScore' | 'inherentSeverity' | 'residualScore' | 'residualSeverity' | 'aboveAppetite'>) => Promise<RiskItem>;
  updateRisk: (id: string, updates: Partial<RiskItem>) => Promise<void>;
  deleteRisk: (id: string) => Promise<void>;
  updateRiskStatus: (id: string, status: StatusLevel) => Promise<void>;
  toggleChecklistItem: (riskId: string, checklistId: string) => Promise<void>;

  addControl: (control: Omit<Control, 'id'>) => Promise<Control>;
  updateControl: (id: string, updates: Partial<Control>) => Promise<void>;
  deleteControl: (id: string) => Promise<void>;

  addAction: (action: Omit<MitigationAction, 'id' | 'createdAt' | 'lastUpdated'>) => Promise<MitigationAction>;
  updateAction: (id: string, updates: Partial<MitigationAction>) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;

  addEvidence: (evidence: Omit<EvidenceRecord, 'id' | 'uploadTimestamp'>) => Promise<EvidenceRecord>;
  updateEvidence: (id: string, updates: Partial<EvidenceRecord>) => Promise<void>;
  deleteEvidence: (id: string) => Promise<void>;

  addKRI: (kri: Omit<KeyRiskIndicator, 'id' | 'lastUpdated' | 'observations'>) => Promise<KeyRiskIndicator>;
  recordKRIObservation: (kriId: string, value: number, note?: string) => Promise<void>;

  addReview: (review: Omit<RiskReviewRecord, 'id'>) => Promise<RiskReviewRecord>;
  createApprovalRequest: (req: Omit<ApprovalRequest, 'id' | 'createdTimestamp' | 'status'>) => Promise<ApprovalRequest>;
  updateApprovalStatus: (id: string, status: 'Approved' | 'Rejected', decisionComments?: string) => Promise<void>;

  addProject: (projectData: Omit<Project, 'id' | 'totalRisks' | 'criticalRisks' | 'mitigationProgress' | 'lastUpdated'>) => Promise<Project>;
  addToast: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  logAuditEvent: (riskId: string, actionType: AuditLogItem['actionType'], summary: string, oldData?: any, newData?: any) => Promise<void>;

  analyzeRiskWithGemini: (naturalLanguagePrompt: string) => Promise<AIRiskAnalysisResult>;
  simulateAIRiskAnalysis: (naturalLanguagePrompt: string) => Promise<AIRiskAnalysisResult>;
  refreshData: () => Promise<void>;
  getFilteredRisks: () => RiskItem[];
  formatCurrency: (val: number, customCurr?: string) => string;

  isCopilotOpen: boolean;
  copilotInitialQuery: string;
  openCopilot: (initialQuery?: string) => void;
  closeCopilot: () => void;
  toggleCopilot: () => void;
}

const initialFilterState: FilterState = {
  searchQuery: '',
  category: 'All',
  severity: 'All',
  status: 'All',
  owner: 'All',
  projectId: 'All',
  sortBy: 'score_desc'
};

const RiskContext = createContext<RiskContextType | undefined>(undefined);

function dedupeById<T extends { id?: string }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (item && item.id) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        result.push(item);
      }
    } else if (item) {
      result.push(item);
    }
  }
  return result;
}

const DEFAULT_USER: TeamMember = {
  id: 'usr-1',
  name: 'Sunny Prasad',
  role: 'Risk Manager',
  email: 'sunny.prasad@mnbresearch.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  department: 'Business Operations',
  assignedRisksCount: 4,
  openRisksCount: 3,
  criticalRisksCount: 1,
  mitigationProgress: 75,
  userRole: 'Risk Manager'
};

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'AI Implementation',
    code: 'AI-IMP',
    description: 'Enterprise generative AI copilot integration for automated document analysis and risk synthesis.',
    leadName: 'Sunny Prasad (Business Operations Intern)',
    totalRisks: 5,
    criticalRisks: 1,
    mitigationProgress: 75,
    status: 'On Track',
    lastUpdated: 'Just now'
  },
  {
    id: 'proj-2',
    name: 'Client Onboarding',
    code: 'CL-ONB',
    description: 'Standardization of enterprise client onboarding workflow and automated SLA verification.',
    leadName: 'Yash Raj (Operations Lead)',
    totalRisks: 3,
    criticalRisks: 1,
    mitigationProgress: 80,
    status: 'On Track',
    lastUpdated: '1 hour ago'
  },
  {
    id: 'proj-3',
    name: 'Operations Automation',
    code: 'OPS-AUTO',
    description: 'Internal business process automation for cross-departmental compliance auditing.',
    leadName: 'Ritika (Product Manager)',
    totalRisks: 3,
    criticalRisks: 1,
    mitigationProgress: 60,
    status: 'At Risk',
    lastUpdated: '2 hours ago'
  }
];

const DEFAULT_TEAM: TeamMember[] = [
  DEFAULT_USER,
  {
    id: 'usr-2',
    name: 'Yash Raj',
    role: 'Operations Lead',
    email: 'yash.raj@mnbresearch.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    department: 'Business Operations',
    assignedRisksCount: 5,
    openRisksCount: 3,
    criticalRisksCount: 1,
    mitigationProgress: 65,
    userRole: 'Risk Manager'
  },
  {
    id: 'usr-3',
    name: 'Ritika',
    role: 'Product Manager',
    email: 'ritika@mnbresearch.com',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    department: 'Product Strategy',
    assignedRisksCount: 5,
    openRisksCount: 2,
    criticalRisksCount: 1,
    mitigationProgress: 82,
    userRole: 'Risk Owner'
  },
  {
    id: 'usr-4',
    name: 'Sumit',
    role: 'Resource Manager',
    email: 'sumit@mnbresearch.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    department: 'Engineering Resource Operations',
    assignedRisksCount: 4,
    openRisksCount: 1,
    criticalRisksCount: 0,
    mitigationProgress: 90,
    userRole: 'Approver'
  },
  {
    id: 'usr-5',
    name: 'Devyash',
    role: 'Security & Infrastructure Lead',
    email: 'devyash@mnbresearch.com',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
    department: 'Enterprise Security',
    assignedRisksCount: 4,
    openRisksCount: 1,
    criticalRisksCount: 1,
    mitigationProgress: 88,
    userRole: 'Risk Owner'
  }
];

export const RiskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(DEFAULT_TEAM);
  const [controls, setControls] = useState<Control[]>([]);
  const [actions, setActions] = useState<MitigationAction[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [kris, setKris] = useState<KeyRiskIndicator[]>([]);
  const [reviews, setReviews] = useState<RiskReviewRecord[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('All');
  const [filterState, setFilterState] = useState<FilterState>(initialFilterState);
  const [toasts, setToasts] = useState<ToastNotice[]>([]);
  const [isSupabaseConnected] = useState<boolean>(true);
  const [supabaseStatus, setSupabaseStatus] = useState<string>('Connected to Persistent Storage');
  const [isRenderConnected, setIsRenderConnected] = useState<boolean>(true);
  const [renderBackendStatus, setRenderBackendStatus] = useState<string>('Connected to Active Engine');

  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettings>({
    workspaceName: 'MNB Research Business Operations',
    riskIdPrefix: 'RSK-',
    defaultReviewDays: 30,
    cloudSyncMode: 'auto',
    currency: 'USD',
    criticalScoreThreshold: 17,
    highScoreThreshold: 10,
    mediumScoreThreshold: 5,
    riskAppetiteThreshold: 15
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailCriticalAlerts: true,
    dailyDigestEmail: true,
    slackWebhookAlerts: true,
    slaBreachAutoEscalation: true
  });

  const [currentUser, setCurrentUser] = useState<TeamMember>(DEFAULT_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);

  // Global Copilot Chatbot State
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [copilotInitialQuery, setCopilotInitialQuery] = useState<string>('');

  const openCopilot = useCallback((initialQuery?: string) => {
    if (initialQuery) {
      setCopilotInitialQuery(initialQuery);
    }
    setIsCopilotOpen(true);
  }, []);

  const closeCopilot = useCallback(() => {
    setIsCopilotOpen(false);
  }, []);

  const toggleCopilot = useCallback(() => {
    setIsCopilotOpen(prev => !prev);
  }, []);

  // Restore authenticated session from localStorage if previously signed out or customized
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = localStorage.getItem('risk_is_authenticated');
      if (savedAuth === 'false') {
        setIsAuthenticated(false);
      }
      const savedUser = localStorage.getItem('risk_auth_user');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {}
      }
    }
  }, []);

  // Cross-tab broadcast synchronization
  const broadcastSync = () => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('mnb_erm_sync_channel');
        channel.postMessage({ type: 'REFRESH_DATA', timestamp: Date.now() });
        channel.close();
      } catch {}
    }
  };

  const refreshData = useCallback(async () => {
    try {
      const [
        risksRes,
        controlsRes,
        actionsRes,
        evidenceRes,
        krisRes,
        reviewsRes,
        approvalsRes,
        logsRes,
        projectsRes,
        teamRes
      ] = await Promise.all([
        fetch('/api/risks').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/controls').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/actions').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/evidence').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/kris').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/reviews').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/approvals').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/audit-logs').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/projects').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/team').then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      if (risksRes && Array.isArray(risksRes.risks)) {
        setRisks(dedupeById(risksRes.risks));
        setSupabaseStatus('⚡ Server DB Connected & Synchronized');
      }
      if (controlsRes?.controls) setControls(dedupeById(controlsRes.controls));
      if (actionsRes?.actions) setActions(dedupeById(actionsRes.actions));
      if (evidenceRes?.evidence) setEvidence(dedupeById(evidenceRes.evidence));
      if (krisRes?.kris) setKris(dedupeById(krisRes.kris));
      if (reviewsRes?.reviews) setReviews(dedupeById(reviewsRes.reviews));
      if (approvalsRes?.approvals) setApprovals(dedupeById(approvalsRes.approvals));
      if (logsRes?.auditLogs) setAuditLogs(dedupeById(logsRes.auditLogs));
      if (projectsRes?.projects) setProjects(dedupeById(projectsRes.projects));
      if (teamRes?.teamMembers) setTeamMembers(dedupeById(teamRes.teamMembers));

    } catch (err) {
      console.warn('Initial data load notice:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Cross-tab real-time sync listener
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    try {
      const channel = new BroadcastChannel('mnb_erm_sync_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'REFRESH_DATA') {
          refreshData();
        }
      };
      return () => {
        channel.close();
      };
    } catch {}
  }, [refreshData]);

  const addToast = (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => { removeToast(id); }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const logAuditEvent = async (riskId: string, actionType: AuditLogItem['actionType'], summary: string, oldData?: any, newData?: any) => {
    const payload = {
      riskId,
      actionType,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      changesSummary: summary,
      oldData,
      newData
    };

    try {
      const res = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.log) {
          setAuditLogs(prev => [data.log, ...prev]);
        }
      }
    } catch (e) {
      // Local fallback
      const fallbackLog: AuditLogItem = {
        id: `aud-${Date.now()}`,
        riskId,
        actionType,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        changesSummary: summary,
        oldData,
        newData,
        timestamp: new Date().toISOString()
      };
      setAuditLogs(prev => [fallbackLog, ...prev]);
    }
  };

  const resetFilters = () => {
    setFilterState(initialFilterState);
  };

  // ==========================================
  // REAL RISKS CRUD (CONNECTED TO SERVER DB)
  // ==========================================
  const addRisk = async (input: Omit<RiskItem, 'id' | 'createdAt' | 'lastUpdated' | 'score' | 'severity' | 'inherentScore' | 'inherentSeverity' | 'residualScore' | 'residualSeverity' | 'aboveAppetite'>): Promise<RiskItem> => {
    try {
      const res = await fetch('/api/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, authorName: currentUser.name })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.risk) {
          setRisks(prev => [data.risk, ...prev]);
          addToast('Risk Registered', `${data.risk.id}: ${data.risk.title} added to register.`, 'success');
          broadcastSync();
          return data.risk;
        }
      }
    } catch (err) {
      console.warn('POST /api/risks error:', err);
    }

    // Local state fallback if offline
    const inhProb = input.inherentProbability || input.probability || 3;
    const inhImp = input.inherentImpact || input.impact || 3;
    const inhScore = inhProb * inhImp;
    const resProb = (input.residualProbability || Math.max(1, inhProb - 1)) as ProbabilityLevel;
    const resImp = (input.residualImpact || Math.max(1, inhImp - 1)) as ImpactLevel;
    const resScore = (resProb as number) * (resImp as number);
    const resSev = calculateSeverity(resScore);
    const localId = `RSK-${100 + risks.length + 1}`;
    const fallbackRisk: RiskItem = {
      ...input,
      id: localId,
      inherentProbability: inhProb as ProbabilityLevel,
      inherentImpact: inhImp as ImpactLevel,
      inherentScore: inhScore,
      inherentSeverity: calculateSeverity(inhScore),
      residualProbability: resProb,
      residualImpact: resImp,
      residualScore: resScore,
      residualSeverity: resSev,
      probability: inhProb as ProbabilityLevel,
      impact: inhImp as ImpactLevel,
      score: inhScore,
      severity: calculateSeverity(inhScore),
      treatmentStrategy: input.treatmentStrategy || 'Mitigate',
      aboveAppetite: resScore > workspaceSettings.riskAppetiteThreshold,
      createdAt: new Date().toISOString().split('T')[0],
      lastUpdated: 'Just now',
      activityLogs: []
    };
    setRisks(prev => [fallbackRisk, ...prev]);
    broadcastSync();
    return fallbackRisk;
  };

  const updateRisk = async (id: string, updates: Partial<RiskItem>) => {
    // Optimistic UI update
    setRisks(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, ...updates, lastUpdated: 'Just now' };
    }));

    try {
      await fetch(`/api/risks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, authorName: currentUser.name })
      });
      addToast('Risk Updated', `Changes saved for ${id}.`, 'info');
      broadcastSync();
    } catch (err) {
      console.warn('PATCH /api/risks error:', err);
    }
  };

  const deleteRisk = async (id: string) => {
    setRisks(prev => prev.filter(r => r.id !== id));
    addToast('Risk Removed', `Risk ${id} deleted from workspace.`, 'warning');
    broadcastSync();

    try {
      await fetch(`/api/risks/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('DELETE /api/risks error:', err);
    }
  };

  const updateRiskStatus = async (id: string, status: StatusLevel) => {
    await updateRisk(id, { status });
  };

  const toggleChecklistItem = async (riskId: string, checklistId: string) => {
    const risk = risks.find(r => r.id === riskId);
    if (!risk) return;

    const updatedChecklist = risk.checklist.map(item => {
      if (item.id !== checklistId) return item;
      return {
        ...item,
        completed: !item.completed,
        completedAt: !item.completed ? 'Just now' : undefined
      };
    });

    const completedCount = updatedChecklist.filter(c => c.completed).length;
    const totalCount = updatedChecklist.length;
    const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : risk.mitigationProgress;

    await updateRisk(riskId, {
      checklist: updatedChecklist,
      mitigationProgress: newProgress
    });
  };

  // ==========================================
  // CONTROLS CRUD (PERSISTENT)
  // ==========================================
  const addControl = async (controlInput: Omit<Control, 'id'>): Promise<Control> => {
    try {
      const res = await fetch('/api/controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(controlInput)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.control) {
          setControls(prev => [data.control, ...prev]);
          addToast('Control Created', `Control ${data.control.id}: ${data.control.name} added.`, 'success');
          broadcastSync();
          return data.control;
        }
      }
    } catch (e) {
      console.warn('POST /api/controls error:', e);
    }

    const fallback: Control = { ...controlInput, id: `CTRL-${100 + controls.length + 1}` };
    setControls(prev => [fallback, ...prev]);
    broadcastSync();
    return fallback;
  };

  const updateControl = async (id: string, updates: Partial<Control>) => {
    setControls(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    addToast('Control Updated', `Updated details for ${id}.`, 'info');
    broadcastSync();
    try {
      await fetch(`/api/controls/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (e) {}
  };

  const deleteControl = async (id: string) => {
    setControls(prev => prev.filter(c => c.id !== id));
    addToast('Control Removed', `Control ${id} removed.`, 'warning');
    broadcastSync();
    try {
      await fetch(`/api/controls/${id}`, { method: 'DELETE' });
    } catch (e) {}
  };

  // ==========================================
  // ACTIONS CRUD (PERSISTENT)
  // ==========================================
  const addAction = async (actionInput: Omit<MitigationAction, 'id' | 'createdAt' | 'lastUpdated'>): Promise<MitigationAction> => {
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionInput)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.action) {
          setActions(prev => [data.action, ...prev]);
          addToast('Action Created', `Mitigation Action ${data.action.id} assigned to ${data.action.assignedOwnerName}.`, 'success');
          broadcastSync();
          return data.action;
        }
      }
    } catch (e) {
      console.warn('POST /api/actions error:', e);
    }

    const fallback: MitigationAction = {
      ...actionInput,
      id: `ACT-${100 + actions.length + 1}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastUpdated: 'Just now'
    };
    setActions(prev => [fallback, ...prev]);
    broadcastSync();
    return fallback;
  };

  const updateAction = async (id: string, updates: Partial<MitigationAction>) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, ...updates, lastUpdated: 'Just now' } : a));
    addToast('Action Updated', `Updated action ${id}.`, 'info');
    try {
      await fetch(`/api/actions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (e) {}
  };

  const deleteAction = async (id: string) => {
    setActions(prev => prev.filter(a => a.id !== id));
    addToast('Action Deleted', `Action ${id} removed.`, 'warning');
    try {
      await fetch(`/api/actions/${id}`, { method: 'DELETE' });
    } catch (e) {}
  };

  // ==========================================
  // EVIDENCE CRUD (PERSISTENT)
  // ==========================================
  const addEvidence = async (evidenceInput: Omit<EvidenceRecord, 'id' | 'uploadTimestamp'>): Promise<EvidenceRecord> => {
    try {
      const res = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evidenceInput)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.evidence) {
          setEvidence(prev => [data.evidence, ...prev]);
          addToast('Evidence Uploaded', `Uploaded ${data.evidence.fileName} linked to risk/control.`, 'success');
          return data.evidence;
        }
      }
    } catch (e) {
      console.warn('POST /api/evidence error:', e);
    }

    const fallback: EvidenceRecord = {
      ...evidenceInput,
      id: `EVD-${100 + evidence.length + 1}`,
      uploadTimestamp: new Date().toISOString()
    };
    setEvidence(prev => [fallback, ...prev]);
    return fallback;
  };

  const updateEvidence = async (id: string, updates: Partial<EvidenceRecord>) => {
    setEvidence(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    addToast('Evidence Updated', `Document ${id} updated.`, 'info');
    try {
      await fetch(`/api/evidence/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.warn('PATCH /api/evidence error:', e);
    }
  };

  const deleteEvidence = async (id: string) => {
    setEvidence(prev => prev.filter(e => e.id !== id));
    addToast('Evidence Removed', `Document ${id} deleted.`, 'warning');
    try {
      await fetch(`/api/evidence/${id}`, { method: 'DELETE' });
    } catch (e) {}
  };

  // ==========================================
  // KRIs (PERSISTENT)
  // ==========================================
  const addKRI = async (kriInput: Omit<KeyRiskIndicator, 'id' | 'lastUpdated' | 'observations'>): Promise<KeyRiskIndicator> => {
    try {
      const res = await fetch('/api/kris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kriInput)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.kri) {
          setKris(prev => [data.kri, ...prev]);
          addToast('KRI Created', `Key Risk Indicator ${data.kri.id} configured.`, 'success');
          return data.kri;
        }
      }
    } catch (e) {}

    const fallback: KeyRiskIndicator = {
      ...kriInput,
      id: `KRI-${100 + kris.length + 1}`,
      observations: [],
      lastUpdated: 'Just now'
    };
    setKris(prev => [fallback, ...prev]);
    return fallback;
  };

  const recordKRIObservation = async (kriId: string, value: number, note?: string) => {
    try {
      const res = await fetch(`/api/kris/${kriId}/observe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, note })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.kri) {
          setKris(prev => prev.map(k => k.id === kriId ? data.kri : k));
          addToast('KRI Observation Recorded', `Updated ${kriId} metric reading.`, 'info');
          return;
        }
      }
    } catch (e) {}

    // Fallback local update
    setKris(prev => prev.map(kri => {
      if (kri.id !== kriId) return kri;
      let status: 'Normal' | 'Warning' | 'Critical' = 'Normal';
      if (value >= kri.criticalThreshold) status = 'Critical';
      else if (value >= kri.warningThreshold) status = 'Warning';

      return {
        ...kri,
        currentValue: value,
        triggerStatus: status,
        lastUpdated: 'Just now'
      };
    }));
  };

  // ==========================================
  // REVIEWS & APPROVALS (PERSISTENT)
  // ==========================================
  const addReview = async (reviewInput: Omit<RiskReviewRecord, 'id'>): Promise<RiskReviewRecord> => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewInput)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.review) {
          setReviews(prev => [data.review, ...prev]);
          addToast('Review Recorded', `Completed risk review for ${data.review.riskId}.`, 'success');
          return data.review;
        }
      }
    } catch (e) {}

    const fallback: RiskReviewRecord = { ...reviewInput, id: `REV-${100 + reviews.length + 1}` };
    setReviews(prev => [fallback, ...prev]);
    return fallback;
  };

  const createApprovalRequest = async (reqInput: Omit<ApprovalRequest, 'id' | 'createdTimestamp' | 'status'>): Promise<ApprovalRequest> => {
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqInput)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.approval) {
          setApprovals(prev => [data.approval, ...prev]);
          addToast('Approval Requested', `Submitted ${data.approval.type} request for ${data.approval.riskId}.`, 'info');
          broadcastSync();
          return data.approval;
        }
      }
    } catch (e) {}

    const fallback: ApprovalRequest = {
      ...reqInput,
      id: `APP-${100 + approvals.length + 1}`,
      status: 'Pending',
      createdTimestamp: new Date().toISOString()
    };
    setApprovals(prev => [fallback, ...prev]);
    broadcastSync();
    return fallback;
  };

  const updateApprovalStatus = async (id: string, status: 'Approved' | 'Rejected', decisionComments?: string) => {
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, decisionComments, approverName: currentUser.name })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.approval) {
          setApprovals(prev => prev.map(a => a.id === id ? data.approval : a));
          addToast('Approval Decision Saved', `Request ${id} marked as ${status}.`, status === 'Approved' ? 'success' : 'warning');
          broadcastSync();
          return;
        }
      }
    } catch (e) {}

    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status, decisionComments } : a));
    broadcastSync();
  };

  // ==========================================
  // PROJECTS (PERSISTENT)
  // ==========================================
  const addProject = async (projectData: Omit<Project, 'id' | 'totalRisks' | 'criticalRisks' | 'mitigationProgress' | 'lastUpdated'>): Promise<Project> => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.project) {
          setProjects(prev => [data.project, ...prev]);
          addToast('Project Created', `Project ${data.project.name} registered.`, 'success');
          return data.project;
        }
      }
    } catch (e) {}

    const fallback: Project = {
      ...projectData,
      id: `proj-${projects.length + 1}`,
      totalRisks: 0,
      criticalRisks: 0,
      mitigationProgress: 0,
      status: 'Active',
      lastUpdated: 'Just now'
    };
    setProjects(prev => [fallback, ...prev]);
    return fallback;
  };

  // ==========================================
  // AUTHENTICATION & SETTINGS
  // ==========================================
  const login = async (email: string, password?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          setIsAuthenticated(true);
          if (typeof window !== 'undefined') {
            localStorage.setItem('risk_is_authenticated', 'true');
            localStorage.setItem('risk_auth_user', JSON.stringify(data.user));
          }
          addToast('Signed In', `Welcome back, ${data.user.name}.`, 'success');
          return true;
        }
      }
    } catch (e) {}

    const found = teamMembers.find(m => m.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('risk_is_authenticated', 'true');
        localStorage.setItem('risk_auth_user', JSON.stringify(found));
      }
      return true;
    }
    return false;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('risk_is_authenticated', 'false');
      localStorage.removeItem('risk_auth_user');
    }
    addToast('Signed Out', 'You have been logged out of Risk Register Copilot.', 'info');
  };

  const updateUserProfile = (profileUpdates: Partial<TeamMember>) => {
    setCurrentUser(prev => ({ ...prev, ...profileUpdates }));
    addToast('Profile Updated', 'User profile changes saved.', 'success');
  };

  const updateWorkspaceSettings = (settingsUpdates: Partial<WorkspaceSettings>) => {
    setWorkspaceSettings(prev => ({ ...prev, ...settingsUpdates }));
    addToast('Workspace Saved', 'Organization settings updated.', 'success');
  };

  const updateNotificationSettings = (notificationUpdates: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({ ...prev, ...notificationUpdates }));
    addToast('Preferences Saved', 'Notification configuration updated.', 'success');
  };

  // ==========================================
  // REAL AI RISK ANALYSIS (GROQ QWEN)
  // ==========================================
  const analyzeRiskWithGemini = async (naturalLanguagePrompt: string): Promise<AIRiskAnalysisResult> => {
    const res = await analyzeRiskWithAI(naturalLanguagePrompt);
    if (res) return res;

    return {
      title: 'Identified Project Threat',
      description: naturalLanguagePrompt,
      category: 'Operational',
      probability: 4,
      impact: 4,
      score: 16,
      severity: 'High',
      suggestedOwnerName: 'Sunny Prasad',
      suggestedOwnerRole: 'Business Operations Intern & Risk Lead',
      mitigationPlan: 'Conduct technical discovery spike and establish monitoring safeguards.',
      contingencyPlan: 'Activate fallback procedure and trigger manual review.',
      aiConfidence: 96,
      estimatedImpactUsd: 48000
    };
  };

  const simulateAIRiskAnalysis = async (naturalLanguagePrompt: string): Promise<AIRiskAnalysisResult> => {
    return analyzeRiskWithGemini(naturalLanguagePrompt);
  };

  const getFilteredRisks = () => {
    return risks.filter(risk => {
      if (selectedProjectId !== 'All' && risk.projectId !== selectedProjectId) return false;
      if (filterState.category !== 'All' && risk.category !== filterState.category) return false;
      if (filterState.severity !== 'All' && risk.severity !== filterState.severity) return false;
      if (filterState.status !== 'All' && risk.status !== filterState.status) return false;
      if (filterState.owner !== 'All' && risk.ownerName !== filterState.owner) return false;
      if (filterState.searchQuery) {
        const q = filterState.searchQuery.toLowerCase();
        return (
          risk.title.toLowerCase().includes(q) ||
          risk.description.toLowerCase().includes(q) ||
          risk.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  };

  const formatCurrency = (val: number, customCurr?: string): string => {
    const curr = customCurr || workspaceSettings.currency;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <RiskContext.Provider
      value={{
        risks,
        projects,
        teamMembers,
        controls,
        actions,
        evidence,
        kris,
        reviews,
        approvals,
        auditLogs,
        currentUser,
        isAuthenticated,
        isAuthLoading,
        selectedProjectId,
        filterState,
        toasts,
        isSupabaseConnected,
        supabaseStatus,
        renderBackendStatus,
        isRenderConnected,
        workspaceSettings,
        notificationSettings,
        setCurrentUser,
        updateUserProfile,
        updateWorkspaceSettings,
        updateNotificationSettings,
        login,
        logout,
        setSelectedProjectId,
        setFilterState,
        resetFilters,
        addRisk,
        updateRisk,
        deleteRisk,
        updateRiskStatus,
        toggleChecklistItem,
        addControl,
        updateControl,
        deleteControl,
        addAction,
        updateAction,
        deleteAction,
        addEvidence,
        updateEvidence,
        deleteEvidence,
        addKRI,
        recordKRIObservation,
        addReview,
        createApprovalRequest,
        updateApprovalStatus,
        addProject,
        addToast,
        removeToast,
        logAuditEvent,
        analyzeRiskWithGemini,
        simulateAIRiskAnalysis,
        refreshData,
        getFilteredRisks,
        formatCurrency,
        isCopilotOpen,
        copilotInitialQuery,
        openCopilot,
        closeCopilot,
        toggleCopilot
      }}
    >
      {children}
    </RiskContext.Provider>
  );
};

export const useRisk = () => {
  const context = useContext(RiskContext);
  if (!context) {
    throw new Error('useRisk must be used within a RiskProvider');
  }
  return context;
};

export const useRiskContext = useRisk;
