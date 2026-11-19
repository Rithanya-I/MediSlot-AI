import { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  Camera,
  CheckCircle2,
  Download,
  MapPin,
  Mic,
  RefreshCw,
  Search,
  Sparkles,
  Video,
  XCircle,
} from 'lucide-react';
import { ClinicImage } from '../components/ClinicImage';
import { AuthGateCard, StatusTag } from '../components/ClinicalUI';
import { useAuth } from '../context/AuthContext';
import {
  Appointment,
  ClinicSlot,
  ScreenId,
  Specialist,
} from '../types/medislot';

interface BookingScreensProps {
  activeScreen: ScreenId;
  specialists: Specialist[];
  slots: ClinicSlot[];
  appointments: Appointment[];
  draftBooking: {
    specialistId: number;
    slotDate: string;
    slotTime: string;
    visitType: 'In-Person' | 'Telehealth';
    reason: string;
    triageUrgency: string;
  };
  latestConfirmation: Appointment | null;
  onUpdateDraft: (
    patch: Partial<{
      specialistId: number;
      slotDate: string;
      slotTime: string;
      visitType: 'In-Person' | 'Telehealth';
      reason: string;
      triageUrgency: string;
    }>
  ) => void;
  onBookingConfirmed: (appt: Appointment) => void;
  onRefreshAll: () => Promise<void>;
  onNavigate: (screen: ScreenId) => void;
}

export function BookingScreens({
  activeScreen,
  specialists,
  slots,
  appointments,
  draftBooking,
  latestConfirmation,
  onUpdateDraft,
  onBookingConfirmed,
  onRefreshAll,
  onNavigate,
}: BookingScreensProps) {
  const { user, authFetch } = useAuth();

  // Booking screen state
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Appointments screen state
  const [apptTab, setApptTab] = useState<'Upcoming' | 'Past' | 'Cancelled'>('Upcoming');
  const [apptSearch, setApptSearch] = useState('');
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [apptActionMsg, setApptActionMsg] = useState<string | null>(null);

  // Telehealth room state
  const [selectedTeleId, setSelectedTeleId] = useState<number | null>(null);
  const [vitalsNote, setVitalsNote] = useState('');
  const [vitalsSavedMsg, setVitalsSavedMsg] = useState<string | null>(null);
  const [mediaStatus, setMediaStatus] = useState<'idle' | 'checking' | 'ready' | 'fallback'>(
    'idle'
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [activeScreen]);

  const activeSpecialist =
    specialists.find((s) => s.id === draftBooking.specialistId) || specialists[0];

  const datesForSpecialist = Array.from(
    new Set(
      slots
        .filter((s) => s.specialistId === (activeSpecialist?.id ?? 1))
        .map((s) => s.slotDate)
    )
  ).sort();

  const currentSelectedDate =
    draftBooking.slotDate && datesForSpecialist.includes(draftBooking.slotDate)
      ? draftBooking.slotDate
      : datesForSpecialist[0] || '';

  const slotsForSelectedDay = slots.filter(
    (s) =>
      s.specialistId === (activeSpecialist?.id ?? 1) &&
      s.slotDate === currentSelectedDate
  );

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    if (!user) {
      setBookingError('Please sign in with Google in the top bar to confirm your booking.');
      return;
    }
    if (!activeSpecialist || !currentSelectedDate || !draftBooking.slotTime) {
      setBookingError('Please select an available date and time slot.');
      return;
    }
    if (!draftBooking.reason.trim()) {
      setBookingError('Please enter a brief reason for your consultation.');
      return;
    }

    setBookingSubmitting(true);
    try {
      const res = await authFetch('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          specialistId: activeSpecialist.id,
          slotDate: currentSelectedDate,
          slotTime: draftBooking.slotTime,
          visitType: draftBooking.visitType,
          reason: draftBooking.reason.trim(),
          triageUrgency: draftBooking.triageUrgency || 'Routine',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed.');
      await onRefreshAll();
      onBookingConfirmed(data.appointment);
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : 'Unable to book slot.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  // SCREEN 5: INTERACTIVE SLOT MATRIX & BOOKING
  if (activeScreen === 'booking') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-5">
          <div className="clinical-card rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-[#0F2942]">
              Select Specialist
            </h2>
            <div className="space-y-2">
              {specialists.map((doc) => {
                const selected = doc.id === activeSpecialist?.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() =>
                      onUpdateDraft({
                        specialistId: doc.id,
                        slotTime: '',
                        visitType:
                          !doc.acceptsTelehealth && draftBooking.visitType === 'Telehealth'
                            ? 'In-Person'
                            : draftBooking.visitType,
                      })
                    }
                    className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center gap-3 ${
                      selected
                        ? 'bg-[#EDF4FC] border-[#0D7A73]'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ClinicImage
                      src={doc.avatarUrl}
                      alt={doc.name}
                      fallbackLabel={doc.name}
                      className="w-11 h-11 rounded-lg object-cover shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0F2942] truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {doc.specialty} · {doc.consultationMinutes} min
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {activeSpecialist && (
            <div className="clinical-card rounded-2xl p-5 space-y-2">
              <p className="text-xs font-semibold text-[#0D7A73]">Selected Clinic</p>
              <p className="font-display font-semibold text-[#0F2942]">
                {activeSpecialist.department}
              </p>
              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{activeSpecialist.clinicLocation}</span>
              </p>
            </div>
          )}
        </div>

        <form
          onSubmit={handleConfirmBooking}
          className="lg:col-span-8 clinical-card rounded-2xl p-6 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#0F2942]">
                Interactive Slot Matrix
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cyan-bordered slots indicate AI-predicted low wait windows
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#EDF4FC] rounded-lg shrink-0">
              {(['In-Person', 'Telehealth'] as const).map((mode) => {
                const disabled =
                  mode === 'Telehealth' && activeSpecialist && !activeSpecialist.acceptsTelehealth;
                return (
                  <button
                    key={mode}
                    type="button"
                    disabled={disabled}
                    onClick={() => onUpdateDraft({ visitType: mode })}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap disabled:opacity-40 ${
                      draftBooking.visitType === mode
                        ? 'bg-white text-[#0D7A73] shadow-xs'
                        : 'text-slate-600 hover:text-[#0F2942]'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7-day rolling date strip */}
          <div>
            <label className="block text-xs font-semibold text-[#0F2942] mb-2">
              1. Choose Consultation Date
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {datesForSpecialist.map((dateStr) => {
                const d = new Date(`${dateStr}T12:00:00`);
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = d.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                const isSelected = currentSelectedDate === dateStr;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => onUpdateDraft({ slotDate: dateStr, slotTime: '' })}
                    className={`px-3.5 py-2.5 rounded-lg border text-center shrink-0 transition-colors min-w-[84px] ${
                      isSelected
                        ? 'bg-[#0D7A73] border-[#0D7A73] text-white'
                        : 'bg-white border-slate-200 text-[#0F2942] hover:border-[#0D7A73]'
                    }`}
                  >
                    <span className="block text-[11px] opacity-80">{dayName}</span>
                    <span className="block font-mono text-xs font-semibold tabular-nums mt-0.5">
                      {dayNum}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slot Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#0F2942]">
                2. Select Open Time Slot
              </label>
              <span className="text-xs text-slate-500">
                {slotsForSelectedDay.filter((s) => !s.isBooked && !s.isBlocked).length} open
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {slotsForSelectedDay.map((slot) => {
                const unavailable = slot.isBooked || slot.isBlocked;
                const modeConflict =
                  draftBooking.visitType === 'Telehealth' && slot.visitMode === 'in-person';
                const disabled = unavailable || modeConflict;
                const selected = draftBooking.slotTime === slot.slotTime;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onUpdateDraft({ slotTime: slot.slotTime })}
                    className={`relative p-3 rounded-lg border text-left transition-colors ${
                      disabled
                        ? 'bg-[#F8FAFC] border-[#F1F5F9] text-[#94A3B8] cursor-not-allowed'
                        : selected
                        ? 'bg-[#0D7A73] border-[#0D7A73] text-white'
                        : slot.isAiRecommended
                        ? 'bg-[#F0F7FF] border-[#38BDF8] text-[#0A6C74] hover:border-[#0D7A73]'
                        : 'bg-white border-slate-200 text-[#0F2942] hover:border-[#0D7A73]'
                    }`}
                  >
                    {!disabled && slot.isAiRecommended && !selected && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#0A6C74] mb-0.5">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Recommended</span>
                      </span>
                    )}
                    <span className="block font-mono text-sm font-semibold tabular-nums">
                      {slot.slotTime}
                    </span>
                    <span className="block text-[11px] mt-0.5 opacity-80">
                      {slot.isBooked
                        ? 'Booked'
                        : slot.isBlocked
                        ? 'Blocked'
                        : modeConflict
                        ? 'In-person only'
                        : slot.visitMode === 'telehealth'
                        ? 'Video visit'
                        : 'Clinic or Video'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F2942] mb-1.5">
              3. Clinical Reason / Visit Notes
            </label>
            <textarea
              rows={3}
              value={draftBooking.reason}
              onChange={(e) => onUpdateDraft({ reason: e.target.value })}
              placeholder="Briefly describe symptoms, follow-up labs, or medication questions..."
              className="w-full p-3 rounded-lg border border-slate-200 text-sm text-[#0F2942] focus:outline-none focus:border-[#0D7A73]"
            />
          </div>

          {bookingError && (
            <p className="text-xs text-[#BE123C] bg-[#FFF1F2] border border-[#FECDD3] rounded-lg px-3 py-2">
              {bookingError}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-600 font-mono tabular-nums">
              {draftBooking.slotTime
                ? `${activeSpecialist?.name} · ${currentSelectedDate} · ${draftBooking.slotTime} (${draftBooking.visitType})`
                : 'Select a time chip above to continue'}
            </div>
            <button
              type="submit"
              disabled={bookingSubmitting}
              className="px-6 py-2.5 rounded-lg bg-[#0D7A73] hover:bg-[#0A6C74] disabled:opacity-60 text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              {bookingSubmitting ? 'Confirming Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // SCREEN 6: APPOINTMENT CONFIRMATION & PREP PASS
  if (activeScreen === 'confirmation') {
    if (!user) {
      return (
        <AuthGateCard
          title="Sign in to view your Visit Pass"
          description="Your digital check-in pass, calendar export, and pre-visit checklist appear here once authenticated."
        />
      );
    }

    const passAppt =
      latestConfirmation ||
      appointments.find((a) => a.status === 'Confirmed') ||
      appointments[0];

    if (!passAppt) {
      return (
        <div className="clinical-card rounded-2xl p-8 max-w-xl mx-auto text-center space-y-4">
          <h2 className="font-display text-xl font-semibold text-[#0F2942]">
            No Active Visit Pass Yet
          </h2>
          <p className="text-sm text-slate-600">
            Book an appointment in the Slot Matrix to generate your digital check-in pass and calendar invite.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('booking')}
            className="px-5 py-2.5 rounded-lg bg-[#0D7A73] text-white text-sm font-semibold hover:bg-[#0A6C74]"
          >
            Book Consultation
          </button>
        </div>
      );
    }

    const handleDownloadIcs = () => {
      const cleanDate = passAppt.slotDate.replace(/-/g, '');
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//MediSlot AI//Clinical Scheduling//EN',
        'BEGIN:VEVENT',
        `UID:${passAppt.referenceCode}@medislot.ai`,
        `DTSTART:${cleanDate}T090000`,
        `DTEND:${cleanDate}T093000`,
        `SUMMARY:${passAppt.specialistName || 'Specialist'} (${passAppt.visitType})`,
        `DESCRIPTION:Ref ${passAppt.referenceCode} - ${passAppt.reason}`,
        `LOCATION:${passAppt.clinicLocation || 'MediSlot Clinic'}`,
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${passAppt.referenceCode}.ics`;
      link.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="clinical-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <p className="text-xs font-semibold text-[#0D7A73] mb-1">
                Digital Appointment Pass
              </p>
              <h2 className="font-display text-2xl font-bold text-[#0F2942]">
                {passAppt.specialistName}
              </h2>
              <p className="text-sm text-slate-600">
                {passAppt.specialty} · {passAppt.clinicLocation}
              </p>
            </div>
            <StatusTag status={passAppt.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            <div className="sm:col-span-2 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Reference Code</p>
                <p className="font-mono font-semibold text-[#0F2942] tabular-nums mt-0.5">
                  {passAppt.referenceCode}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Visit Mode</p>
                <p className="font-semibold text-[#0F2942] mt-0.5">{passAppt.visitType}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="font-mono font-semibold text-[#0F2942] tabular-nums mt-0.5">
                  {passAppt.slotDate}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Time</p>
                <p className="font-mono font-semibold text-[#0D7A73] tabular-nums mt-0.5">
                  {passAppt.slotTime}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500">Reason for Consultation</p>
                <p className="text-slate-700 mt-0.5">{passAppt.reason}</p>
              </div>
            </div>

            {/* Clean deterministic SVG Check-in Matrix */}
            <div className="p-4 rounded-xl bg-[#F6FAFF] border border-slate-200 flex flex-col items-center justify-center">
              <svg
                viewBox="0 0 80 80"
                className="w-24 h-24 text-[#0F2942]"
                aria-label="Kiosk Check-in Code"
              >
                <rect x="4" y="4" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="4" />
                <rect x="10" y="10" width="10" height="10" fill="currentColor" />
                <rect x="54" y="4" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="4" />
                <rect x="60" y="10" width="10" height="10" fill="currentColor" />
                <rect x="4" y="54" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="4" />
                <rect x="10" y="60" width="10" height="10" fill="currentColor" />
                <rect x="34" y="12" width="10" height="10" fill="#0D7A73" />
                <rect x="34" y="34" width="14" height="14" fill="currentColor" />
                <rect x="56" y="36" width="12" height="8" fill="#0D7A73" />
                <rect x="36" y="56" width="12" height="14" fill="currentColor" />
                <rect x="58" y="58" width="14" height="14" fill="#0D7A73" />
              </svg>
              <span className="font-mono text-[11px] text-slate-500 mt-2">
                Scan at Pavilion Kiosk
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#EDF4FC] border border-[#D1E4FF]">
            <p className="text-xs font-semibold text-[#0F2942] mb-1">
              Pre-Visit Clinical Preparation
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">
              {passAppt.prepNotes ||
                'Arrive 10 minutes before your slot with valid photo ID, insurance card, and updated medication list.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleDownloadIcs}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#0F2942] text-xs font-semibold"
            >
              <Download className="w-4 h-4 text-[#0D7A73]" />
              <span>Add to Calendar (.ics)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('telehealth')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0D7A73] hover:bg-[#0A6C74] text-white text-xs font-semibold"
            >
              <Video className="w-4 h-4" />
              <span>Open Telehealth Room</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('appointments')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#0F2942] text-xs font-semibold"
            >
              <Calendar className="w-4 h-4" />
              <span>Manage Appointments</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 7: MY APPOINTMENTS & RESCHEDULE
  if (activeScreen === 'appointments') {
    if (!user) {
      return (
        <AuthGateCard
          title="Sign in to manage your appointments"
          description="View upcoming consultations, reschedule open slots in real time, or cancel appointments."
        />
      );
    }

    const filteredAppts = appointments.filter((a) => {
      const tabMatch =
        apptTab === 'Upcoming'
          ? a.status === 'Confirmed'
          : apptTab === 'Past'
          ? a.status === 'Completed'
          : a.status === 'Cancelled';
      const q = apptSearch.trim().toLowerCase();
      const queryMatch =
        !q ||
        (a.specialistName || '').toLowerCase().includes(q) ||
        a.referenceCode.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q);
      return tabMatch && queryMatch;
    });

    const handleCancelAppointment = async (id: number) => {
      setApptActionMsg(null);
      const res = await authFetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Cancelled', checkInStatus: 'Cancelled' }),
      });
      if (res.ok) {
        await onRefreshAll();
        setApptActionMsg('Appointment cancelled and slot released back to the clinic.');
      }
    };

    const handleRescheduleSubmit = async (appt: Appointment) => {
      if (!rescheduleDate || !rescheduleTime) return;
      const res = await authFetch(`/api/appointments/${appt.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          slotDate: rescheduleDate,
          slotTime: rescheduleTime,
        }),
      });
      if (res.ok) {
        setRescheduleId(null);
        await onRefreshAll();
        setApptActionMsg(
          `Rescheduled ${appt.referenceCode} to ${rescheduleDate} at ${rescheduleTime}.`
        );
      }
    };

    return (
      <div className="space-y-6">
        <div className="clinical-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-[#EDF4FC] rounded-lg">
            {(['Upcoming', 'Past', 'Cancelled'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setApptTab(tab)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  apptTab === tab
                    ? 'bg-white text-[#0D7A73] shadow-xs'
                    : 'text-slate-600 hover:text-[#0F2942]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={apptSearch}
              onChange={(e) => setApptSearch(e.target.value)}
              placeholder="Search reference or doctor..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 text-sm text-[#0F2942] focus:outline-none focus:border-[#0D7A73]"
            />
          </div>
        </div>

        {apptActionMsg && (
          <div className="p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-semibold text-[#047857]">
            {apptActionMsg}
          </div>
        )}

        {filteredAppts.length === 0 ? (
          <div className="clinical-card rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm text-slate-600">
              No {apptTab.toLowerCase()} appointments found.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('booking')}
              className="px-4 py-2 rounded-lg bg-[#0D7A73] text-white text-xs font-semibold hover:bg-[#0A6C74]"
            >
              Book Consultation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppts.map((appt) => {
              const openSlotsForDoc = slots.filter(
                (s) => s.specialistId === appt.specialistId && !s.isBooked && !s.isBlocked
              );
              const isRescheduling = rescheduleId === appt.id;

              return (
                <div key={appt.id} className="clinical-card rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-display font-semibold text-base text-[#0F2942]">
                          {appt.specialistName}
                        </h3>
                        <StatusTag status={appt.status} />
                      </div>
                      <p className="text-xs text-slate-500">
                        {appt.specialty} · {appt.visitType} · {appt.clinicLocation}
                      </p>
                      <p className="font-mono text-xs text-[#0F2942] tabular-nums">
                        {appt.slotDate} at {appt.slotTime} · Ref {appt.referenceCode}
                      </p>
                      <p className="text-xs text-slate-600">{appt.reason}</p>
                    </div>

                    {appt.status === 'Confirmed' && (
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setRescheduleId(isRescheduling ? null : appt.id);
                            setRescheduleDate(openSlotsForDoc[0]?.slotDate || appt.slotDate);
                            setRescheduleTime(openSlotsForDoc[0]?.slotTime || '');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F2942]"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-[#0D7A73]" />
                          <span>Reschedule</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleCancelAppointment(appt.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#FECDD3] bg-[#FFF1F2] hover:bg-[#FFE4E6] text-xs font-semibold text-[#BE123C]"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {isRescheduling && (
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                          Select Open Slot
                        </label>
                        <select
                          value={`${rescheduleDate}__${rescheduleTime}`}
                          onChange={(e) => {
                            const [d, t] = e.target.value.split('__');
                            setRescheduleDate(d);
                            setRescheduleTime(t);
                          }}
                          className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs font-mono text-[#0F2942]"
                        >
                          {openSlotsForDoc.slice(0, 12).map((s) => (
                            <option key={s.id} value={`${s.slotDate}__${s.slotTime}`}>
                              {s.slotDate} · {s.slotTime}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRescheduleSubmit(appt)}
                        className="px-4 py-2.5 rounded-lg bg-[#0D7A73] text-white text-xs font-semibold hover:bg-[#0A6C74]"
                      >
                        Save New Time
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // SCREEN 8: TELEHEALTH CONSULTATION WAITING ROOM
  if (!user) {
    return (
      <AuthGateCard
        title="Sign in for Telehealth Waiting Room"
        description="Verify your camera and microphone readiness and submit pre-visit vitals before your video consultation."
      />
    );
  }

  const upcomingTele = appointments.filter((a) => a.status === 'Confirmed');
  const activeVisit =
    upcomingTele.find((a) => a.id === selectedTeleId) || upcomingTele[0] || null;

  const handleRunMediaCheck = async () => {
    setMediaStatus('checking');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaStatus('fallback');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMediaStatus('ready');
    } catch {
      setMediaStatus('fallback');
    }
  };

  const handleSaveVitalsPrecheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVisit || !vitalsNote.trim()) return;
    setVitalsSavedMsg(null);
    const res = await authFetch(`/api/appointments/${activeVisit.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ vitalsPrecheck: vitalsNote.trim() }),
    });
    if (res.ok) {
      await onRefreshAll();
      setVitalsSavedMsg('Pre-visit vitals and symptom update sent to physician.');
      setVitalsNote('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 clinical-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#0F2942]">
              Video Consultation Readiness
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Test camera, microphone, and connection quality prior to clinician entry
            </p>
          </div>
          <StatusTag
            status={
              mediaStatus === 'ready'
                ? 'Hardware Verified'
                : mediaStatus === 'fallback'
                ? 'Audio Fallback Ready'
                : 'Ready to Check'
            }
          />
        </div>

        <div className="aspect-video rounded-xl bg-[#0F2942] overflow-hidden relative flex items-center justify-center border border-slate-200">
          {mediaStatus === 'ready' ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center px-6 space-y-2 text-white">
              <Video className="w-10 h-10 mx-auto text-[#7DD6CD]" />
              <p className="font-display font-semibold text-base">
                {mediaStatus === 'fallback'
                  ? 'Browser camera permission blocked — audio/chat consult ready'
                  : 'Click "Run Hardware Check" to preview camera and mic'}
              </p>
              <p className="text-xs text-slate-300">
                Encrypted peer session opens automatically 5 minutes before appointment time
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleRunMediaCheck()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0D7A73] hover:bg-[#0A6C74] text-white text-xs font-semibold"
          >
            <Camera className="w-4 h-4" />
            <span>Run Hardware Check</span>
          </button>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <Mic className="w-3.5 h-3.5 text-[#0D7A73]" />
            <span>Echo cancellation active</span>
          </span>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-6">
        <div className="clinical-card rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-lg font-semibold text-[#0F2942]">
            Active Consultation Queue
          </h3>

          {upcomingTele.length === 0 ? (
            <p className="text-sm text-slate-600">
              No confirmed appointments in your queue. Book a slot to enter the waiting room.
            </p>
          ) : (
            <>
              <select
                value={activeVisit?.id || ''}
                onChange={(e) => setSelectedTeleId(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#0F2942]"
              >
                {upcomingTele.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.specialistName} · {a.slotDate} {a.slotTime} ({a.visitType})
                  </option>
                ))}
              </select>

              {activeVisit && (
                <div className="p-4 rounded-xl bg-[#F6FAFF] border border-slate-200 space-y-1.5 text-xs">
                  <p className="font-semibold text-[#0F2942] text-sm">
                    {activeVisit.specialistName}
                  </p>
                  <p className="text-slate-600">
                    {activeVisit.specialty} · Ref {activeVisit.referenceCode}
                  </p>
                  <p className="font-mono tabular-nums text-[#0D7A73]">
                    Scheduled: {activeVisit.slotDate} at {activeVisit.slotTime}
                  </p>
                  {activeVisit.vitalsPrecheck && (
                    <p className="pt-2 text-slate-700 border-t border-slate-200 mt-2">
                      Logged vitals: {activeVisit.vitalsPrecheck}
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={handleSaveVitalsPrecheck} className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-[#0F2942]">
                  Pre-Visit Vitals / Temperature / BP Note
                </label>
                <textarea
                  rows={3}
                  value={vitalsNote}
                  onChange={(e) => setVitalsNote(e.target.value)}
                  placeholder="Example: BP 118/76 mmHg, temp 98.4 F, resting HR 68 bpm."
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm text-[#0F2942] focus:outline-none focus:border-[#0D7A73]"
                />
                {vitalsSavedMsg && (
                  <p className="text-xs text-[#047857] flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{vitalsSavedMsg}</span>
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-[#0F2942] hover:bg-[#1E3A5F] text-white text-xs font-semibold transition-colors"
                >
                  Send Vitals to Clinician
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
