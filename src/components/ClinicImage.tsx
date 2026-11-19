import { useState } from 'react';
import { Stethoscope } from 'lucide-react';

interface ClinicImageProps {
  src: string | null | undefined;
  alt: string;
  fallbackLabel: string;
  className?: string;
}

export function ClinicImage({
  src,
  alt,
  fallbackLabel,
  className = '',
}: ClinicImageProps) {
  const [failed, setFailed] = useState(false);

  const initials = fallbackLabel
    .replace(/^Dr\.\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#E6F0FA] via-[#EDF4FC] to-[#D1E4FF] text-[#0F2942] select-none ${className}`}
      >
        <Stethoscope className="w-5 h-5 text-[#0D7A73] mb-1 opacity-80" />
        <span className="font-display font-bold text-sm tracking-tight">
          {initials || 'MD'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
