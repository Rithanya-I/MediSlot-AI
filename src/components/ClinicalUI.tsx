import { AlertTriangle, CheckCircle2, Clock, LogIn, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function StatusTag({
  status,
}: {
  status: string;
}) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes('confirm') ||
    normalized.includes('verified') ||
    normalized.includes('checked') ||
    normalized.includes('completed') ||
    normalized.includes('open') ||
    normalized.includes('routine')
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs font-semibold whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  if (
    normalized.includes('pending') ||
    normalized.includes('priority') ||
    normalized.includes('in exam') ||
    normalized.includes('triage')
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-xs font-semibold whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  if (
    normalized.includes('cancel') ||
    normalized.includes('urgent') ||
    normalized.includes('blocked') ||
    normalized.includes('no-show')
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-semibold whitespace-nowrap">
        {normalized.includes('urgent') ? (
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <XCircle className="w-3.5 h-3.5 shrink-0" />
        )}
        <span>{status}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold whitespace-nowrap">
      <span>{status}</span>
    </span>
  );
}

export function AuthGateCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { signInWithGoogle, authError } = useAuth();

  return (
    <div className="clinical-card rounded-2xl p-8 max-w-xl mx-auto my-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#EDF4FC] border border-[#D1E4FF] flex items-center justify-center mx-auto mb-4 text-[#0D7A73]">
        <LogIn className="w-6 h-6" />
      </div>
      <h2 className="font-display text-xl font-semibold text-[#0F2942] mb-2">
        {title}
      </h2>
      <p className="text-sm text-slate-600 mb-6 leading-relaxed">{description}</p>
      {authError && (
        <p className="text-xs text-[#BE123C] bg-[#FFF1F2] border border-[#FECDD3] rounded-lg px-3 py-2 mb-4">
          {authError}
        </p>
      )}
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0D7A73] hover:bg-[#0A6C74] text-white text-sm font-semibold transition-colors whitespace-nowrap"
      >
        <LogIn className="w-4 h-4" />
        <span>Continue with Google</span>
      </button>
    </div>
  );
}
