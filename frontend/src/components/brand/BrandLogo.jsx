import { brand } from '@/config/brand';
import { cn } from '@/lib/cn';

export function BrandMark({ className }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn('size-10 shrink-0', className)} aria-hidden="true">
      <rect width="48" height="48" rx="14" fill="currentColor" />
      <path d="M18 12h-3a3 3 0 0 0-3 3v3m18-6h3a3 3 0 0 1 3 3v3M12 30v3a3 3 0 0 0 3 3h3m12 0h3a3 3 0 0 0 3-3v-3" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="24" r="8" stroke="white" strokeOpacity=".45" strokeWidth="2" />
      <path d="m19.5 24 3 3 6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function BrandLogo({ compact = false, inverse = false }) {
  return (
    <span className="inline-flex items-center gap-3">
      <BrandMark className={inverse ? 'text-[#249b8d]' : 'text-brand'} />
      {!compact && <span>
        <span className={cn('block text-xl leading-6 font-semibold tracking-[-0.045em]', inverse && 'text-white')}>{brand.name}</span>
        <span className={cn('mt-0.5 block text-[10px] leading-4 tracking-wide', inverse ? 'text-slate-400' : 'text-muted')}>{brand.description}</span>
      </span>}
    </span>
  );
}
