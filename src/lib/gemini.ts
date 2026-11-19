import { GoogleGenAI, Type } from '@google/genai';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface TriageInput {
  symptoms: string;
  duration: string;
  severity: string;
  specialists: Array<{ id: number; name: string; specialty: string; department: string }>;
}

export interface TriageResult {
  recommendedSpecialty: string;
  urgencyLevel: 'Routine' | 'Priority' | 'Same-Day Urgent';
  aiSummary: string;
  prepChecklist: string[];
  recommendedSpecialistId: number;
  matchRationale: string;
}

export async function runAiTriage(input: TriageInput): Promise<TriageResult> {
  const ai = getGeminiClient();
  const specialistList = input.specialists
    .map((s) => `ID ${s.id}: ${s.name} (${s.specialty} — ${s.department})`)
    .join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Patient symptom intake:
Symptoms: ${input.symptoms}
Duration: ${input.duration}
Self-reported severity: ${input.severity}

Available clinic specialists:
${specialistList}

Analyze the symptoms and route to the best specialist ID from the list above. Keep recommendations strictly informational scheduling triage (never diagnose definitively).`,
    config: {
      systemInstruction:
        'You are a clinical scheduling triage router for MediSlot AI. Recommend the most appropriate medical specialty, urgency tier (Routine, Priority, or Same-Day Urgent), clear scheduling rationale, and 3 practical pre-visit preparation steps.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendedSpecialty: { type: Type.STRING },
          urgencyLevel: {
            type: Type.STRING,
            description: 'Must be one of: Routine, Priority, Same-Day Urgent',
          },
          aiSummary: { type: Type.STRING },
          prepChecklist: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          recommendedSpecialistId: { type: Type.INTEGER },
          matchRationale: { type: Type.STRING },
        },
        required: [
          'recommendedSpecialty',
          'urgencyLevel',
          'aiSummary',
          'prepChecklist',
          'recommendedSpecialistId',
          'matchRationale',
        ],
      },
    },
  });

  const raw = (response.text ?? '{}').trim();
  const parsed = JSON.parse(raw);
  const validIds = new Set(input.specialists.map((s) => s.id));
  const fallbackId = input.specialists[0]?.id ?? 1;

  const urgency =
    parsed.urgencyLevel === 'Priority' || parsed.urgencyLevel === 'Same-Day Urgent'
      ? parsed.urgencyLevel
      : 'Routine';

  return {
    recommendedSpecialty: String(parsed.recommendedSpecialty || 'Internal Medicine'),
    urgencyLevel: urgency,
    aiSummary: String(parsed.aiSummary || 'Recommended for specialist evaluation.'),
    prepChecklist: Array.isArray(parsed.prepChecklist)
      ? parsed.prepChecklist.slice(0, 4).map(String)
      : ['Bring active medication list', 'Arrive 10 minutes early', 'Carry photo ID & insurance card'],
    recommendedSpecialistId: validIds.has(Number(parsed.recommendedSpecialistId))
      ? Number(parsed.recommendedSpecialistId)
      : fallbackId,
    matchRationale: String(parsed.matchRationale || 'Matched to specialty capacity and clinical focus.'),
  };
}

export async function runPredictiveSlotMatch(params: {
  preference: string;
  specialty: string;
  openSlots: Array<{
    id: number;
    specialistId: number;
    specialistName: string;
    specialty: string;
    slotDate: string;
    slotTime: string;
    visitMode: string;
  }>;
}) {
  const ai = getGeminiClient();
  const candidates = params.openSlots.slice(0, 18);
  const slotText = candidates
    .map(
      (s) =>
        `Slot#${s.id}: ${s.slotDate} at ${s.slotTime} with ${s.specialistName} (${s.specialty}, mode: ${s.visitMode})`
    )
    .join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Patient scheduling preference: "${params.preference}"
Target specialty focus: "${params.specialty || 'Any available'}"

Open slots:
${slotText}

Select the single best Slot# ID matching their routine, urgency, and time-of-day preference.`,
    config: {
      systemInstruction:
        'You are the MediSlot AI Predictive Slot Matcher. Choose the optimal available slot ID and give a concise 1-sentence explanation grounded in the slot time, date, and specialist.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          slotId: { type: Type.INTEGER },
          headline: { type: Type.STRING },
          reason: { type: Type.STRING },
          recommendedVisitType: { type: Type.STRING },
        },
        required: ['slotId', 'headline', 'reason', 'recommendedVisitType'],
      },
    },
  });

  const parsed = JSON.parse((response.text ?? '{}').trim());
  const matched =
    candidates.find((c) => c.id === Number(parsed.slotId)) || candidates[0];

  return {
    slotId: matched?.id ?? 0,
    specialistId: matched?.specialistId ?? 0,
    slotDate: matched?.slotDate ?? '',
    slotTime: matched?.slotTime ?? '',
    specialistName: matched?.specialistName ?? '',
    specialty: matched?.specialty ?? '',
    headline: String(parsed.headline || 'Optimal Schedule Fit'),
    reason: String(parsed.reason || 'Aligned with your preferred consultation window and low clinic wait load.'),
    recommendedVisitType:
      parsed.recommendedVisitType === 'Telehealth' ? 'Telehealth' : 'In-Person',
  };
}

export async function generateCareReply(params: {
  patientName: string;
  patientMessage: string;
  contextSummary: string;
}) {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Patient (${params.patientName}) message to clinic care desk:
"${params.patientMessage}"

Patient scheduling context:
${params.contextSummary}

Write a warm, concise, clinically responsible response from the MediSlot Care Coordination Desk (2-3 sentences max). Do not diagnose or prescribe; help with scheduling prep, logistics, or routing to their physician.`,
    config: {
      systemInstruction:
        'You are a concise, reassuring healthcare care coordinator at MediSlot AI. Keep replies practical, warm, and under 65 words.',
    },
  });

  return (
    response.text?.trim() ||
    'Thank you for reaching out to the MediSlot Care Desk. Your care coordinator has logged your note for your physician prior to your visit.'
  );
}
