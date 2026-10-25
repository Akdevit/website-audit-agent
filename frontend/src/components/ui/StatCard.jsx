import { cn } from '@/lib/cn';

export default function StatCard({ label, value, description, icon: Icon, tone = 'neutral' }) {
  return (
    <div className="panel stat-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted">{label}</p>
        {Icon && (
          <span className={cn('flex size-9 items-center justify-center rounded-control', `badge--${tone}`)}>
            <Icon size={17} strokeWidth={1.7} />
          </span>
        )}
      </div>
      <p
        className={cn(
          'mt-4 text-[32px] leading-none font-semibold tracking-tight text-ink tabular-nums',
        )}
      >
        {value ?? '—'}
      </p>
      {description && (
        <p className="mt-2.5 text-[11px] leading-5 text-muted">
          {description}
        </p>
      )}
    </div>
  );
}
