import { and, desc, eq, ne } from 'drizzle-orm';
import { db } from './index.ts';
import {
  appointments,
  careMessages,
  clinicSlots,
  patientProfiles,
  specialists,
  triageAssessments,
} from './schema.ts';

let seedPromise: Promise<void> | null = null;

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

export async function ensureClinicCatalogSeeded(): Promise<void> {
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
        .values([
          {
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
        ])
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
      console.error('Clinic catalog seed error:', error);
      throw new Error('Failed to initialize clinic catalog.', { cause: error });
    }
  })();

  return seedPromise;
}

export async function getAllSpecialists() {
  try {
    await ensureClinicCatalogSeeded();
    return await db.select().from(specialists).orderBy(specialists.id);
  } catch (error) {
    console.error('getAllSpecialists failed:', error);
    throw new Error('Could not load specialists directory.', { cause: error });
  }
}

export async function getSlotsWithStatus(specialistId?: number) {
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
    console.error('getSlotsWithStatus failed:', error);
    throw new Error('Could not load clinic slot matrix.', { cause: error });
  }
}

export async function getUserAppointments(userId: number) {
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
    console.error('getUserAppointments failed:', error);
    throw new Error('Could not retrieve appointments.', { cause: error });
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
  try {
    await ensureClinicCatalogSeeded();

    const conflicting = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.specialistId, params.specialistId),
          eq(appointments.slotDate, params.slotDate),
          eq(appointments.slotTime, params.slotTime),
          ne(appointments.status, 'Cancelled')
        )
      );

    if (conflicting.length > 0) {
      throw new Error('Selected slot was just booked. Please pick another time.');
    }

    const ref = `MS-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now()
      .toString()
      .slice(-4)}`;

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
        prepNotes:
          params.prepNotes ||
          'Bring valid photo ID, insurance card, and active medication list.',
        checkInStatus: 'Scheduled',
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('createAppointmentRecord failed:', error);
    if (error instanceof Error && error.message.includes('just booked')) {
      throw error;
    }
    throw new Error('Could not confirm appointment booking.', { cause: error });
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
  try {
    const existing = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, appointmentId), eq(appointments.userId, userId)));

    if (existing.length === 0) {
      return null;
    }

    const updated = await db
      .update(appointments)
      .set(updates)
      .where(and(eq(appointments.id, appointmentId), eq(appointments.userId, userId)))
      .returning();

    return updated[0];
  } catch (error) {
    console.error('updateAppointmentRecord failed:', error);
    throw new Error('Could not update appointment.', { cause: error });
  }
}

export async function getPatientProfileByUserId(userId: number) {
  try {
    const rows = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.userId, userId));
    return rows[0] || null;
  } catch (error) {
    console.error('getPatientProfileByUserId failed:', error);
    throw new Error('Could not load patient profile.', { cause: error });
  }
}

export async function updatePatientProfileRecord(
  userId: number,
  data: Partial<{
    fullName: string;
    dateOfBirth: string;
    phone: string;
    bloodType: string;
    allergies: string;
    medications: string;
    conditions: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    insuranceCarrier: string;
    insurancePlan: string;
    memberId: string;
    groupNumber: string;
    copayAmount: string;
    coverageStatus: string;
  }>
) {
  try {
    const updated = await db
      .update(patientProfiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(patientProfiles.userId, userId))
      .returning();

    return updated[0] || null;
  } catch (error) {
    console.error('updatePatientProfileRecord failed:', error);
    throw new Error('Could not save patient profile.', { cause: error });
  }
}

export async function getUserTriageHistory(userId: number) {
  try {
    return await db
      .select()
      .from(triageAssessments)
      .where(eq(triageAssessments.userId, userId))
      .orderBy(desc(triageAssessments.createdAt));
  } catch (error) {
    console.error('getUserTriageHistory failed:', error);
    throw new Error('Could not fetch triage history.', { cause: error });
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
    return inserted[0];
  } catch (error) {
    console.error('saveTriageAssessment failed:', error);
    throw new Error('Could not store triage assessment.', { cause: error });
  }
}

export async function getUserCareMessages(userId: number) {
  try {
    return await db
      .select()
      .from(careMessages)
      .where(eq(careMessages.userId, userId))
      .orderBy(careMessages.createdAt);
  } catch (error) {
    console.error('getUserCareMessages failed:', error);
    throw new Error('Could not fetch care messages.', { cause: error });
  }
}

export async function insertCareMessage(params: {
  userId: number;
  specialistId?: number | null;
  senderRole: 'patient' | 'clinic';
  senderName: string;
  body: string;
}) {
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
    return inserted[0];
  } catch (error) {
    console.error('insertCareMessage failed:', error);
    throw new Error('Could not send care message.', { cause: error });
  }
}

export async function toggleClinicSlotBlocked(slotId: number) {
  try {
    const existing = await db
      .select()
      .from(clinicSlots)
      .where(eq(clinicSlots.id, slotId));
    if (existing.length === 0) {
      return null;
    }
    const nextBlocked = !existing[0].isBlocked;
    const updated = await db
      .update(clinicSlots)
      .set({ isBlocked: nextBlocked })
      .where(eq(clinicSlots.id, slotId))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('toggleClinicSlotBlocked failed:', error);
    throw new Error('Could not update clinic slot state.', { cause: error });
  }
}

export async function updateClinicCheckIn(
  appointmentId: number,
  checkInStatus: string,
  status?: string
) {
  try {
    const patch: { checkInStatus: string; status?: string } = { checkInStatus };
    if (status) patch.status = status;

    const updated = await db
      .update(appointments)
      .set(patch)
      .where(eq(appointments.id, appointmentId))
      .returning();
    return updated[0] || null;
  } catch (error) {
    console.error('updateClinicCheckIn failed:', error);
    throw new Error('Could not update clinic check-in status.', { cause: error });
  }
}

export async function getClinicOperationsData() {
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
    console.error('getClinicOperationsData failed:', error);
    throw new Error('Could not compute clinic analytics.', { cause: error });
  }
}
