import { useCallback, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarNav } from './components/SidebarNav';
import { TopHeader } from './components/TopHeader';
import { PatientScreens } from './screens/PatientScreens';
import { BookingScreens } from './screens/BookingScreens';
import { ProfileAndClinicScreens } from './screens/ProfileAndClinicScreens';
import {
  Appointment,
  CareMessage,
  ClinicOpsData,
  ClinicSlot,
  PatientProfile,
  ScreenId,
  Specialist,
  TriageRecord,
} from './types/medislot';

function MediSlotWorkspace() {
  const { user, authFetch } = useAuth();
  const [activeScreen, setActiveScreen] = useState<ScreenId>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [slots, setSlots] = useState<ClinicSlot[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [triageHistory, setTriageHistory] = useState<TriageRecord[]>([]);
  const [messages, setMessages] = useState<CareMessage[]>([]);
  const [clinicOps, setClinicOps] = useState<ClinicOpsData | null>(null);
  const [protectedError, setProtectedError] = useState<string | null>(null);

  const [selectedSpecialistId, setSelectedSpecialistId] = useState<number>(1);
  const [latestConfirmation, setLatestConfirmation] = useState<Appointment | null>(null);
  const [draftBooking, setDraftBooking] = useState<{
    specialistId: number;
    slotDate: string;
    slotTime: string;
    visitType: 'In-Person' | 'Telehealth';
    reason: string;
    triageUrgency: string;
  }>({
    specialistId: 1,
    slotDate: '',
    slotTime: '',
    visitType: 'In-Person',
    reason: '',
    triageUrgency: 'Routine',
  });

  const fetchPublicCatalog = useCallback(async () => {
    setCatalogError(null);
    try {
      const [specRes, slotRes] = await Promise.all([
        fetch('/api/specialists'),
        fetch('/api/slots'),
      ]);
      if (!specRes.ok || !slotRes.ok) {
        throw new Error('Could not reach clinic scheduling service.');
      }
      const specData = await specRes.json();
      const slotData = await slotRes.json();
      const list: Specialist[] = specData.specialists || [];
      setSpecialists(list);
      setSlots(slotData.slots || []);
      if (list.length > 0) {
        setSelectedSpecialistId((prev) =>
          list.some((s) => s.id === prev) ? prev : list[0].id
        );
        setDraftBooking((prev) => ({
          ...prev,
          specialistId: list.some((s) => s.id === prev.specialistId)
            ? prev.specialistId
            : list[0].id,
        }));
      }
    } catch (err: unknown) {
      setCatalogError(
        err instanceof Error ? err.message : 'Unable to load clinic catalog.'
      );
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const fetchProtectedData = useCallback(async () => {
    if (!user) {
      setAppointments([]);
      setProfile(null);
      setTriageHistory([]);
      setMessages([]);
      setClinicOps(null);
      setProtectedError(null);
      return;
    }

    setProtectedError(null);
    try {
      const [apptRes, profRes, triRes, msgRes, opsRes] = await Promise.all([
        authFetch('/api/appointments'),
        authFetch('/api/profile'),
        authFetch('/api/triage'),
        authFetch('/api/messages'),
        authFetch('/api/clinic/operations'),
      ]);

      if (apptRes.ok) {
        const d = await apptRes.json();
        setAppointments(d.appointments || []);
      }
      if (profRes.ok) {
        const d = await profRes.json();
        setProfile(d.profile || null);
      }
      if (triRes.ok) {
        const d = await triRes.json();
        setTriageHistory(d.assessments || []);
      }
      if (msgRes.ok) {
        const d = await msgRes.json();
        setMessages(d.messages || []);
      }
      if (opsRes.ok) {
        const d = await opsRes.json();
        setClinicOps(d);
      }
    } catch (err: unknown) {
      setProtectedError(
        err instanceof Error ? err.message : 'Could not sync patient data.'
      );
    }
  }, [user, authFetch]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchPublicCatalog(), fetchProtectedData()]);
  }, [fetchPublicCatalog, fetchProtectedData]);

  useEffect(() => {
    void fetchPublicCatalog();
  }, [fetchPublicCatalog]);

  useEffect(() => {
    void fetchProtectedData();
  }, [fetchProtectedData]);

  const handleStartBooking = (params: {
    specialistId: number;
    slotDate?: string;
    slotTime?: string;
    visitType?: 'In-Person' | 'Telehealth';
    reason?: string;
    triageUrgency?: string;
  }) => {
    setSelectedSpecialistId(params.specialistId);
    setDraftBooking((prev) => ({
      ...prev,
      specialistId: params.specialistId,
      slotDate: params.slotDate ?? prev.slotDate,
      slotTime: params.slotTime ?? '',
      visitType: params.visitType ?? prev.visitType,
      reason: params.reason ?? prev.reason,
      triageUrgency: params.triageUrgency ?? prev.triageUrgency,
    }));
    setActiveScreen('booking');
  };

  const isPatientScreen =
    activeScreen === 'overview' ||
    activeScreen === 'triage' ||
    activeScreen === 'specialists' ||
    activeScreen === 'provider-detail';

  const isBookingScreen =
    activeScreen === 'booking' ||
    activeScreen === 'confirmation' ||
    activeScreen === 'appointments' ||
    activeScreen === 'telehealth';

  return (
    <div className="min-h-screen flex bg-[#F6FAFF] text-[#151C22]">
      <SidebarNav
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        appointmentCount={appointments.filter((a) => a.status === 'Confirmed').length}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopHeader
          activeScreen={activeScreen}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onNavigate={setActiveScreen}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto space-y-6">
          {catalogError && (
            <div className="p-4 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-sm text-[#BE123C] flex items-center justify-between gap-4">
              <span>{catalogError}</span>
              <button
                type="button"
                onClick={() => void fetchPublicCatalog()}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#FECDD3] text-xs font-semibold"
              >
                Retry
              </button>
            </div>
          )}

          {protectedError && (
            <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#B45309]">
              {protectedError}
            </div>
          )}

          {catalogLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 h-64 rounded-2xl bg-white border border-slate-200 animate-pulse" />
              <div className="lg:col-span-5 h-64 rounded-2xl bg-white border border-slate-200 animate-pulse" />
            </div>
          ) : isPatientScreen ? (
            <PatientScreens
              activeScreen={activeScreen}
              specialists={specialists}
              slots={slots}
              appointments={appointments}
              triageHistory={triageHistory}
              selectedSpecialistId={selectedSpecialistId}
              onSelectSpecialist={setSelectedSpecialistId}
              onNavigate={setActiveScreen}
              onStartBooking={handleStartBooking}
              onRefreshProtectedData={fetchProtectedData}
            />
          ) : isBookingScreen ? (
            <BookingScreens
              activeScreen={activeScreen}
              specialists={specialists}
              slots={slots}
              appointments={appointments}
              draftBooking={draftBooking}
              latestConfirmation={latestConfirmation}
              onUpdateDraft={(patch) =>
                setDraftBooking((prev) => ({ ...prev, ...patch }))
              }
              onBookingConfirmed={(appt) => {
                setLatestConfirmation(appt);
                setActiveScreen('confirmation');
              }}
              onRefreshAll={refreshAll}
              onNavigate={setActiveScreen}
            />
          ) : (
            <ProfileAndClinicScreens
              activeScreen={activeScreen}
              profile={profile}
              messages={messages}
              specialists={specialists}
              slots={slots}
              clinicOps={clinicOps}
              onRefreshAll={refreshAll}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MediSlotWorkspace />
    </AuthProvider>
  );
}
