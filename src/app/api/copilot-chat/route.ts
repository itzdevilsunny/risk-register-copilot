import { NextResponse } from 'next/server';
import { callGroqAI } from '@/lib/groq';
import { callGeminiAI } from '@/lib/gemini';
import { getRisks, getControls, getActions, getKRIs, getApprovals, getTeamMembers } from '@/lib/server/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let {
      userQuery = '',
      risks = [],
      controls = [],
      actions = [],
      evidence = [],
      approvals = [],
      kris = [],
      teamMembers = [],
      currentUser,
      imageBase64,
      imageMimeType,
      activeRiskId,
      activePath
    } = body;

    // Fallback to persistent database records if not supplied in payload
    if (!risks || risks.length === 0) risks = getRisks();
    if (!controls || controls.length === 0) controls = getControls();
    if (!actions || actions.length === 0) actions = getActions();
    if (!kris || kris.length === 0) kris = getKRIs();
    if (!approvals || approvals.length === 0) approvals = getApprovals();
    if (!teamMembers || teamMembers.length === 0) teamMembers = getTeamMembers();

    const totalRisks = risks.length;
    const criticalRisks = risks.filter((r: any) => r.severity === 'Critical');
    const highRisks = risks.filter((r: any) => r.severity === 'High');
    const totalExposureUsd = risks.reduce(
      (acc: number, r: any) => acc + (r.estimatedImpactUsd || r.score * 2500),
      0
    );

    // Standard MNB Research Team Members
    const defaultTeam = [
      { name: 'Sunny Prasad', role: 'Business Operations Intern & Risk Lead', focus: 'Operational Risk, Register Operations, DB & Infrastructure' },
      { name: 'Yash Raj', role: 'Operations Lead & Governance Officer', focus: 'Operational Resilience, Incident Response, Executive Escalations' },
      { name: 'Ritika', role: 'Product Manager & Strategic Execution Lead', focus: 'Product Delivery, Roadmap Dependencies, Feature Release Gates' },
      { name: 'Sumit', role: 'Resource Manager & Workforce Allocation', focus: 'Team Bandwidth, Vendor Budgets, Capacity Constraints' },
      { name: 'Priya Sharma', role: 'Compliance, Regulatory & Audit Lead', focus: 'ISO 31000, SOC2 Type II, Compliance Audits, Regulatory Gates' }
    ];

    const activeTeam = teamMembers && teamMembers.length > 0 ? teamMembers : defaultTeam;

    // Build comprehensive context for Qwen
    const riskInventorySummary = risks.map((r: any) => 
      `- [${r.id}] "${r.title}" | Category: ${r.category} | Prob:${r.probability}/5, Imp:${r.impact}/5 => Score:${r.score}/25 (${r.severity}) | Status: ${r.status} | Phase: ${r.lifecyclePhase || 'Assess'} | Owner: ${r.ownerName || 'Unassigned'} (${r.ownerRole || 'Lead'}) | Exposure: $${(r.estimatedImpactUsd || r.score * 2500).toLocaleString()} USD | Mitigation: "${r.mitigationPlan || 'In progress'}" | Progress: ${r.mitigationProgress || 0}%`
    ).join('\n');

    const controlsSummary = controls.length > 0
      ? controls.map((c: any) => `- [${c.id}] ${c.title} (Type: ${c.type}, Effectiveness: ${c.effectiveness}, Owner: ${c.owner}) for Risk: ${c.riskId}`).join('\n')
      : 'Controls actively mapped in mitigation register.';

    const krisSummary = kris.length > 0
      ? kris.map((k: any) => `- [${k.code || k.id}] ${k.name}: Current ${k.currentValue} (Threshold: ${k.threshold}, Status: ${k.status})`).join('\n')
      : 'KRIs tracked via live telemetry.';

    const approvalsSummary = approvals.length > 0
      ? approvals.map((a: any) => `- [${a.id}] ${a.title} (Status: ${a.status}, Approver: ${a.approverName || a.approverRole})`).join('\n')
      : 'Governance sign-offs tracked via continuous review.';

    const systemPrompt = `You are Risk Register Copilot, the AI Business Operations & Enterprise Risk Management Assistant for MNB Research.

MNB RESEARCH TEAM DIRECTORY & KEY STAKEHOLDERS:
${activeTeam.map((t: any) => `• ${t.name} - ${t.role}${t.focus ? ` (Focus: ${t.focus})` : ''}`).join('\n')}

CURRENT USER: ${currentUser ? `${currentUser.name || currentUser.email} (${currentUser.role || 'Member'})` : 'Sunny Prasad (Business Operations Intern)'}

10-STEP CONTINUOUS RISK OPERATING LIFECYCLE CONTEXT:
1. Identify → 2. Assess → 3. Prioritise → 4. Treat → 5. Assign → 6. Monitor → 7. Review → 8. Approve → 9. Report → 10. Close

LIVE ENTERPRISE RISK INVENTORY (${totalRisks} Total Active Risks, $${totalExposureUsd.toLocaleString()} Total Portfolio Exposure):
${riskInventorySummary || 'No risks currently in database.'}

OPERATING CONTROLS (TREAT PHASE):
${controlsSummary}

KEY RISK INDICATORS (MONITOR PHASE):
${krisSummary}

GOVERNANCE APPROVALS (APPROVE PHASE):
${approvalsSummary}

${activeRiskId ? `CURRENT SCREEN FOCUS: The user is currently viewing Risk ID [${activeRiskId}]. Focus your analysis primarily on this risk unless they ask about others.` : activePath ? `CURRENT SCREEN: User is currently on page "${activePath}".` : ''}

INSTRUCTIONS FOR COPILOT (POWERED BY QWEN 27B):
1. Always respond directly, concisely, and specifically to the user's exact question: "${userQuery || 'Analyze current enterprise risk portfolio'}".
2. NEVER output canned, generic, or repeating template paragraphs. Jump straight into the specific answer without unnecessary preamble.
3. If asked about a specific risk (e.g., RSK-105, RSK-101) or a specific person (e.g., Sunny Prasad, Yash Raj), focus exclusively on that item/person with concrete metrics.
4. If asked about telemetry or live monitoring events, explain the underlying risk connection and actionable next steps.
5. Always cite concrete data proof: exact Risk IDs (e.g. [RSK-104]), quantitative $5x5$ scores, assigned owners, and dollar exposures.
6. Format with sharp, executive-ready markdown bullet points.
7. If your response clearly recommends an operational action on a specific risk (e.g. reassigning owner, updating status to Mitigated/Monitoring/Closed, or setting treatment strategy), append an action tag on its own line at the very end of your response in this exact format:
ACTION_TRIGGER:{"type":"status"|"owner"|"strategy","riskId":"RSK-xxx","targetValue":"Mitigated"|"Yash Raj"|"Mitigate","label":"Set status to Mitigated"}`;

    // 1. Primary: Ultra-Fast Groq Qwen (qwen/qwen3.8-27b) with failover to openai/gpt-oss-120b
    const groqResult = await callGroqAI({
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: imageBase64 
            ? `[Attached Screenshot/Log] ${userQuery || 'Please diagnose this system issue screenshot against our enterprise risk register.'}`
            : userQuery || 'Perform a comprehensive risk inventory audit.'
        }
      ],
      temperature: 0.3,
      maxTokens: 1500
    });

    if (groqResult.success && groqResult.content) {
      return NextResponse.json({
        reply: groqResult.content,
        provider: `Groq (${groqResult.model})`,
        success: true
      });
    }

    // 2. Secondary: Google Gemini Multimodal / Reasoning Engine Fallback
    const geminiResult = await callGeminiAI({
      systemInstruction: systemPrompt,
      prompt: imageBase64 
        ? `[Attached Screenshot/Log] ${userQuery || 'Please diagnose this system issue screenshot against our enterprise risk register.'}`
        : userQuery || 'Perform a comprehensive risk inventory audit.',
      temperature: 0.3,
      maxTokens: 1500
    });

    if (geminiResult.success && geminiResult.content) {
      return NextResponse.json({
        reply: geminiResult.content,
        provider: `Google Gemini (${geminiResult.model})`,
        success: true
      });
    }

    // If neither cloud AI provider succeeded, return an honest error
    return NextResponse.json(
      {
        reply: 'AI Copilot inference service is temporarily unavailable. Neither Groq nor Google Gemini could process your request. Please verify your provider API keys and network connectivity.',
        success: false,
        error: 'AI service unavailable',
        groqStatus: groqResult.error || (groqResult.success ? 'No reply generated' : 'Provider call failed'),
        geminiStatus: geminiResult.error || (geminiResult.success ? 'No reply generated' : 'Provider call failed')
      },
      { status: 503 }
    );

  } catch (error: any) {
    console.error('Error in copilot-chat:', error);
    return NextResponse.json({ 
      reply: 'An internal server error occurred while contacting the AI inference engines. Please check server logs.',
      success: false,
      error: error?.message || 'Internal server error'
    }, { status: 500 });
  }
}
