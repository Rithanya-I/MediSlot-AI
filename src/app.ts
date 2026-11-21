import 'dotenv/config';
import express, { Router } from 'express';
import {
  createAppointmentRecord,
  getAllSpecialists,
  getClinicOperationsData,
  getPatientProfileByUserId,
  getSlotsWithStatus,
  getUserAppointments,
  getUserCareMessages,
  getUserTriageHistory,
  insertCareMessage,
  saveTriageAssessment,
  toggleClinicSlotBlocked,
  updateAppointmentRecord,
  updateClinicCheckIn,
  updatePatientProfileRecord,
} from './db/repository.ts';
import {
  generateCareReply,
  runAiTriage,
  runPredictiveSlotMatch,
} from './lib/gemini.ts';
import { AuthRequest, requireAuth } from './middleware/auth.ts';

const app = express();
app.use(express.json({ limit: '1mb' }));

const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'MediSlot AI' });
});

// Public clinical catalog & slot availability
apiRouter.get('/specialists', async (_req, res) => {
  try {
    const data = await getAllSpecialists();
    res.json({ specialists: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to load specialists';
    res.status(500).json({ error: msg });
  }
});

apiRouter.get('/slots', async (req, res) => {
  try {
    const specialistId = req.query.specialistId
      ? Number(req.query.specialistId)
      : undefined;
    const slots = await getSlotsWithStatus(specialistId);
    res.json({ slots });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to load slots';
    res.status(500).json({ error: msg });
  }
});

// Authenticated patient & clinic endpoints
apiRouter.get('/appointments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const list = await getUserAppointments(req.dbUser!.id);
    res.json({ appointments: list });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to load appointments';
    res.status(500).json({ error: msg });
  }
});

apiRouter.post('/appointments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { specialistId, slotDate, slotTime, visitType, reason, triageUrgency, prepNotes } =
      req.body;
    if (!specialistId || !slotDate || !slotTime || !reason) {
      res.status(400).json({ error: 'Missing required booking fields.' });
      return;
    }

    const created = await createAppointmentRecord({
      userId: req.dbUser!.id,
      specialistId: Number(specialistId),
      slotDate: String(slotDate),
      slotTime: String(slotTime),
      visitType: String(visitType || 'In-Person'),
      reason: String(reason),
      triageUrgency: triageUrgency ? String(triageUrgency) : 'Routine',
      prepNotes: prepNotes ? String(prepNotes) : undefined,
    });

    const hydrated = await getUserAppointments(req.dbUser!.id);
    const record = hydrated.find((a) => a.id === created.id) || created;
    res.status(201).json({ appointment: record });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Booking failed';
    const statusCode = msg.includes('just booked') ? 409 : 500;
    res.status(statusCode).json({ error: msg });
  }
});

apiRouter.patch('/appointments/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { slotDate, slotTime, visitType, status, reason, vitalsPrecheck, checkInStatus } =
      req.body;

    const updated = await updateAppointmentRecord(req.dbUser!.id, id, {
      ...(slotDate !== undefined ? { slotDate: String(slotDate) } : {}),
      ...(slotTime !== undefined ? { slotTime: String(slotTime) } : {}),
      ...(visitType !== undefined ? { visitType: String(visitType) } : {}),
      ...(status !== undefined ? { status: String(status) } : {}),
      ...(reason !== undefined ? { reason: String(reason) } : {}),
      ...(vitalsPrecheck !== undefined ? { vitalsPrecheck: String(vitalsPrecheck) } : {}),
      ...(checkInStatus !== undefined ? { checkInStatus: String(checkInStatus) } : {}),
    });

    if (!updated) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }
    res.json({ appointment: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Update failed';
    res.status(500).json({ error: msg });
  }
});

apiRouter.get('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = await getPatientProfileByUserId(req.dbUser!.id);
    res.json({ profile, user: req.dbUser });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to load profile';
    res.status(500).json({ error: msg });
  }
});

apiRouter.put('/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const updated = await updatePatientProfileRecord(req.dbUser!.id, req.body);
    res.json({ profile: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update profile';
    res.status(500).json({ error: msg });
  }
});

apiRouter.get('/triage', requireAuth, async (req: AuthRequest, res) => {
  try {
    const history = await getUserTriageHistory(req.dbUser!.id);
    res.json({ assessments: history });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch triage history';
    res.status(500).json({ error: msg });
  }
});

apiRouter.post('/ai/triage', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { symptoms, duration, severity } = req.body;
    if (!symptoms || !String(symptoms).trim()) {
      res.status(400).json({ error: 'Please describe your symptoms for triage routing.' });
      return;
    }

    const specialists = await getAllSpecialists();
    const result = await runAiTriage({
      symptoms: String(symptoms),
      duration: String(duration || '2–3 days'),
      severity: String(severity || 'Moderate'),
      specialists: specialists.map((s) => ({
        id: s.id,
        name: s.name,
        specialty: s.specialty,
        department: s.department,
      })),
    });

    const saved = await saveTriageAssessment({
      userId: req.dbUser!.id,
      symptoms: String(symptoms),
      duration: String(duration || '2–3 days'),
      severity: String(severity || 'Moderate'),
      recommendedSpecialty: result.recommendedSpecialty,
      urgencyLevel: result.urgencyLevel,
      aiSummary: result.aiSummary,
      prepChecklist: result.prepChecklist,
    });

    res.json({ triage: result, record: saved });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'AI triage request failed';
    res.status(500).json({ error: msg });
  }
});

apiRouter.post('/ai/match-slot', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { preference, specialty } = req.body;
    const specialists = await getAllSpecialists();
    const specMap = new Map(specialists.map((s) => [s.id, s]));
    const allSlots = await getSlotsWithStatus();

    const openSlots = allSlots
      .filter((s) => !s.isBooked && !s.isBlocked)
      .filter((s) => {
        if (!specialty || specialty === 'All') return true;
        const sp = specMap.get(s.specialistId);
        return sp?.specialty.toLowerCase() === String(specialty).toLowerCase();
      })
      .map((s) => {
        const sp = specMap.get(s.specialistId);
        return {
          id: s.id,
          specialistId: s.specialistId,
          specialistName: sp?.name || 'Specialist',
          specialty: sp?.specialty || 'General',
          slotDate: s.slotDate,
          slotTime: s.slotTime,
          visitMode: s.visitMode,
        };
      });

    if (openSlots.length === 0) {
      res.status(404).json({ error: 'No open slots match that specialty filter.' });
      return;
    }

    const match = await runPredictiveSlotMatch({
      preference: String(preference || 'Earliest low-wait morning or midday slot'),
      specialty: String(specialty || 'Any'),
      openSlots,
    });

    res.json({ match });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Predictive slot match failed';
    res.status(500).json({ error: msg });
  }
});

apiRouter.get('/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const messages = await getUserCareMessages(req.dbUser!.id);
    res.json({ messages });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to load messages';
    res.status(500).json({ error: msg });
  }
});

apiRouter.post('/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { body, specialistId } = req.body;
    if (!body || !String(body).trim()) {
      res.status(400).json({ error: 'Message text is required.' });
      return;
    }

    const patientMsg = await insertCareMessage({
      userId: req.dbUser!.id,
      specialistId: specialistId ? Number(specialistId) : null,
      senderRole: 'patient',
      senderName: req.dbUser!.displayName,
      body: String(body).trim(),
    });

    const appts = await getUserAppointments(req.dbUser!.id);
    const contextSummary = appts
      .slice(0, 2)
      .map(
        (a) =>
          `${a.referenceCode}: ${a.specialistName} (${a.specialty}) on ${a.slotDate} at ${a.slotTime} [${a.status}]`
      )
      .join('; ');

    const replyText = await generateCareReply({
      patientName: req.dbUser!.displayName,
      patientMessage: String(body).trim(),
      contextSummary: contextSummary || 'No active appointments booked yet.',
    });

    const clinicMsg = await insertCareMessage({
      userId: req.dbUser!.id,
      specialistId: specialistId ? Number(specialistId) : null,
      senderRole: 'clinic',
      senderName: 'MediSlot Care Desk',
      body: replyText,
    });

    res.status(201).json({ messages: [patientMsg, clinicMsg] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to send care message';
    res.status(500).json({ error: msg });
  }
});

// Clinic operations & analytics (authenticated)
apiRouter.get('/clinic/operations', requireAuth, async (_req: AuthRequest, res) => {
  try {
    const ops = await getClinicOperationsData();
    res.json(ops);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to load clinic operations';
    res.status(500).json({ error: msg });
  }
});

apiRouter.patch('/clinic/slots/:id/toggle', requireAuth, async (req: AuthRequest, res) => {
  try {
    const updated = await toggleClinicSlotBlocked(Number(req.params.id));
    if (!updated) {
      res.status(404).json({ error: 'Slot not found.' });
      return;
    }
    res.json({ slot: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to toggle slot';
    res.status(500).json({ error: msg });
  }
});

apiRouter.patch('/clinic/appointments/:id/checkin', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { checkInStatus, status } = req.body;
    const updated = await updateClinicCheckIn(
      Number(req.params.id),
      String(checkInStatus || 'Checked In'),
      status ? String(status) : undefined
    );
    if (!updated) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }
    res.json({ appointment: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Check-in update failed';
    res.status(500).json({ error: msg });
  }
});

// Mount router on both '/api' and '/' to seamlessly handle both local Express and Vercel Serverless Function routing
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
