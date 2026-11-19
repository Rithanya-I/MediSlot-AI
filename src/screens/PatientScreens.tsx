import { useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  MapPin,
  Search,
  Sparkles,
  Stethoscope,
  Video,
} from 'lucide-react';
import { ClinicImage } from '../components/ClinicImage';
import { AuthGateCard, StatusTag } from '../components/ClinicalUI';
import { useAuth } from '../context/AuthContext';
import {
  Appointment,
  ClinicSlot,
  PredictiveMatchResult,
  ScreenId,
  Specialist,
  TriageRecord,
  TriageResult,
} from '../types/medislot';

interface PatientScreensProps {
  activeScreen: ScreenId;
  specialists: Specialist[];
  slots: ClinicSlot[];
  appointments: Appointment[];
  triageHistory: TriageRecord[];
  selectedSpecialistId: number;
  onSelectSpecialist: (id: number) => void;
  onNavigate: (screen: ScreenId) => void;
  onStartBooking: (params: {
    specialistId: number;
    slotDate?: string;
    slotTime?: string;
    visitType?: 'In-Person' | 'Telehealth';
    reason?: string;
    triageUrgency?: string;
  }) => void;
  onRefreshProtectedData: () => Promise<void>;
}

export function PatientScreens({
  activeScreen,
  specialists,
  slots,
  appointments,
  triageHistory,
  selectedSpecialistId,
  onSelectSpecialist,
  onNavigate,
  onStartBooking,
  onRefreshProtectedData,
}: PatientScreensProps) {
  const { user, authFetch } = useAuth();

  // Screen 1: Predictive slot matcher state
  const [matchPreference, setMatchPreference] = useState('Morning slot with minimal wait');
  const [matchSpecialty, setMatchSpecialty] = useState('All');
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<PredictiveMatchResult | null>(null);

  // Screen 2: AI Triage state
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('2–3 days');
  const [severity, setSeverity] = useState('Moderate');
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageError, setTriageError] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  // Screen 3: Specialist directory filters
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [telehealthOnly, setTelehealthOnly] = useState(false);

  const activeSpecialist =
    specialists.find((s) => s.id === selectedSpecialistId) || specialists[0];

  const openSlotsCount = slots.filter((s) => !s.isBooked && !s.isBlocked).length;
  const upcomingConfirmed = appointments.filter((a) => a.status === 'Confirmed');

  const handleRunPredictiveMatch = async () => {
    setMatchError(null);
    if (!user) {
      setMatchError('Please sign in with Google in the top bar to run live AI slot matching.');
      return;
    }
    setMatchLoading(true);
    try {
      const res = await authFetch('/api/ai/match-slot', {
        method: 'POST',
        body: JSON.stringify({
          preference: matchPreference,
          specialty: matchSpecialty,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not compute match.');
      setMatchResult(data.match);
    } catch (err: unknown) {
      setMatchError(err instanceof Error ? err.message : 'Matching failed.');
    } finally {
      setMatchLoading(false);
    }
  };

  const handleRunTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriageError(null);
    if (!symptoms.trim()) {
      setTriageError('Please enter your primary symptoms.');
      return;
    }
    setTriageLoading(true);
    try {
      const res = await authFetch('/api/ai/triage', {
        method: 'POST',
        body: JSON.stringify({ symptoms, duration, severity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Triage routing failed.');
      setTriageResult(data.triage);
      await onRefreshProtectedData();
    } catch (err: unknown) {
      setTriageError(err instanceof Error ? err.message : 'Triage failed.');
    } finally {
      setTriageLoading(false);
    }
  };

  // SCREEN 1: OVERVIEW
  if (activeScreen === 'overview') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 clinical-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-[#0D7A73] tracking-wide mb-2">
                Clinical Scheduling Hub
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F2942] tracking-tight text-balance mb-3">
                Precision specialist scheduling without the waiting room friction
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mb-6">
                Route symptoms with AI triage, compare real-time physician openings across six clinical departments, and confirm in-person or telehealth visits directly.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('booking')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0D7A73] hover:bg-[#0A6C74] text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <span>Open Slot Matrix</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('triage')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#0F2942] text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-[#0D7A73]" />
                <span>Start AI Symptom Triage</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-slate-200 min-h-[260px] bg-white">
            <ClinicImage
              src="/src/assets/images/hero_clinic_lobby_1795060876118.jpg"
              alt="MediSlot AI sunlit modern clinical atrium and reception"
              fallbackLabel="MediSlot Atrium"
              className="w-full h-full object-cover min-h-[260px]"
            />
          </div>
        </div>

        {/* Full-width 4-column summary strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="clinical-card rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">Active Specialists</p>
            <p className="font-display text-2xl font-bold text-[#0F2942] tabular-nums">
              {specialists.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Across 6 departments</p>
          </div>
          <div className="clinical-card rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">Open Slots (7 Days)</p>
            <p className="font-display text-2xl font-bold text-[#0D7A73] tabular-nums">
              {openSlotsCount}
            </p>
            <p className="text-xs text-slate-500 mt-1">In-person &amp; telehealth</p>
          </div>
          <div className="clinical-card rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">Upcoming Visits</p>
            <p className="font-display text-2xl font-bold text-[#0F2942] tabular-nums">
              {user ? upcomingConfirmed.length : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {user ? 'Confirmed in your schedule' : 'Sign in to view visits'}
            </p>
          </div>
          <div className="clinical-card rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-500 mb-1">Median Check-In Wait</p>
            <p className="font-display text-2xl font-bold text-[#0F2942] tabular-nums">
              6 min
            </p>
            <p className="text-xs text-slate-500 mt-1">Digital intake pre-verified</p>
          </div>
        </div>

        {/* Predictive Slot Matcher + Next Visit Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl bg-white border border-[#38BDF8] p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-[#0F2942]">
                  Predictive Slot Matcher
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Matches open physician capacity against your schedule preference
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-[#0D7A73] shrink-0" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Schedule Preference
                </label>
                <input
                  type="text"
                  value={matchPreference}
                  onChange={(e) => setMatchPreference(e.target.value)}
                  placeholder="e.g., Morning telehealth consultation"
                  className="w-full h-11 px-3 rounded-lg border border-slate-200 text-sm text-[#0F2942] focus:outline-none focus:border-[#0D7A73]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Department
                </label>
                <select
                  value={matchSpecialty}
                  onChange={(e) => setMatchSpecialty(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-slate-200 text-sm text-[#0F2942] bg-white focus:outline-none focus:border-[#0D7A73]"
                >
                  <option value="All">Any Department</option>
                  {Array.from(new Set(specialists.map((s) => s.specialty))).map((sp) => (
                    <option key={sp} value={sp}>
                      {sp}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunPredictiveMatch}
              disabled={matchLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0D7A73] hover:bg-[#0A6C74] disabled:opacity-60 text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>{matchLoading ? 'Matching Open Slots...' : 'Find Optimal Slot'}</span>
            </button>

            {matchError && (
              <p className="mt-3 text-xs text-[#BE123C] bg-[#FFF1F2] border border-[#FECDD3] rounded-lg px-3 py-2">
                {matchError}
              </p>
            )}

            {matchResult && (
              <div className="mt-4 p-4 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#0A6C74]">
                    {matchResult.headline}
                  </p>
                  <p className="font-display font-semibold text-[#0F2942] mt-0.5">
                    {matchResult.specialistName} · {matchResult.specialty}
                  </p>
                  <p className="font-mono text-xs text-slate-600 tabular-nums mt-1">
                    {matchResult.slotDate} · {matchResult.slotTime} · {matchResult.recommendedVisitType}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{matchResult.reason}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onStartBooking({
                      specialistId: matchResult.specialistId,
                      slotDate: matchResult.slotDate,
                      slotTime: matchResult.slotTime,
                      visitType: matchResult.recommendedVisitType,
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-[#0D7A73] hover:bg-[#0A6C74] text-white text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  Select This Slot
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 clinical-card rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold text-[#0F2942]">
                  Next Scheduled Visit
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigate('appointments')}
                  className="text-xs font-semibold text-[#0D7A73] hover:underline whitespace-nowrap"
                >
                  View All
                </button>
              </div>

              {!user ? (
                <p className="text-sm text-slate-600 leading-relaxed">
                  Sign in with your Google account to view confirmed upcoming consultations, telehealth links, and check-in readiness.
                </p>
              ) : upcomingConfirmed.length === 0 ? (
                <div className="py-4">
                  <p className="text-sm text-slate-600 mb-4">
                    No upcoming consultations scheduled yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('booking')}
                    className="px-4 py-2 rounded-lg bg-[#EDF4FC] text-[#0D7A73] text-xs font-semibold hover:bg-[#D1E4FF] transition-colors"
                  >
                    Book Your First Visit
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display font-semibold text-[#0F2942]">
                        {upcomingConfirmed[0].specialistName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {upcomingConfirmed[0].specialty} · {upcomingConfirmed[0].visitType}
                      </p>
                    </div>
                    <StatusTag status={upcomingConfirmed[0].status} />
                  </div>
                  <div className="font-mono text-xs text-slate-700 tabular-nums pt-2 border-t border-slate-100">
                    {upcomingConfirmed[0].slotDate} at {upcomingConfirmed[0].slotTime} · Ref{' '}
                    {upcomingConfirmed[0].referenceCode}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('confirmation')}
                      className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#0F2942] hover:bg-slate-50"
                    >
                      View Visit Pass
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('telehealth')}
                      className="px-3 py-2 rounded-lg bg-[#0D7A73] text-white text-xs font-semibold hover:bg-[#0A6C74]"
                    >
                      Telehealth Prep
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 2: AI SYMPTOM TRIAGE
  if (activeScreen === 'triage') {
    if (!user) {
      return (
        <AuthGateCard
          title="Sign in for AI Symptom Triage"
          description="Authenticate with Google to run AI-powered specialty routing and save your symptom intake notes securely to your patient record."
        />
      );
    }

    const recommendedDoc =
      specialists.find((s) => s.id === triageResult?.recommendedSpecialistId) ||
      specialists[0];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleRunTriage}
          className="lg:col-span-7 clinical-card rounded-2xl p-6 space-y-5"
        >
          <div>
            <h2 className="font-display text-xl font-semibold text-[#0F2942]">
              Clinical Symptom Triage &amp; Specialty Router
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Describe what you are experiencing. MediSlot AI recommends the right department, urgency tier, and preparation checklist. For medical emergencies, call emergency services immediately.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F2942] mb-1.5">
              Primary Symptoms &amp; Context
            </label>
            <textarea
              rows={4}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Example: Recurring throbbing headaches behind the right eye with mild light sensitivity over the past four days."
              className="w-full p-3 rounded-lg border border-slate-200 text-sm text-[#0F2942] focus:outline-none focus:border-[#0D7A73]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F2942] mb-1.5">
                Symptom Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#0F2942] focus:outline-none focus:border-[#0D7A73]"
              >
                <option>Less than 24 hours</option>
                <option>2–3 days</option>
                <option>1–2 weeks</option>
                <option>More than 1 month</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F2942] mb-1.5">
                Discomfort Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#0F2942] focus:outline-none focus:border-[#0D7A73]"
              >
                <option>Mild</option>
                <option>Moderate</option>
                <option>Severe</option>
              </select>
            </div>
          </div>

          {triageError && (
            <p className="text-xs text-[#BE123C] bg-[#FFF1F2] border border-[#FECDD3] rounded-lg px-3 py-2">
              {triageError}
            </p>
          )}

          <button
            type="submit"
            disabled={triageLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0D7A73] hover:bg-[#0A6C74] disabled:opacity-60 text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span>{triageLoading ? 'Analyzing Symptoms...' : 'Analyze & Match Specialist'}</span>
          </button>
        </form>

        <div className="lg:col-span-5 space-y-6">
          {triageResult && recommendedDoc ? (
            <div className="rounded-2xl bg-white border border-[#38BDF8] p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#0A6C74]">
                  Triage Recommendation
                </span>
                <StatusTag status={triageResult.urgencyLevel} />
              </div>

              <div>
                <h3 className="font-display text-lg font-bold text-[#0F2942]">
                  {triageResult.recommendedSpecialty}
                </h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  {triageResult.aiSummary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-[#0F2942] mb-2">
                  Pre-Visit Preparation
                </p>
                <ul className="space-y-1.5">
                  {triageResult.prepChecklist.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0D7A73] shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#0F2942]">
                    {recommendedDoc.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {recommendedDoc.clinicLocation}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onStartBooking({
                      specialistId: recommendedDoc.id,
                      reason: symptoms,
                      triageUrgency: triageResult.urgencyLevel,
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-[#0D7A73] hover:bg-[#0A6C74] text-white text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  Book Slot
                </button>
              </div>
            </div>
          ) : (
            <div className="clinical-card rounded-2xl p-6">
              <h3 className="font-display text-base font-semibold text-[#0F2942] mb-2">
                Recent Triage Log
              </h3>
              {triageHistory.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Submit symptoms on the left to generate a specialist match and prep checklist.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {triageHistory.slice(0, 4).map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-semibold text-[#0F2942]">
                          {item.recommendedSpecialty}
                        </span>
                        <StatusTag status={item.urgencyLevel} />
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{item.symptoms}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // SCREEN 3: SPECIALISTS DIRECTORY
  if (activeScreen === 'specialists') {
    const specialties = ['All', ...Array.from(new Set(specialists.map((s) => s.specialty)))];
    const filtered = specialists.filter((doc) => {
      const matchesSpec = specialtyFilter === 'All' || doc.specialty === specialtyFilter;
      const matchesTele = !telehealthOnly || doc.acceptsTelehealth;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q) ||
        doc.department.toLowerCase().includes(q);
      return matchesSpec && matchesTele && matchesQuery;
    });

    return (
      <div className="space-y-6">
        <div className="clinical-card rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search physician name or specialty..."
              className="w-full h-11 pl-9 pr-3 rounded-lg border border-slate-200 text-sm text-[#0F2942] focus:outline-none focus:border-[#0D7A73]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EDF4FC] rounded-lg">
              {specialties.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSpecialtyFilter(sp)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    specialtyFilter === sp
                      ? 'bg-white text-[#0D7A73] shadow-xs'
                      : 'text-slate-600 hover:text-[#0F2942]'
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setTelehealthOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
                telehealthOnly
                  ? 'bg-[#0D7A73] border-[#0D7A73] text-white'
                  : 'bg-white border-slate-200 text-[#0F2942] hover:bg-slate-50'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Telehealth Eligible</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((doc) => {
            const docOpenSlots = slots.filter(
              (s) => s.specialistId === doc.id && !s.isBooked && !s.isBlocked
            );
            const nextSlot = docOpenSlots[0];

            return (
              <div
                key={doc.id}
                className="clinical-card clinical-card-hover rounded-2xl p-6 flex flex-col justify-between gap-5"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <ClinicImage
                      src={doc.avatarUrl}
                      alt={`${doc.name}, ${doc.specialty}`}
                      fallbackLabel={doc.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-base text-[#0F2942] truncate">
                        {doc.name}
                      </h3>
                      <p className="text-xs font-semibold text-[#0D7A73] mt-0.5">
                        {doc.specialty}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {doc.credentials} · {doc.yearsExperience} yrs exp · {doc.consultationMinutes} min
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {doc.bio}
                  </p>

                  <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{doc.clinicLocation}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono tabular-nums">
                      <CalendarClock className="w-3.5 h-3.5 text-[#0D7A73] shrink-0" />
                      <span>
                        {nextSlot
                          ? `Next opening: ${nextSlot.slotDate} at ${nextSlot.slotTime}`
                          : 'No openings this week'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSpecialist(doc.id);
                      onNavigate('provider-detail');
                    }}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#0F2942] text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    View Profile
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onStartBooking({
                        specialistId: doc.id,
                        slotDate: nextSlot?.slotDate,
                        slotTime: nextSlot?.slotTime,
                      })
                    }
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0D7A73] hover:bg-[#0A6C74] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    Book Consultation
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // SCREEN 4: PROVIDER PROFILE & CREDENTIALS
  if (!activeSpecialist) {
    return null;
  }

  const docSlots = slots
    .filter((s) => s.specialistId === activeSpecialist.id && !s.isBooked && !s.isBlocked)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {specialists.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelectSpecialist(s.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
              s.id === activeSpecialist.id
                ? 'bg-[#0F2942] border-[#0F2942] text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:text-[#0F2942]'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 clinical-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-4">
            <ClinicImage
              src={activeSpecialist.avatarUrl}
              alt={activeSpecialist.name}
              fallbackLabel={activeSpecialist.name}
              className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0"
            />
            <div>
              <h2 className="font-display text-xl font-bold text-[#0F2942]">
                {activeSpecialist.name}
              </h2>
              <p className="text-sm font-semibold text-[#0D7A73]">
                {activeSpecialist.specialty}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {activeSpecialist.credentials} · Rating {activeSpecialist.rating}/5.0
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 text-sm">
            <div>
              <span className="block text-xs font-medium text-slate-500">Department</span>
              <span className="font-medium text-[#0F2942]">
                {activeSpecialist.department}
              </span>
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-500">Location</span>
              <span className="font-medium text-[#0F2942]">
                {activeSpecialist.clinicLocation}
              </span>
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-500">Languages</span>
              <span className="font-medium text-[#0F2942]">
                {activeSpecialist.languages}
              </span>
            </div>
            <div>
              <span className="block text-xs font-medium text-slate-500">
                Telehealth Support
              </span>
              <span className="font-medium text-[#0F2942]">
                {activeSpecialist.acceptsTelehealth
                  ? 'Available for video consultations'
                  : 'In-person clinic visits only'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onStartBooking({ specialistId: activeSpecialist.id })}
            className="w-full py-2.5 px-4 rounded-lg bg-[#0D7A73] hover:bg-[#0A6C74] text-white text-sm font-semibold transition-colors"
          >
            Schedule With {activeSpecialist.name.split(' ').slice(-1)[0]}
          </button>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="clinical-card rounded-2xl p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold text-[#0F2942]">
              Clinical Biography &amp; Credentials
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {activeSpecialist.bio}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Education &amp; Training
                </p>
                <p className="text-[#0F2942] font-medium">{activeSpecialist.education}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Accepted Insurance Networks
                </p>
                <p className="text-[#0F2942] font-medium">
                  {activeSpecialist.insurancesAccepted}
                </p>
              </div>
            </div>
          </div>

          <div className="clinical-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-[#0F2942]">
                  Earliest Available Time Slots
                </h3>
                <p className="text-xs text-slate-500">
                  Select a time chip to jump directly to booking confirmation
                </p>
              </div>
              <Stethoscope className="w-5 h-5 text-[#0D7A73]" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {docSlots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() =>
                    onStartBooking({
                      specialistId: activeSpecialist.id,
                      slotDate: slot.slotDate,
                      slotTime: slot.slotTime,
                    })
                  }
                  className={`relative text-left p-3 rounded-lg border transition-colors ${
                    slot.isAiRecommended
                      ? 'bg-[#F0F7FF] border-[#38BDF8] text-[#0A6C74]'
                      : 'bg-white border-slate-200 text-[#0F2942] hover:border-[#0D7A73]'
                  }`}
                >
                  {slot.isAiRecommended && (
                    <span className="block text-[10px] font-semibold text-[#0A6C74] mb-0.5">
                      AI Optimal
                    </span>
                  )}
                  <span className="block font-mono text-xs font-semibold tabular-nums">
                    {slot.slotTime}
                  </span>
                  <span className="block font-mono text-[11px] text-slate-500 tabular-nums mt-0.5">
                    {slot.slotDate}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
