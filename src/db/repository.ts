import { and, desc, eq, ne } from 'drizzle-orm';
import { db, isDatabaseConfigured } from './index.ts';
import {
  appointments,
  careMessages,
  clinicSlots,
  patientProfiles,
  specialists,
  triageAssessments,
} from './schema.ts';

let seedPromise: Promise<void> | null = null;

// Initial catalog of specialists
const defaultSpecialistsSeed = [
  {
    id: 1,
    slug: 'elena-vance',
    name: 'Dr. Elena Vance',
    credentials: 'MD, FACC',
    specialty: 'Cardiology',
    department: 'Heart & Vascular Institute',
    clinicLocation: 'Pavilion A, Suite 304',
    bio: 'Board-certified preventive and clinical cardiologist specializing in arrhythmia diagnostics, hypertension optimization, and lipid management.',
    education: 'Johns Hopkins University School of Medicine · Residency at Mass General',
    languages: 'English, Spanish',
    yearsExperience: 14,
    consultationMinutes: 30,
    rating: '4.9',
    acceptsTelehealth: true,
    avatarUrl: '/src/assets/images/doctor_cardiology_elena_1795060876207.jpg',
    insurancesAccepted: 'BlueCross BlueShield, Aetna, UnitedHealthcare, Cigna, Medicare',
  },
  {
    id: 2,
    slug: 'elias-thorne',
    name: 'Dr. Elias Thorne',
    credentials: 'MD, PhD',
    specialty: 'Neurology',
    department: 'Clinical Neurosciences Center',
    clinicLocation: 'Pavilion B, Suite 210',
    bio: 'Fellowship-trained neurologist focused on migraine therapeutics, peripheral neuropathy, cognitive evaluation, and sleep-related neurological care.',
    education: 'Stanford University School of Medicine · UCSF Neurology Fellowship',
    languages: 'English, German',
    yearsExperience: 16,
    consultationMinutes: 40,
    rating: '4.9',
    acceptsTelehealth: true,
    avatarUrl: '/src/assets/images/doctor_neurology_marcus_1795060876108.jpg',
    insurancesAccepted: 'BlueCross BlueShield, Aetna, Cigna, Kaiser PPO, Medicare',
  },
  {
    id: 3,
    slug: 'priya-nair',
    name: 'Dr. Priya Nair',
    credentials: 'MD, FAAD',
    specialty: 'Dermatology',
    department: 'Clinical Dermatology & Skin Oncology',
    clinicLocation: 'Pavilion A, Suite 118',
    bio: 'Dermatologist specializing in eczema, acne therapeutics, full-body dermoscopy screenings, and teledermatology follow-ups.',
    education: 'Harvard Medical School · NYU Langone Dermatology Residency',
    languages: 'English, Hindi, Tamil',
    yearsExperience: 11,
    consultationMinutes: 25,
    rating: '4.8',
    acceptsTelehealth: true,
    avatarUrl: '/src/assets/images/doctor_dermatology_priya_1795060876025.jpg',
    insurancesAccepted: 'BlueCross BlueShield, UnitedHealthcare, Aetna, Cigna',
  },
  {
    id: 4,
    slug: 'david-chen',
    name: 'Dr. David Chen',
    credentials: 'MD',
    specialty: 'Orthopedics',
    department: 'Sports Medicine & Joint Reconstruction',
    clinicLocation: 'Surgical Wing C, Suite 402',
    bio: 'Orthopedic sports specialist managing ligament injuries, shoulder instability, joint preservation, and non-operative physical rehab protocols.',
    education: 'Columbia University Vagelos College · Hospital for Special Surgery',
    languages: 'English, Mandarin',
    yearsExperience: 13,
    consultationMinutes: 30,
    rating: '4.9',
    acceptsTelehealth: false,
    avatarUrl: '/src/assets/images/doctor_orthopedics_david_1795060875874.jpg',
    insurancesAccepted: 'BlueCross BlueShield, Aetna, UnitedHealthcare, Medicare',
  },
  {
    id: 5,
    slug: 'hannah-brooks',
    name: 'Dr. Hannah Brooks',
    credentials: 'MD, FACP',
    specialty: 'Internal Medicine',
    department: 'Primary & Preventive Diagnostics',
    clinicLocation: 'Pavilion A, Suite 102',
    bio: 'Primary internist delivering longitudinal preventive physicals, metabolic screening, acute illness triage, and chronic care coordination.',
    education: 'University of Pennsylvania Perelman School · Brigham & Women’s',
    languages: 'English, French',
    yearsExperience: 12,
    consultationMinutes: 30,
    rating: '4.8',
    acceptsTelehealth: true,
    avatarUrl: null,
    insurancesAccepted: 'BlueCross BlueShield, Aetna, UnitedHealthcare, Cigna, Medicare',
  },
  {
    id: 6,
    slug: 'samuel-rivera',
    name: 'Dr. Samuel Rivera',
    credentials: 'MD, FAAP',
    specialty: 'Pediatrics',
    department: 'Family & Adolescent Care',
    clinicLocation: 'Pavilion B, Suite 108',
    bio: 'Pediatrician providing developmental wellness visits, childhood immunizations, respiratory care, and rapid telehealth parent consults.',
    education: 'Yale School of Medicine · Boston Children’s Residency',
    languages: 'English, Spanish',
    yearsExperience: 9,
    consultationMinutes: 25,
    rating: '4.9',
    acceptsTelehealth: true,
    avatarUrl: null,
    insurancesAccepted: 'BlueCross BlueShield, UnitedHealthcare, Aetna, Cigna',
  },
];

// In-memory store (used for seamless fallback if DATABASE_URL is not yet connected)
let memSpecialists: any[] = [];
let memSlots: any[] = [];
let memAppointments: any[] = [];
const memProfiles = new Map<number, any>();
let memTriage: any[] = [];
let memMessages: any[] = [];
let memInitialized = false;

function getRollingDates(days = 7): string[] {
  const result: string[] = [];
  const base = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

function initMemoryStore() {
  if (memInitialized) return;
  memSpecialists = [...defaultSpecialistsSeed];

  const dates = getRollingDates(7);
  const timeGrid = [
    { time: '08:30 AM', ai: false, mode: 'in-person' },
    { time: '09:30 AM', ai: true, mode: 'both' },
    { time: '10:30 AM', ai: false, mode: 'both' },
    { time: '11:30 AM', ai: false, mode: 'telehealth' },
    { time: '01:30 PM', ai: true, mode: 'both' },
    { time: '02:30 PM', ai: false, mode: 'in-person' },
    { time: '03:30 PM', ai: false, mode: 'both' },
    { time: '04:30 PM', ai: true, mode: 'telehealth' },
  ];

  let slotId = 1;
  memSlots = [];
  for (const spec of memSpecialists) {
    for (let dIdx = 0; dIdx < dates.length; dIdx++) {
      for (let tIdx = 0; tIdx < timeGrid.length; tIdx++) {
        const slotDef = timeGrid[tIdx];
        const isBlocked = (spec.id + dIdx + tIdx) % 9 === 0;
        const mode = !spec.acceptsTelehealth ? 'in-person' : slotDef.mode;
        memSlots.push({
          id: slotId++,
          specialistId: spec.id,
          slotDate: dates[dIdx],
          slotTime: slotDef.time,
          isAiRecommended: slotDef.ai && !isBlocked,
          isBlocked,
          visitMode: mode,
        });
      }
    }
  }
  memInitialized = true;
}

export async function ensureClinicCatalogSeeded(): Promise<void> {
  initMemoryStore();

  if (!isDatabaseConfigured()) {
    return;
  }

  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    try {
      const existing = await db.select().from(specialists);
      if (existing.length > 0) {
        return;
      }

      const seededSpecialists = await db
        .insert(specialists)
        .values(
          defaultSpecialistsSeed.map(({ id: _, ...rest }) => rest)
        )
        .returning();

      const dates = getRollingDates(7);
      const timeGrid = [
        { time: '08:30 AM', ai: false, mode: 'in-person' },
        { time: '09:30 AM', ai: true, mode: 'both' },
        { time: '10:30 AM', ai: false, mode: 'both' },
        { time: '11:30 AM', ai: false, mode: 'telehealth' },
        { time: '01:30 PM', ai: true, mode: 'both' },
        { time: '02:30 PM', ai: false, mode: 'in-person' },
        { time: '03:30 PM', ai: false, mode: 'both' },
        { time: '04:30 PM', ai: true, mode: 'telehealth' },
      ];

      const slotRows: Array<{
        specialistId: number;
        slotDate: string;
        slotTime: string;
        isAiRecommended: boolean;
        isBlocked: boolean;
        visitMode: string;
      }> = [];

      for (const spec of seededSpecialists) {
        for (let dIdx = 0; dIdx < dates.length; dIdx++) {
          for (let tIdx = 0; tIdx < timeGrid.length; tIdx++) {
            const slotDef = timeGrid[tIdx];
            const isBlocked = (spec.id + dIdx + tIdx) % 9 === 0;
            const mode = !spec.acceptsTelehealth ? 'in-person' : slotDef.mode;
            slotRows.push({
              specialistId: spec.id,
              slotDate: dates[dIdx],
              slotTime: slotDef.time,
              isAiRecommended: slotDef.ai && !isBlocked,
              isBlocked,
              visitMode: mode,
            });
          }
        }
      }

      if (slotRows.length > 0) {
        await db.insert(clinicSlots).values(slotRows);
      }
    } catch (error) {
      seedPromise = null;
      console.warn('Note: Clinic catalog seeding to Postgres was deferred (using local cache).');
    }
  })();

  return seedPromise;
}

export async function getAllSpecialists() {
  initMemoryStore();
  if (!isDatabaseConfigured()) {
    return memSpecialists;
  }
  try {
    await ensureClinicCatalogSeeded();
    return await db.select().from(specialists).orderBy(specialists.id);
  } catch (error) {
    return memSpecialists;
  }
}

export async function getSlotsWithStatus(specialistId?: number) {
  initMemoryStore();
  if (!isDatabaseConfigured()) {
    const slots = specialistId
      ? memSlots.filter((s) => s.specialistId === specialistId)
      : memSlots;
    const activeAppts = memAppointments.filter((a) => a.status !== 'Cancelled');
    const bookedSet = new Set(
      activeAppts.map((a) => `${a.specialistId}__${a.slotDate}__${a.slotTime}`)
    );
    return slots.map((s) => ({
      ...s,
      isBooked: bookedSet.has(`${s.specialistId}__${s.slotDate}__${s.slotTime}`),
    }));
  }

  try {
    await ensureClinicCatalogSeeded();
    const allSlots = specialistId
      ? await db
          .select()
          .from(clinicSlots)
          .where(eq(clinicSlots.specialistId, specialistId))
          .orderBy(clinicSlots.slotDate, clinicSlots.id)
      : await db
          .select()
          .from(clinicSlots)
          .orderBy(clinicSlots.slotDate, clinicSlots.id);

    const activeAppointments = await db
      .select({
        specialistId: appointments.specialistId,
        slotDate: appointments.slotDate,
        slotTime: appointments.slotTime,
      })
      .from(appointments)
      .where(ne(appointments.status, 'Cancelled'));

    const bookedSet = new Set(
      activeAppointments.map(
        (a) => `${a.specialistId}__${a.slotDate}__${a.slotTime}`
      )
    );

    return allSlots.map((slot) => ({
      ...slot,
      isBooked: bookedSet.has(
        `${slot.specialistId}__${slot.slotDate}__${slot.slotTime}`
      ),
    }));
  } catch (error) {
    const slots = specialistId
      ? memSlots.filter((s) => s.specialistId === specialistId)
      : memSlots;
    return slots.map((s) => ({ ...s, isBooked: false }));
  }
}

export async function getUserAppointments(userId: number) {
  initMemoryStore();
  if (!isDatabaseConfigured()) {
    return memAppointments.filter((a) => a.userId === userId);
  }

  try {
    await ensureClinicCatalogSeeded();
    const rows = await db
      .select({
        id: appointments.id,
        referenceCode: appointments.referenceCode,
        userId: appointments.userId,
        specialistId: appointments.specialistId,
        slotDate: appointments.slotDate,
        slotTime: appointments.slotTime,
        visitType: appointments.visitType,
        status: appointments.status,
        reason: appointments.reason,
        triageUrgency: appointments.triageUrgency,
        prepNotes: appointments.prepNotes,
        vitalsPrecheck: appointments.vitalsPrecheck,
        checkInStatus: appointments.checkInStatus,
        createdAt: appointments.createdAt,
        specialistName: specialists.name,
        specialistCredentials: specialists.credentials,
        specialty: specialists.specialty,
        clinicLocation: specialists.clinicLocation,
        avatarUrl: specialists.avatarUrl,
        consultationMinutes: specialists.consultationMinutes,
      })
      .from(appointments)
      .innerJoin(specialists, eq(appointments.specialistId, specialists.id))
      .where(eq(appointments.userId, userId))
      .orderBy(desc(appointments.createdAt));

    return rows;
  } catch (error) {
    return memAppointments.filter((a) => a.userId === userId);
  }
}

export async function createAppointmentRecord(params: {
  userId: number;
  specialistId: number;
  slotDate: string;
  slotTime: string;
  visitType: string;
  reason: string;
  triageUrgency?: string;
  prepNotes?: string;
}) {
  initMemoryStore();
  const ref = `MS-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now()
    .toString()
    .slice(-4)}`;

  const specialist = memSpecialists.find((s) => s.id === params.specialistId) || {
    name: 'Clinic Specialist',
    specialty: 'Clinical Consultation',
    credentials: 'MD',
    clinicLocation: 'Main Pavilion',
    avatarUrl: null,
    consultationMinutes: 30,
  };

  const newAppt = {
    id: memAppointments.length + 1,
    referenceCode: ref,
    userId: params.userId,
    specialistId: params.specialistId,
    slotDate: params.slotDate,
    slotTime: params.slotTime,
    visitType: params.visitType,
    status: 'Confirmed',
    reason: params.reason,
    triageUrgency: params.triageUrgency || 'Routine',
    prepNotes:
      params.prepNotes ||
      'Bring valid photo ID, insurance card, and active medication list.',
    checkInStatus: 'Scheduled',
    createdAt: new Date(),
    specialistName: specialist.name,
    specialistCredentials: specialist.credentials,
    specialty: specialist.specialty,
    clinicLocation: specialist.clinicLocation,
    avatarUrl: specialist.avatarUrl,
    consultationMinutes: specialist.consultationMinutes,
  };

  memAppointments.unshift(newAppt);

  if (!isDatabaseConfigured()) {
    return newAppt;
  }

  try {
    await ensureClinicCatalogSeeded();
    const inserted = await db
      .insert(appointments)
      .values({
        referenceCode: ref,
        userId: params.userId,
        specialistId: params.specialistId,
        slotDate: params.slotDate,
        slotTime: params.slotTime,
        visitType: params.visitType,
        status: 'Confirmed',
        reason: params.reason,
        triageUrgency: params.triageUrgency || 'Routine',
        prepNotes: params.prepNotes || 'Bring valid photo ID, insurance card, and active medication list.',
        checkInStatus: 'Scheduled',
      })
      .returning();

    return inserted[0] || newAppt;
  } catch (error) {
    return newAppt;
  }
}

export async function updateAppointmentRecord(
  userId: number,
  appointmentId: number,
  updates: {
    slotDate?: string;
    slotTime?: string;
    visitType?: string;
    status?: string;
    reason?: string;
    vitalsPrecheck?: string;
    checkInStatus?: string;
  }
) {
  initMemoryStore();
  const idx = memAppointments.findIndex(
    (a) => a.id === appointmentId && a.userId === userId
  );
  if (idx !== -1) {
    memAppointments[idx] = { ...memAppointments[idx], ...updates };
  }

  if (!isDatabaseConfigured()) {
    return idx !== -1 ? memAppointments[idx] : null;
  }

  try {
    const updated = await db
      .update(appointments)
      .set(updates)
      .where(and(eq(appointments.id, appointmentId), eq(appointments.userId, userId)))
      .returning();

    return updated[0] || (idx !== -1 ? memAppointments[idx] : null);
  } catch (error) {
    return idx !== -1 ? memAppointments[idx] : null;
  }
}

export async function getPatientProfileByUserId(userId: number) {
  initMemoryStore();
  if (!memProfiles.has(userId)) {
    memProfiles.set(userId, {
      id: userId,
      userId,
      fullName: 'Patient User',
      dateOfBirth: '1990-05-14',
      phone: '+1 (415) 555-0192',
      bloodType: 'O+',
      allergies: 'None reported',
      medications: 'None reported',
      conditions: 'None reported',
      emergencyContactName: '',
      emergencyContactPhone: '',
      insuranceCarrier: 'BlueCross BlueShield',
      insurancePlan: 'PPO Gold Select',
      memberId: 'BCBS-8841209',
      groupNumber: 'GRP-44021',
      copayAmount: '$25',
      coverageStatus: 'Verified',
      updatedAt: new Date(),
    });
  }

  if (!isDatabaseConfigured()) {
    return memProfiles.get(userId);
  }

  try {
    const rows = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, userId));
    return rows[0] || memProfiles.get(userId);
  } catch (error) {
    return memProfiles.get(userId);
  }
}

export async function updatePatientProfileRecord(
  userId: number,
  data: Partial<any>
) {
  initMemoryStore();
  const current = await getPatientProfileByUserId(userId);
  const updatedProfile = { ...current, ...data, updatedAt: new Date() };
  memProfiles.set(userId, updatedProfile);

  if (!isDatabaseConfigured()) {
    return updatedProfile;
  }

  try {
    const updated = await db
      .update(patientProfiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(patientProfiles.userId, userId))
      .returning();

    return updated[0] || updatedProfile;
  } catch (error) {
    return updatedProfile;
  }
}

export async function getUserTriageHistory(userId: number) {
  initMemoryStore();
  if (!isDatabaseConfigured()) {
    return memTriage.filter((t) => t.userId === userId);
  }

  try {
    return await db
      .select()
      .from(triageAssessments)
      .where(eq(triageAssessments.userId, userId))
      .orderBy(desc(triageAssessments.createdAt));
  } catch (error) {
    return memTriage.filter((t) => t.userId === userId);
  }
}

export async function saveTriageAssessment(params: {
  userId: number;
  symptoms: string;
  duration: string;
  severity: string;
  recommendedSpecialty: string;
  urgencyLevel: string;
  aiSummary: string;
  prepChecklist: string[];
}) {
  initMemoryStore();
  const newAssessment = {
    id: memTriage.length + 1,
    ...params,
    prepChecklist: JSON.stringify(params.prepChecklist),
    createdAt: new Date(),
  };
  memTriage.unshift(newAssessment);

  if (!isDatabaseConfigured()) {
    return newAssessment;
  }

  try {
    const inserted = await db
      .insert(triageAssessments)
      .values({
        userId: params.userId,
        symptoms: params.symptoms,
        duration: params.duration,
        severity: params.severity,
        recommendedSpecialty: params.recommendedSpecialty,
        urgencyLevel: params.urgencyLevel,
        aiSummary: params.aiSummary,
        prepChecklist: JSON.stringify(params.prepChecklist),
      })
      .returning();
    return inserted[0] || newAssessment;
  } catch (error) {
    return newAssessment;
  }
}

export async function getUserCareMessages(userId: number) {
  initMemoryStore();
  if (!isDatabaseConfigured()) {
    return memMessages.filter((m) => m.userId === userId);
  }

  try {
    return await db
      .select()
      .from(careMessages)
      .where(eq(careMessages.userId, userId))
      .orderBy(careMessages.createdAt);
  } catch (error) {
    return memMessages.filter((m) => m.userId === userId);
  }
}

export async function insertCareMessage(params: {
  userId: number;
  specialistId?: number | null;
  senderRole: 'patient' | 'clinic';
  senderName: string;
  body: string;
}) {
  initMemoryStore();
  const newMsg = {
    id: memMessages.length + 1,
    ...params,
    specialistId: params.specialistId ?? null,
    createdAt: new Date(),
  };
  memMessages.push(newMsg);

  if (!isDatabaseConfigured()) {
    return newMsg;
  }

  try {
    const inserted = await db
      .insert(careMessages)
      .values({
        userId: params.userId,
        specialistId: params.specialistId ?? null,
        senderRole: params.senderRole,
        senderName: params.senderName,
        body: params.body,
      })
      .returning();
    return inserted[0] || newMsg;
  } catch (error) {
    return newMsg;
  }
}

export async function toggleClinicSlotBlocked(slotId: number) {
  initMemoryStore();
  const s = memSlots.find((slot) => slot.id === slotId);
  if (s) {
    s.isBlocked = !s.isBlocked;
  }

  if (!isDatabaseConfigured()) {
    return s || null;
  }

  try {
    const existing = await db
      .select()
      .from(clinicSlots)
      .where(eq(clinicSlots.id, slotId));
    if (existing.length === 0) {
      return s || null;
    }
    const nextBlocked = !existing[0].isBlocked;
    const updated = await db
      .update(clinicSlots)
      .set({ isBlocked: nextBlocked })
      .where(eq(clinicSlots.id, slotId))
      .returning();
    return updated[0] || s || null;
  } catch (error) {
    return s || null;
  }
}

export async function updateClinicCheckIn(
  appointmentId: number,
  checkInStatus: string,
  status?: string
) {
  initMemoryStore();
  const appt = memAppointments.find((a) => a.id === appointmentId);
  if (appt) {
    appt.checkInStatus = checkInStatus;
    if (status) appt.status = status;
  }

  if (!isDatabaseConfigured()) {
    return appt || null;
  }

  try {
    const patch: { checkInStatus: string; status?: string } = { checkInStatus };
    if (status) patch.status = status;

    const updated = await db
      .update(appointments)
      .set(patch)
      .where(eq(appointments.id, appointmentId))
      .returning();
    return updated[0] || appt || null;
  } catch (error) {
    return appt || null;
  }
}

export async function getClinicOperationsData() {
  initMemoryStore();
  const specs = await getAllSpecialists();
  const slots = await getSlotsWithStatus();
  const appts = memAppointments;

  if (!isDatabaseConfigured()) {
    return {
      specialists: specs,
      totalSlots: slots.length,
      blockedSlots: slots.filter((s) => s.isBlocked).length,
      aiRecommendedSlots: slots.filter((s) => s.isAiRecommended).length,
      appointments: appts,
    };
  }

  try {
    await ensureClinicCatalogSeeded();
    const allSpecs = await db.select().from(specialists).orderBy(specialists.id);
    const allSlots = await db.select().from(clinicSlots);
    const allAppts = await db
      .select({
        id: appointments.id,
        referenceCode: appointments.referenceCode,
        specialistId: appointments.specialistId,
        slotDate: appointments.slotDate,
        slotTime: appointments.slotTime,
        visitType: appointments.visitType,
        status: appointments.status,
        triageUrgency: appointments.triageUrgency,
        checkInStatus: appointments.checkInStatus,
        reason: appointments.reason,
        specialistName: specialists.name,
        specialty: specialists.specialty,
      })
      .from(appointments)
      .innerJoin(specialists, eq(appointments.specialistId, specialists.id))
      .orderBy(desc(appointments.createdAt));

    return {
      specialists: allSpecs,
      totalSlots: allSlots.length,
      blockedSlots: allSlots.filter((s) => s.isBlocked).length,
      aiRecommendedSlots: allSlots.filter((s) => s.isAiRecommended).length,
      appointments: allAppts,
    };
  } catch (error) {
    return {
      specialists: specs,
      totalSlots: slots.length,
      blockedSlots: slots.filter((s) => s.isBlocked).length,
      aiRecommendedSlots: slots.filter((s) => s.isAiRecommended).length,
      appointments: appts,
    };
  }
}
