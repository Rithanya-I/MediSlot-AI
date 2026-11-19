import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Send,
  ShieldCheck,
  Unlock,
} from 'lucide-react';
import { AuthGateCard, StatusTag } from '../components/ClinicalUI';
import { useAuth } from '../context/AuthContext';
import {
  CareMessage,
  ClinicOpsData,
  ClinicSlot,
  PatientProfile,
  ScreenId,
  Specialist,
} from '../types/medislot';

interface ProfileAndClinicScreensProps {
  activeScreen: ScreenId;
  profile: PatientProfile | null;
  messages: CareMessage[];
  specialists: Specialist[];
  slots: ClinicSlot[];
  clinicOps: ClinicOpsData | null;
  onRefreshAll: () => Promise<void>;
}

export function ProfileAndClinicScreens({
  activeScreen,
  profile,
  messages,
  specialists,
  slots,
  clinicOps,
  onRefreshAll,
}: ProfileAndClinicScreensProps) {
  const { user, authFetch } = useAuth();

  // Screen 9 & 10 form state
  const [formState, setFormState] = useState({
    fullName: '',
    dateOfBirth: '',
    phone: '',
    bloodType: 'O+',
    allergies: '',
    medications: '',
    conditions: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    insuranceCarrier: 'BlueCross BlueShield',
    insurancePlan: 'PPO Gold Select',
    memberId: '',
    groupNumber: '',
    copayAmount: '$25',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);

  // Screen 10 estimator state
  const [estimatorVisitType, setEstimatorVisitType] = useState<
    'Specialist In-Person' | 'Telehealth Video' | 'Diagnostic Lab Panel'
  >('Specialist In-Person');

  // Screen 11 messages state
  const [msgInput, setMsgInput] = useState('');
  const [msgSending, setMsgSending] = useState(false);

  // Screen 12 clinic schedule state
  const [opsSpecId, setOpsSpecId] = useState<number>(1);
  const [opsDate, setOpsDate] = useState<string>('');

  useEffect(() => {
    if (profile) {
      setFormState({
        fullName: profile.fullName || '',
        dateOfBirth: profile.dateOfBirth || '',
        phone: profile.phone || '',
        bloodType: profile.bloodType || 'O+',
        allergies: profile.allergies || '',
        medications: profile.medications || '',
        conditions: profile.conditions || '',
        emergencyContactName: profile.emergencyContactName || '',
        emergencyContactPhone: profile.emergencyContactPhone || '',
        insuranceCarrier: profile.insuranceCarrier || 'BlueCross BlueShield',
        insurancePlan: profile.insurancePlan || 'PPO Gold Select',
        memberId: profile.memberId || '',
        groupNumber: profile.groupNumber || '',
        copayAmount: profile.copayAmount || '$25',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (specialists.length > 0 && !specialists.some((s) => s.id === opsSpecId)) {
      setOpsSpecId(specialists[0].id);
    }
    if (slots.length > 0 && !opsDate) {
      setOpsDate(slots[0].slotDate);
    }
  }, [specialists, slots, opsSpecId, opsDate]);

  if (!user) {
    return (
      <AuthGateCard
        title="Sign in to access Clinical Records & Operations"
        description="Authenticate with Google to update your medical intake, verify insurance coverage, message the care desk, or manage clinic capacity."
      />
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSavedMsg(null);
    try {
      const res = await authFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...formState,
          coverageStatus: 'Verified',
        }),
      });
      if (res.ok) {
        await onRefreshAll();
        setProfileSavedMsg('Saved securely to your Cloud SQL medical record.');
      }
    } finally {
      setProfileSaving(false);
    }
  };

  // SCREEN 9: CLINICAL INTAKE & MEDICAL PROFILE
  if (activeScreen === 'intake') {
    return (
      <form
        onSubmit={handleSaveProfile}
        className="max-w-4xl clinical-card rounded-2xl p-6 sm:p-8 space-y-6"
      >
        <div className="border-b border-slate-100 pb-4">
          <h2 className="font-display text-xl font-semibold text-[#0F2942]">
            Patient Medical Intake &amp; Clinical Summary
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Pre-completed intake eliminates front-desk clipboards and lowers check-in wait times.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F2942] mb-1">
              Legal Full Name
            </label>
            <input
              type="text"
              value={formState.fullName}
              onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
              className="w-full h-11 px-3 rounded-lg border border-slate-200 text-sm text-[#0F2942]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0F2942] mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={formState.dateOfBirth}
              onChange={(e) => setFormState({ ...formState, dateOfBirth: e.target.value })}
              className="w-full h-11 px-3 rounded-lg border border-slate-200 font-mono text-sm text-[#0F2942]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0F2942] mb-1">
              Blood Group
            </label>
            <select
              value={formState.bloodType}
              onChange={(e) => setFormState({ ...formState, bloodType: e.target.value })}
              className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#0F2942]"
            >
              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0F2942] mb-1">
              Mobile Phone
            </label>
            <input
              type="text"
              value={formState.phone}
              onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
              className="w-full h-11 px-3 rounded-lg border border-slate-200 font-mono text-sm text-[#0F2942]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0F2942] mb-1">
              Emergency Contact Name
            </label>
            <input
              type="text"
              value={formState.emergencyContactName}
              onChange={(e) =>
                setFormState({ ...formState, emergencyContactName: e.target.value })
              }
              placeholder="e.g., Jordan Patel"
              className="w-full h-11 px-3 rounded-lg border border-slate-200 text-sm text-[#0F2942]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0F2942] mb-1">
              Emergency Contact Phone
            </label>
            <input
              type="text"
              value={formState.emergencyContactPhone}
              onChange={(e) =>
                setFormState({ ...formState, emergencyContactPhone: e.target.value })
              }
              placeholder="+1 (415) 555-0148"
              className="w-full h-11 px-3 rounded-lg border border-slate-200 font-mono text-sm text-[#0F2942]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F2942] mb-1">
              Known Allergies
            </label>
            <textarea
              rows={3}
              value={formState.allergies}
              onChange={(e) => setFormState({ ...formState, allergies: e.target.value })}
              className="w-full p-3 rounded-lg border border-slate-200 text-sm text-[#0F2942]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0F2942] mb-1">
              Current Medications
            </label>
            <textarea
              rows={3}
              value={formState.medications}
              onChange={(e) => setFormState({ ...formState, medications: e.target.value })}
              className="w-full p-3 rounded-lg border border-slate-200 text-sm text-[#0F2942]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0F2942] mb-1">
              Existing Conditions
            </label>
            <textarea
              rows={3}
              value={formState.conditions}
              onChange={(e) => setFormState({ ...formState, conditions: e.target.value })}
              className="w-full p-3 rounded-lg border border-slate-200 text-sm text-[#0F2942]"
            />
          </div>
        </div>

        {profileSavedMsg && (
          <p className="text-xs font-semibold text-[#047857] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{profileSavedMsg}</span>
          </p>
        )}

        <button
          type="submit"
          disabled={profileSaving}
          className="px-6 py-2.5 rounded-lg bg-[#0D7A73] hover:bg-[#0A6C74] text-white text-sm font-semibold transition-colors"
        >
          {profileSaving ? 'Saving Medical Intake...' : 'Save Medical Profile'}
        </button>
      </form>
    );
  }

  // SCREEN 10: INSURANCE & COVERAGE VERIFICATION
  if (activeScreen === 'insurance') {
    const estimatedCopay =
      estimatorVisitType === 'Telehealth Video'
        ? '$15'
        : estimatorVisitType === 'Specialist In-Person'
        ? formState.copayAmount || '$25'
        : '$40';

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-7 clinical-card rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#0F2942]">
                Insurance Policy &amp; Eligibility
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified network details apply automatically at booking
              </p>
            </div>
            <StatusTag status={profile?.coverageStatus || 'Verified'} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                Insurance Carrier
              </label>
              <select
                value={formState.insuranceCarrier}
                onChange={(e) =>
                  setFormState({ ...formState, insuranceCarrier: e.target.value })
                }
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-sm text-[#0F2942]"
              >
                <option>BlueCross BlueShield</option>
                <option>Aetna</option>
                <option>UnitedHealthcare</option>
                <option>Cigna</option>
                <option>Medicare</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                Plan Tier
              </label>
              <input
                type="text"
                value={formState.insurancePlan}
                onChange={(e) =>
                  setFormState({ ...formState, insurancePlan: e.target.value })
                }
                className="w-full h-11 px-3 rounded-lg border border-slate-200 text-sm text-[#0F2942]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                Member ID
              </label>
              <input
                type="text"
                value={formState.memberId}
                onChange={(e) => setFormState({ ...formState, memberId: e.target.value })}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 font-mono text-sm text-[#0F2942]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0F2942] mb-1">
                Group Number
              </label>
              <input
                type="text"
                value={formState.groupNumber}
                onChange={(e) =>
                  setFormState({ ...formState, groupNumber: e.target.value })
                }
                className="w-full h-11 px-3 rounded-lg border border-slate-200 font-mono text-sm text-[#0F2942]"
              />
            </div>
          </div>

          {profileSavedMsg && (
            <p className="text-xs font-semibold text-[#047857]">{profileSavedMsg}</p>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            className="px-5 py-2.5 rounded-lg bg-[#0D7A73] hover:bg-[#0A6C74] text-white text-sm font-semibold"
          >
            {profileSaving ? 'Updating Coverage...' : 'Verify & Save Policy'}
          </button>
        </form>

        <div className="lg:col-span-5 clinical-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0D7A73]" />
            <h3 className="font-display text-lg font-semibold text-[#0F2942]">
              Out-of-Pocket Co-Pay Estimator
            </h3>
          </div>

          <div className="space-y-2">
            {(
              [
                'Specialist In-Person',
                'Telehealth Video',
                'Diagnostic Lab Panel',
              ] as const
            ).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setEstimatorVisitType(option)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                  estimatorVisitType === option
                    ? 'bg-[#EDF4FC] border-[#0D7A73] text-[#0F2942]'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-[#F6FAFF] border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Estimated Patient Co-Pay</p>
              <p className="text-xs text-slate-600 mt-0.5">{formState.insuranceCarrier}</p>
            </div>
            <span className="font-display text-2xl font-bold text-[#0D7A73] tabular-nums">
              {estimatedCopay}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 11: CARE MESSAGES & FOLLOW-UP
  if (activeScreen === 'messages') {
    const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!msgInput.trim()) return;
      setMsgSending(true);
      try {
        const res = await authFetch('/api/messages', {
          method: 'POST',
          body: JSON.stringify({ body: msgInput.trim() }),
        });
        if (res.ok) {
          setMsgInput('');
          await onRefreshAll();
        }
      } finally {
        setMsgSending(false);
      }
    };

    return (
      <div className="max-w-4xl clinical-card rounded-2xl overflow-hidden flex flex-col h-[640px]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0F2942]">
              MediSlot Care Coordination Desk
            </h2>
            <p className="text-xs text-slate-500">
              Ask about visit preparation, lab orders, or rescheduling logistics
            </p>
          </div>
          <StatusTag status="Care Desk Active" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F6FAFF]">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-500">
              Send a message below to start a thread with your MediSlot care coordinator.
            </div>
          ) : (
            messages.map((m) => {
              const isPatient = m.senderRole === 'patient';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[11px] font-medium text-slate-500 mb-1">
                    {m.senderName}
                  </span>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isPatient
                        ? 'bg-[#0D7A73] text-white'
                        : 'bg-white border border-slate-200 text-[#0F2942]'
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-white border-t border-slate-200 flex items-center gap-3"
        >
          <input
            type="text"
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            placeholder="Write a message to your clinic coordinator..."
            className="flex-1 h-11 px-4 rounded-lg border border-slate-200 text-sm text-[#0F2942] focus:outline-none focus:border-[#0D7A73]"
          />
          <button
            type="submit"
            disabled={msgSending}
            className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-[#0D7A73] hover:bg-[#0A6C74] disabled:opacity-60 text-white text-sm font-semibold whitespace-nowrap"
          >
            <Send className="w-4 h-4" />
            <span>{msgSending ? 'Sending...' : 'Send'}</span>
          </button>
        </form>
      </div>
    );
  }

  // SCREEN 12: CLINIC PROVIDER SCHEDULE & CAPACITY
  if (activeScreen === 'clinic-schedule') {
    const dates = Array.from(new Set(slots.map((s) => s.slotDate))).sort();
    const activeDate = opsDate || dates[0] || '';
    const daySlots = slots.filter(
      (s) => s.specialistId === opsSpecId && s.slotDate === activeDate
    );

    const handleToggleSlot = async (slotId: number) => {
      const res = await authFetch(`/api/clinic/slots/${slotId}/toggle`, {
        method: 'PATCH',
      });
      if (res.ok) {
        await onRefreshAll();
      }
    };

    const handleAdvanceCheckIn = async (
      apptId: number,
      nextCheckIn: string,
      nextStatus?: string
    ) => {
      const res = await authFetch(`/api/clinic/appointments/${apptId}/checkin`, {
        method: 'PATCH',
        body: JSON.stringify({ checkInStatus: nextCheckIn, status: nextStatus }),
      });
      if (res.ok) {
        await onRefreshAll();
      }
    };

    return (
      <div className="space-y-6">
        <div className="clinical-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={opsSpecId}
              onChange={(e) => setOpsSpecId(Number(e.target.value))}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm font-medium text-[#0F2942]"
            >
              {specialists.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.specialty})
                </option>
              ))}
            </select>
            <select
              value={activeDate}
              onChange={(e) => setOpsDate(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white font-mono text-sm text-[#0F2942]"
            >
              {dates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500">
            Click any open/blocked slot to lock or release provider capacity
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {daySlots.map((slot) => (
            <button
              key={slot.id}
              type="button"
              disabled={slot.isBooked}
              onClick={() => void handleToggleSlot(slot.id)}
              className={`p-4 rounded-xl border text-left transition-colors ${
                slot.isBooked
                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857] cursor-default'
                  : slot.isBlocked
                  ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]'
                  : 'bg-white border-slate-200 text-[#0F2942] hover:border-[#0D7A73]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {slot.slotTime}
                </span>
                {!slot.isBooked &&
                  (slot.isBlocked ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-[#0D7A73]" />
                  ))}
              </div>
              <span className="block text-xs mt-1 font-medium">
                {slot.isBooked
                  ? 'Booked Visit'
                  : slot.isBlocked
                  ? 'Blocked (Click to Open)'
                  : 'Open (Click to Block)'}
              </span>
            </button>
          ))}
        </div>

        <div className="clinical-card rounded-2xl p-6">
          <h3 className="font-display text-lg font-semibold text-[#0F2942] mb-4">
            Patient Check-In Queue
          </h3>
          {!clinicOps || clinicOps.appointments.length === 0 ? (
            <p className="text-sm text-slate-500">No patient visits logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-2.5 pr-4 font-semibold">Ref</th>
                    <th className="py-2.5 pr-4 font-semibold">Specialist</th>
                    <th className="py-2.5 pr-4 font-semibold">Slot</th>
                    <th className="py-2.5 pr-4 font-semibold">Check-In</th>
                    <th className="py-2.5 font-semibold text-right">Workflow Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clinicOps.appointments.slice(0, 10).map((row) => (
                    <tr key={row.id} className="h-11">
                      <td className="py-2.5 pr-4 font-mono text-xs tabular-nums">
                        {row.referenceCode}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-[#0F2942]">
                        {row.specialistName}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs tabular-nums text-slate-600">
                        {row.slotDate} {row.slotTime}
                      </td>
                      <td className="py-2.5 pr-4">
                        <StatusTag status={row.checkInStatus} />
                      </td>
                      <td className="py-2.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => void handleAdvanceCheckIn(row.id, 'Checked In')}
                          className="px-2.5 py-1 rounded border border-slate-200 text-xs font-semibold text-[#0F2942] hover:bg-slate-50"
                        >
                          Check In
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void handleAdvanceCheckIn(row.id, 'Completed', 'Completed')
                          }
                          className="px-2.5 py-1 rounded bg-[#0D7A73] text-white text-xs font-semibold hover:bg-[#0A6C74]"
                        >
                          Complete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // SCREEN 13: CLINIC OPERATIONS & ANALYTICS
  const totalSlots = clinicOps?.totalSlots ?? slots.length;
  const blockedCount = clinicOps?.blockedSlots ?? slots.filter((s) => s.isBlocked).length;
  const bookedCount =
    clinicOps?.appointments.filter((a) => a.status !== 'Cancelled').length ?? 0;
  const utilizationPct =
    totalSlots > 0 ? Math.round((bookedCount / Math.max(1, totalSlots - blockedCount)) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="clinical-card rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">Total Capacity Blocks</p>
          <p className="font-display text-2xl font-bold text-[#0F2942] tabular-nums mt-1">
            {totalSlots}
          </p>
        </div>
        <div className="clinical-card rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">Active Booked Visits</p>
          <p className="font-display text-2xl font-bold text-[#0D7A73] tabular-nums mt-1">
            {bookedCount}
          </p>
        </div>
        <div className="clinical-card rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">Blocked Clinic Slots</p>
          <p className="font-display text-2xl font-bold text-[#0F2942] tabular-nums mt-1">
            {blockedCount}
          </p>
        </div>
        <div className="clinical-card rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">Net Schedule Utilization</p>
          <p className="font-display text-2xl font-bold text-[#0D7A73] tabular-nums mt-1">
            {utilizationPct}%
          </p>
        </div>
      </div>

      <div className="clinical-card rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-[#0F2942]">
          Department Slot Allocation
        </h2>
        <div className="space-y-3">
          {specialists.map((spec) => {
            const specSlots = slots.filter((s) => s.specialistId === spec.id);
            const specBooked =
              clinicOps?.appointments.filter(
                (a) => a.specialistId === spec.id && a.status !== 'Cancelled'
              ).length ?? 0;
            const specOpen = specSlots.filter((s) => !s.isBlocked && !s.isBooked).length;
            const pct =
              specSlots.length > 0
                ? Math.min(100, Math.round(((specBooked + 4) / specSlots.length) * 100))
                : 0;

            return (
              <div key={spec.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#0F2942]">
                    {spec.specialty} · {spec.name}
                  </span>
                  <span className="font-mono tabular-nums text-slate-600">
                    {specBooked} booked / {specOpen} open
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-[#EDF4FC] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0D7A73]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
