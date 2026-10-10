import fs from 'fs';
import path from 'path';
import { 
  RiskItem, 
  Project, 
  TeamMember, 
  Control, 
  MitigationAction, 
  EvidenceRecord, 
  KeyRiskIndicator, 
  RiskReviewRecord, 
  ApprovalRequest, 
  AuditLogItem,
  SeverityLevel,
  ProbabilityLevel,
  ImpactLevel
} from '../../types/risk';
import {
  MOCK_RISKS,
  MOCK_PROJECTS,
  MOCK_TEAM_MEMBERS,
  MOCK_CONTROLS,
  MOCK_MITIGATION_ACTIONS,
  MOCK_EVIDENCE_RECORDS,
  MOCK_KRIS,
  MOCK_REVIEWS,
  MOCK_APPROVALS,
  MOCK_AUDIT_LOGS,
  calculateSeverity
} from '../../data/mockData';
import { getSupabaseServerClient } from '../supabase/server';

export async function syncRiskToSupabase(risk: RiskItem): Promise<boolean> {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) return false;
    const { error } = await supabase.from('risks').upsert({
      id: risk.id,
      title: risk.title,
      description: risk.description || risk.title,
      category: risk.category || 'Technical',
      probability: risk.probability || 3,
      impact: risk.impact || 3,
      score: risk.score || 9,
      severity: risk.severity || 'Medium',
      status: risk.status || 'Open',
      project_id: risk.projectId || 'proj-1',
      project_name: risk.projectName || 'Enterprise Operations',
      owner_id: risk.ownerId || 'usr-1',
      owner_name: risk.ownerName || 'Sunny Prasad',
      owner_role: risk.ownerRole || 'Business Operations Intern & Risk Lead',
      mitigation_plan: risk.mitigationPlan || '',
      contingency_plan: risk.contingencyPlan || '',
      mitigation_progress: risk.mitigationProgress || 0,
      due_date: risk.dueDate || new Date().toISOString().split('T')[0],
      checklist: Array.isArray(risk.checklist) ? risk.checklist : [],
      activity_logs: Array.isArray(risk.activityLogs) ? risk.activityLogs : [],
      estimated_impact_usd: risk.estimatedImpactUsd || (risk.score * 2500),
      last_updated: risk.lastUpdated || 'Just now'
    });
    if (error) {
      console.warn('[Supabase Sync Warning]:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase Sync Exception]:', err?.message || err);
    return false;
  }
}

export async function deleteRiskFromSupabase(id: string): Promise<boolean> {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) return false;
    const { error } = await supabase.from('risks').delete().eq('id', id);
    if (error) {
      console.warn('[Supabase Delete Warning]:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase Delete Exception]:', err?.message || err);
    return false;
  }
}

export async function syncFromSupabase(): Promise<boolean> {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) return false;

    // 1. Sync risks from Supabase
    const { data: riskData, error: riskError } = await supabase.from('risks').select('*');
    if (riskError) {
      console.warn('[Server DB] Supabase risks query note:', riskError.message);
    }

    // 2. Sync projects from Supabase
    const { data: projectData, error: projectError } = await supabase.from('projects').select('*');
    if (projectError) {
      console.warn('[Server DB] Supabase projects query note:', projectError.message);
    }

    // 3. Sync team_members from Supabase
    const { data: memberData, error: memberError } = await supabase.from('team_members').select('*');
    if (memberError) {
      console.warn('[Server DB] Supabase team_members query note:', memberError.message);
    }

    const db = getDatabase();

    if (riskData && Array.isArray(riskData) && riskData.length > 0) {
      const mappedRisks: RiskItem[] = riskData.map((row: any) => {
        const prob = (row.probability || 3) as ProbabilityLevel;
        const imp = (row.impact || 3) as ImpactLevel;
        const score = (row.score || prob * imp);
        const sev = (row.severity || calculateSeverity(score)) as SeverityLevel;
        
        const resProb = Math.max(1, prob - (row.mitigation_progress >= 50 ? 2 : row.mitigation_progress >= 20 ? 1 : 0)) as ProbabilityLevel;
        const resImp = Math.max(1, imp - (row.mitigation_progress >= 70 ? 1 : 0)) as ImpactLevel;
        const resScore = resProb * resImp;

        return {
          id: row.id,
          title: row.title,
          description: row.description || '',
          category: row.category || 'Operational',
          subcategory: row.subcategory || '',
          department: row.department || 'MNB Research · Business Operations',
          affectedProcess: row.affected_process || '',
          probability: prob,
          impact: imp,
          score,
          severity: sev,
          inherentProbability: prob,
          inherentImpact: imp,
          inherentScore: score,
          inherentSeverity: sev,
          residualProbability: resProb,
          residualImpact: resImp,
          residualScore: resScore,
          residualSeverity: calculateSeverity(resScore),
          status: row.status || 'Open',
          projectId: row.project_id || 'proj-1',
          projectName: row.project_name || 'Enterprise Operations',
          ownerId: row.owner_id || 'usr-1',
          ownerName: row.owner_name || 'Sunny Prasad',
          ownerRole: row.owner_role || 'Business Operations Intern & Risk Lead',
          ownerAvatar: row.owner_avatar,
          coOwnerName: row.co_owner_name,
          coOwnerRole: row.co_owner_role,
          mitigationPlan: row.mitigation_plan || '',
          contingencyPlan: row.contingency_plan || '',
          mitigationProgress: row.mitigation_progress || 0,
          dueDate: row.due_date || new Date().toISOString().split('T')[0],
          checklist: Array.isArray(row.checklist) ? row.checklist : [],
          activityLogs: Array.isArray(row.activity_logs) ? row.activity_logs : [],
          aiSuggested: !!row.ai_suggested,
          aiConfidence: row.ai_confidence || 90,
          estimatedImpactUsd: row.estimated_impact_usd || (score * 2500),
          lastUpdated: row.last_updated || 'Just now',
          createdAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          aboveAppetite: resScore > (db.settings.riskAppetiteThreshold || 15)
        };
      });
      db.risks = mappedRisks;
    }

    if (projectData && Array.isArray(projectData) && projectData.length > 0) {
      db.projects = projectData.map((row: any) => ({
        id: row.id,
        name: row.name,
        code: row.code || row.id,
        description: row.description || '',
        status: row.status || 'Active',
        leadName: row.lead_name || 'Sunny Prasad (Business Operations Intern)',
        totalRisks: db.risks.filter(r => r.projectId === row.id).length,
        criticalRisks: db.risks.filter(r => r.projectId === row.id && r.severity === 'Critical').length,
        mitigationProgress: row.mitigation_progress || 0,
        lastUpdated: row.last_updated || 'Just now'
      }));
    }

    if (memberData && Array.isArray(memberData) && memberData.length > 0) {
      db.teamMembers = memberData.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email || '',
        role: row.role || 'Risk Assessor',
        avatar: row.avatar || '',
        department: row.department || 'MNB Research · Business Operations',
        assignedRisksCount: db.risks.filter(r => r.ownerId === row.id).length,
        openRisksCount: db.risks.filter(r => r.ownerId === row.id && r.status === 'Open').length,
        criticalRisksCount: db.risks.filter(r => r.ownerId === row.id && r.severity === 'Critical').length,
        mitigationProgress: row.mitigation_progress || 0
      }));
    }

    saveDatabase(db);
    return true;
  } catch (err) {
    console.warn('[Server DB] syncFromSupabase note:', err);
    return false;
  }
}

export interface EnterpriseDatabase {
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
  settings: {
    workspaceName: string;
    riskIdPrefix: string;
    defaultReviewDays: number;
    currency: string;
    criticalScoreThreshold: number;
    highScoreThreshold: number;
    mediumScoreThreshold: number;
    riskAppetiteThreshold: number;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = process.env.NODE_ENV === 'test'
  ? path.join(DATA_DIR, 'enterprise_risk_register_test.json')
  : path.join(DATA_DIR, 'enterprise_risk_register.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getInitialDatabase(): EnterpriseDatabase {
  const isTest = process.env.NODE_ENV === 'test';
  return {
    risks: isTest ? MOCK_RISKS : [],
    projects: isTest ? MOCK_PROJECTS : [],
    teamMembers: isTest ? MOCK_TEAM_MEMBERS : [],
    controls: isTest ? MOCK_CONTROLS : [],
    actions: isTest ? MOCK_MITIGATION_ACTIONS : [],
    evidence: isTest ? MOCK_EVIDENCE_RECORDS : [],
    kris: isTest ? MOCK_KRIS : [],
    reviews: isTest ? MOCK_REVIEWS : [],
    approvals: isTest ? MOCK_APPROVALS : [],
    auditLogs: isTest ? MOCK_AUDIT_LOGS : [],
    settings: {
      workspaceName: 'MNB Research Business Operations',
      riskIdPrefix: 'RSK-',
      defaultReviewDays: 30,
      currency: 'USD',
      criticalScoreThreshold: 17,
      highScoreThreshold: 10,
      mediumScoreThreshold: 5,
      riskAppetiteThreshold: 15
    }
  };
}

let memoryDb: EnterpriseDatabase | null = null;
let lastDbMtime = 0;

export function getDatabase(): EnterpriseDatabase {
  ensureDataDir();

  if (fs.existsSync(DB_FILE)) {
    try {
      const current = memoryDb;
      const stat = fs.statSync(DB_FILE);
      if (current && stat.mtimeMs <= lastDbMtime) {
        return current;
      }
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.risks)) {
        memoryDb = parsed;
        lastDbMtime = stat.mtimeMs;
        return parsed as EnterpriseDatabase;
      }
    } catch (err) {
      console.warn('[Server DB] Corrupt or unreadable database file:', err);
    }
  }

  const existing = memoryDb;
  if (existing) {
    return existing;
  }

  // Initialize and write to disk
  memoryDb = getInitialDatabase();
  saveDatabase(memoryDb);
  return memoryDb;
}

export function saveDatabase(db: EnterpriseDatabase): void {
  ensureDataDir();
  memoryDb = db;
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf8');
    try {
      fs.renameSync(tempFile, DB_FILE);
    } catch {
      // Fallback for Windows file locking
      fs.copyFileSync(tempFile, DB_FILE);
      try { fs.unlinkSync(tempFile); } catch {}
    }
  } catch (err) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    } catch (directErr) {
      console.error('[Server DB] Failed to save database to disk:', directErr);
    }
  }
}

// ==========================================
// RISKS CRUD
// ==========================================
export function getRisks(): RiskItem[] {
  return getDatabase().risks;
}

export function getRiskById(id: string): RiskItem | undefined {
  return getDatabase().risks.find(r => r.id.toLowerCase() === id.toLowerCase());
}

export function createRisk(input: any): RiskItem {
  const db = getDatabase();
  const nextNum = 100 + db.risks.length + Math.floor(Math.random() * 100);
  const id = input.id || `RSK-${nextNum}`;

  const inhProb = input.inherentProbability || input.probability || 3;
  const inhImp = input.inherentImpact || input.impact || 3;
  const inhScore = inhProb * inhImp;
  const inhSev: SeverityLevel = calculateSeverity(inhScore);

  const resProb = input.residualProbability || Math.max(1, inhProb - 1);
  const resImp = input.residualImpact || Math.max(1, inhImp - 1);
  const resScore = resProb * resImp;
  const resSev: SeverityLevel = calculateSeverity(resScore);

  const now = new Date().toISOString().split('T')[0];

  const newRisk: RiskItem = {
    id,
    title: input.title,
    description: input.description || '',
    category: input.category || 'Operational',
    subcategory: input.subcategory || '',
    department: input.department || 'MNB Research · Business Operations',
    affectedProcess: input.affectedProcess || '',

    inherentProbability: inhProb,
    inherentImpact: inhImp,
    inherentScore: inhScore,
    inherentSeverity: inhSev,

    residualProbability: resProb,
    residualImpact: resImp,
    residualScore: resScore,
    residualSeverity: resSev,

    probability: inhProb,
    impact: inhImp,
    score: inhScore,
    severity: inhSev,

    lifecycleStage: input.lifecycleStage || 'Assess',
    treatmentStrategy: input.treatmentStrategy || 'Mitigate',
    aboveAppetite: resScore > (db.settings.riskAppetiteThreshold || 15),
    acceptanceStatus: input.acceptanceStatus || 'None',
    reviewFrequency: input.reviewFrequency || 'Monthly',
    nextReviewDate: input.nextReviewDate || now,

    status: input.status || 'Open',
    projectId: input.projectId || 'proj-1',
    projectName: input.projectName || 'Enterprise Operations',
    ownerId: input.ownerId || 'usr-1',
    ownerName: input.ownerName || 'Sunny Prasad',
    ownerRole: input.ownerRole || 'Business Operations Intern & Risk Lead',
    ownerAvatar: input.ownerAvatar,
    coOwnerName: input.coOwnerName,
    coOwnerRole: input.coOwnerRole,

    mitigationPlan: input.mitigationPlan || 'Conduct technical discovery and configure monitoring safeguards.',
    contingencyPlan: input.contingencyPlan || 'Activate fallback contingency window and execute manual review.',
    mitigationProgress: Number(input.mitigationProgress) || 0,
    dueDate: input.dueDate || now,

    checklist: input.checklist || [],
    activityLogs: [
      {
        id: `act-${Date.now()}`,
        timestamp: 'Just now',
        author: input.authorName || 'Sunny Prasad',
        action: `Created new risk record. Inherent score: ${inhScore}, Residual score: ${resScore}.`,
        type: 'creation'
      },
      ...(input.activityLogs || [])
    ],
    linkedControlIds: input.linkedControlIds || [],
    linkedActionIds: input.linkedActionIds || [],
    linkedEvidenceIds: input.linkedEvidenceIds || [],
    aiSuggested: !!input.aiSuggested,
    aiConfidence: input.aiConfidence || 95,
    estimatedImpactUsd: Number(input.estimatedImpactUsd) || inhScore * 3000,
    lastUpdated: 'Just now',
    createdAt: now
  };

  db.risks.unshift(newRisk);
  
  logAuditEvent({
    riskId: newRisk.id,
    actionType: 'INSERT',
    actorName: input.authorName || 'Sunny Prasad',
    actorRole: 'Business Operations Intern & Risk Lead',
    changesSummary: `Registered risk ${newRisk.id}: "${newRisk.title}" (Score: ${inhScore}/25).`,
    newData: newRisk
  });

  saveDatabase(db);
  syncRiskToSupabase(newRisk);
  return newRisk;
}

export function updateRisk(id: string, updates: Partial<RiskItem>, authorName?: string): RiskItem | null {
  const db = getDatabase();
  const index = db.risks.findIndex(r => r.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return null;

  const oldRisk = db.risks[index];
  
  let inhProb = (updates.inherentProbability ?? updates.probability ?? oldRisk.inherentProbability ?? oldRisk.probability ?? 3) as ProbabilityLevel;
  let inhImp = (updates.inherentImpact ?? updates.impact ?? oldRisk.inherentImpact ?? oldRisk.impact ?? 3) as ImpactLevel;
  let inhScore = inhProb * inhImp;
  let inhSev = calculateSeverity(inhScore);

  let resProb = (updates.residualProbability ?? oldRisk.residualProbability ?? Math.max(1, inhProb - 1)) as ProbabilityLevel;
  let resImp = (updates.residualImpact ?? oldRisk.residualImpact ?? Math.max(1, inhImp - 1)) as ImpactLevel;
  let resScore = resProb * resImp;
  let resSev = calculateSeverity(resScore);

  const updatedRisk: RiskItem = {
    ...oldRisk,
    ...updates,
    id: oldRisk.id,
    inherentProbability: inhProb,
    inherentImpact: inhImp,
    inherentScore: inhScore,
    inherentSeverity: inhSev,
    residualProbability: resProb,
    residualImpact: resImp,
    residualScore: resScore,
    residualSeverity: resSev,
    probability: inhProb,
    impact: inhImp,
    score: inhScore,
    severity: inhSev,
    aboveAppetite: resScore > (db.settings.riskAppetiteThreshold || 15),
    lastUpdated: 'Just now'
  };

  db.risks[index] = updatedRisk;

  logAuditEvent({
    riskId: id,
    actionType: 'UPDATE',
    actorName: authorName || 'Sunny Prasad',
    actorRole: 'Business Operations Intern & Risk Lead',
    changesSummary: `Updated risk ${id} parameters. Status: ${updatedRisk.status}, Score: ${updatedRisk.score}/25.`,
    oldData: oldRisk,
    newData: updatedRisk
  });

  saveDatabase(db);
  syncRiskToSupabase(updatedRisk);
  return updatedRisk;
}

export function deleteRisk(id: string, authorName?: string): boolean {
  const db = getDatabase();
  const index = db.risks.findIndex(r => r.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return false;

  const deleted = db.risks.splice(index, 1)[0];

  logAuditEvent({
    riskId: id,
    actionType: 'DELETE',
    actorName: authorName || 'Sunny Prasad',
    actorRole: 'Business Operations Intern & Risk Lead',
    changesSummary: `Archived/Deleted risk ${id}: "${deleted.title}".`,
    oldData: deleted
  });

  saveDatabase(db);
  deleteRiskFromSupabase(id);
  return true;
}

// ==========================================
// CONTROLS CRUD
// ==========================================
export function getControls(): Control[] {
  return getDatabase().controls;
}

export function createControl(input: Omit<Control, 'id'>): Control {
  const db = getDatabase();
  const id = `CTRL-${100 + db.controls.length + 1}`;
  const newControl: Control = { ...input, id };
  db.controls.unshift(newControl);

  logAuditEvent({
    riskId: input.linkedRiskIds?.[0] || 'SYSTEM',
    actionType: 'INSERT',
    actorName: input.ownerName || 'Sunny Prasad',
    actorRole: input.ownerRole || 'Risk Owner',
    changesSummary: `Created Control ${id}: "${input.name}" (${input.type} - ${input.effectiveness}).`,
    newData: newControl
  });

  saveDatabase(db);
  return newControl;
}

export function updateControl(id: string, updates: Partial<Control>): Control | null {
  const db = getDatabase();
  const index = db.controls.findIndex(c => c.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return null;

  db.controls[index] = { ...db.controls[index], ...updates };
  saveDatabase(db);
  return db.controls[index];
}

export function deleteControl(id: string): boolean {
  const db = getDatabase();
  const index = db.controls.findIndex(c => c.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return false;

  db.controls.splice(index, 1);
  saveDatabase(db);
  return true;
}

// ==========================================
// MITIGATION ACTIONS CRUD
// ==========================================
export function getActions(): MitigationAction[] {
  return getDatabase().actions;
}

export function createAction(input: Omit<MitigationAction, 'id' | 'createdAt' | 'lastUpdated'>): MitigationAction {
  const db = getDatabase();
  const id = `ACT-${100 + db.actions.length + 1}`;
  const now = new Date().toISOString().split('T')[0];
  const newAction: MitigationAction = {
    ...input,
    id,
    createdAt: now,
    lastUpdated: 'Just now'
  };

  db.actions.unshift(newAction);

  logAuditEvent({
    riskId: input.riskId || 'SYSTEM',
    actionType: 'INSERT',
    actorName: input.assignedOwnerName || 'Sunny Prasad',
    actorRole: input.assignedOwnerRole || 'Risk Lead',
    changesSummary: `Created Mitigation Action ${id}: "${input.title}".`,
    newData: newAction
  });

  saveDatabase(db);
  return newAction;
}

export function updateAction(id: string, updates: Partial<MitigationAction>): MitigationAction | null {
  const db = getDatabase();
  const index = db.actions.findIndex(a => a.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return null;

  db.actions[index] = { ...db.actions[index], ...updates, lastUpdated: 'Just now' };
  saveDatabase(db);
  return db.actions[index];
}

export function deleteAction(id: string): boolean {
  const db = getDatabase();
  const index = db.actions.findIndex(a => a.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return false;

  db.actions.splice(index, 1);
  saveDatabase(db);
  return true;
}

// ==========================================
// EVIDENCE CRUD
// ==========================================
export function getEvidence(): EvidenceRecord[] {
  return getDatabase().evidence;
}

export function createEvidence(input: Omit<EvidenceRecord, 'id' | 'uploadTimestamp'>): EvidenceRecord {
  const db = getDatabase();
  const id = `EVD-${100 + db.evidence.length + 1}`;
  const newEvidence: EvidenceRecord = {
    ...input,
    id,
    uploadTimestamp: new Date().toISOString()
  };

  db.evidence.unshift(newEvidence);

  logAuditEvent({
    riskId: input.linkedRiskId || 'SYSTEM',
    actionType: 'INSERT',
    actorName: input.uploadedBy || 'Sunny Prasad',
    actorRole: 'Risk Lead',
    changesSummary: `Uploaded Audit Evidence ${id}: "${input.fileName}" (${input.verificationStatus}).`,
    newData: newEvidence
  });

  saveDatabase(db);
  return newEvidence;
}

export function updateEvidence(id: string, updates: Partial<EvidenceRecord>): EvidenceRecord | null {
  const db = getDatabase();
  const index = db.evidence.findIndex(e => e.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return null;

  db.evidence[index] = {
    ...db.evidence[index],
    ...updates
  };

  logAuditEvent({
    riskId: db.evidence[index].linkedRiskId || 'SYSTEM',
    actionType: 'UPDATE',
    actorName: updates.verifierName || 'Auditor',
    actorRole: 'Compliance Lead',
    changesSummary: `Updated Evidence ${id}: ${Object.keys(updates).join(', ')}`,
    newData: db.evidence[index]
  });

  saveDatabase(db);
  return db.evidence[index];
}

export function deleteEvidence(id: string): boolean {
  const db = getDatabase();
  const index = db.evidence.findIndex(e => e.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return false;

  db.evidence.splice(index, 1);
  saveDatabase(db);
  return true;
}

// ==========================================
// KEY RISK INDICATORS (KRIs)
// ==========================================
export function getKRIs(): KeyRiskIndicator[] {
  return getDatabase().kris;
}

export function createKRI(input: Omit<KeyRiskIndicator, 'id' | 'lastUpdated' | 'observations'>): KeyRiskIndicator {
  const db = getDatabase();
  const id = `KRI-${100 + db.kris.length + 1}`;
  const newKRI: KeyRiskIndicator = {
    ...input,
    id,
    observations: [{
      id: `obs-${Date.now()}`,
      timestamp: new Date().toISOString(),
      value: input.currentValue,
      recordedBy: 'Sunny Prasad',
      note: 'Initial baseline observation'
    }],
    lastUpdated: 'Just now'
  };

  db.kris.unshift(newKRI);
  saveDatabase(db);
  return newKRI;
}

export function recordKRIObservation(id: string, value: number, note?: string): KeyRiskIndicator | null {
  const db = getDatabase();
  const index = db.kris.findIndex(k => k.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return null;

  const kri = db.kris[index];
  let triggerStatus: 'Normal' | 'Warning' | 'Critical' = 'Normal';
  if (value >= kri.criticalThreshold) {
    triggerStatus = 'Critical';
  } else if (value >= kri.warningThreshold) {
    triggerStatus = 'Warning';
  }

  kri.currentValue = value;
  kri.triggerStatus = triggerStatus;
  kri.lastUpdated = 'Just now';
  kri.observations.unshift({
    id: `obs-${Date.now()}`,
    timestamp: new Date().toISOString(),
    value,
    recordedBy: 'Sunny Prasad',
    note: note || 'Manual telemetry observation entry'
  });

  logAuditEvent({
    riskId: kri.linkedRiskId || 'SYSTEM',
    actionType: 'UPDATE',
    actorName: 'Sunny Prasad',
    actorRole: 'Risk Lead',
    changesSummary: `Recorded KRI reading for ${kri.name}: ${value} ${kri.measurementUnit} (${triggerStatus}).`
  });

  saveDatabase(db);
  return kri;
}

// ==========================================
// RISK REVIEWS & APPROVALS
// ==========================================
export function getReviews(): RiskReviewRecord[] {
  return getDatabase().reviews;
}

export function createReview(input: Omit<RiskReviewRecord, 'id'>): RiskReviewRecord {
  const db = getDatabase();
  const id = `REV-${100 + db.reviews.length + 1}`;
  const newReview: RiskReviewRecord = { ...input, id };
  db.reviews.unshift(newReview);

  logAuditEvent({
    riskId: input.riskId,
    actionType: 'UPDATE',
    actorName: input.reviewerName,
    actorRole: input.reviewerRole,
    changesSummary: `Conducted Formal Risk Review ${id} (${input.status}).`
  });

  saveDatabase(db);
  return newReview;
}

export function getApprovals(): ApprovalRequest[] {
  return getDatabase().approvals;
}

export function createApproval(input: Omit<ApprovalRequest, 'id' | 'createdTimestamp' | 'status'>): ApprovalRequest {
  const db = getDatabase();
  const id = `APP-${100 + db.approvals.length + 1}`;
  const newApproval: ApprovalRequest = {
    ...input,
    id,
    createdTimestamp: new Date().toISOString(),
    status: 'Pending'
  };

  db.approvals.unshift(newApproval);

  logAuditEvent({
    riskId: input.riskId,
    actionType: 'INSERT',
    actorName: input.requestedBy,
    actorRole: 'Risk Owner',
    changesSummary: `Submitted Approval Request ${id} for ${input.riskId}.`
  });

  saveDatabase(db);
  return newApproval;
}

export function updateApproval(id: string, status: 'Approved' | 'Rejected', decisionComments?: string, approverName?: string): ApprovalRequest | null {
  const db = getDatabase();
  const index = db.approvals.findIndex(a => a.id.toLowerCase() === id.toLowerCase());
  if (index === -1) return null;

  const approval = db.approvals[index];
  approval.status = status;
  approval.decisionComments = decisionComments;
  approval.decidedTimestamp = new Date().toISOString();
  if (approverName) {
    approval.approverName = approverName;
  }

  logAuditEvent({
    riskId: approval.riskId,
    actionType: 'APPROVAL',
    actorName: approval.approverName,
    actorRole: 'Governance Approver',
    changesSummary: `Governance Approval Decision: ${status} for ${approval.riskId}. Comments: "${decisionComments || 'Approved by governance'}".`
  });

  saveDatabase(db);
  return approval;
}

// ==========================================
// AUDIT LOGS
// ==========================================
export function getAuditLogs(): AuditLogItem[] {
  return getDatabase().auditLogs;
}

export function logAuditEvent(params: {
  riskId: string;
  actionType: AuditLogItem['actionType'];
  actorName: string;
  actorRole: string;
  changesSummary: string;
  oldData?: any;
  newData?: any;
}): AuditLogItem {
  const db = getDatabase();
  const id = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const log: AuditLogItem = {
    id,
    riskId: params.riskId,
    actionType: params.actionType,
    actorName: params.actorName,
    actorRole: params.actorRole,
    changesSummary: params.changesSummary,
    oldData: params.oldData,
    newData: params.newData,
    timestamp: new Date().toISOString()
  };

  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
  saveDatabase(db);
  return log;
}

// ==========================================
// PROJECTS & TEAM MEMBERS
// ==========================================
export function getProjects(): Project[] {
  return getDatabase().projects;
}

export function createProject(input: Omit<Project, 'id' | 'totalRisks' | 'criticalRisks' | 'mitigationProgress' | 'lastUpdated'>): Project {
  const db = getDatabase();
  const id = `proj-${db.projects.length + 1}`;
  const newProject: Project = {
    ...input,
    id,
    totalRisks: 0,
    criticalRisks: 0,
    mitigationProgress: 0,
    status: 'Active',
    lastUpdated: 'Just now'
  };
  db.projects.push(newProject);
  saveDatabase(db);
  return newProject;
}

export function getTeamMembers(): TeamMember[] {
  return getDatabase().teamMembers;
}

export function updateTeamMember(id: string, updates: Partial<TeamMember>): TeamMember | null {
  const db = getDatabase();
  const index = db.teamMembers.findIndex(m => m.id.toLowerCase() === id.toLowerCase() || m.email.toLowerCase() === id.toLowerCase());
  if (index === -1) return null;

  db.teamMembers[index] = { ...db.teamMembers[index], ...updates };
  saveDatabase(db);
  return db.teamMembers[index];
}

// ==========================================
// DASHBOARD AGGREGATED STATS
// ==========================================
export function getDashboardStats() {
  const db = getDatabase();
  const risks = db.risks;
  const totalRisks = risks.length;
  const criticalRisks = risks.filter(r => r.severity === 'Critical');
  const highRisks = risks.filter(r => r.severity === 'High');
  const mediumRisks = risks.filter(r => r.severity === 'Medium');
  const lowRisks = risks.filter(r => r.severity === 'Low');
  const openRisks = risks.filter(r => r.status === 'Open');
  const mitigatedRisks = risks.filter(r => r.status === 'Mitigated' || r.status === 'Closed');
  const aboveAppetiteRisks = risks.filter(r => r.aboveAppetite || r.score > (db.settings.riskAppetiteThreshold || 15));

  const totalExposureUsd = risks.reduce(
    (acc, r) => acc + (r.estimatedImpactUsd || (r.score * 3000)),
    0
  );

  const avgMitigationProgress = totalRisks > 0
    ? Math.round(risks.reduce((acc, r) => acc + (r.mitigationProgress || 0), 0) / totalRisks)
    : 0;

  // 5x5 Heatmap Distribution Matrix
  const heatmap: number[][] = Array(5).fill(0).map(() => Array(5).fill(0));
  risks.forEach(r => {
    const p = Math.min(5, Math.max(1, r.probability || 1)) - 1;
    const i = Math.min(5, Math.max(1, r.impact || 1)) - 1;
    heatmap[p][i]++;
  });

  const now = new Date();
  const overdueActions = db.actions.filter(a => {
    if (a.status === 'Completed') return false;
    if (!a.dueDate) return false;
    return new Date(a.dueDate) < now;
  }).length;

  return {
    totalRisks,
    criticalCount: criticalRisks.length,
    highCount: highRisks.length,
    mediumCount: mediumRisks.length,
    lowCount: lowRisks.length,
    openCount: openRisks.length,
    mitigatedCount: mitigatedRisks.length,
    aboveAppetiteCount: aboveAppetiteRisks.length,
    totalExposureUsd,
    avgMitigationProgress,
    heatmap,
    totalControls: db.controls.length,
    totalActions: db.actions.length,
    openActions: db.actions.filter(a => a.status !== 'Completed').length,
    overdueActions,
    totalEvidence: db.evidence.length,
    pendingApprovals: db.approvals.filter(a => a.status === 'Pending').length,
    breachedKris: db.kris.filter(k => k.triggerStatus === 'Critical').length
  };
}
