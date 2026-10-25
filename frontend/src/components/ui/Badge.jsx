import { cn } from '@/lib/cn';

export default function Badge({ tone = 'neutral', dot = false, className, children }) {
  return <span className={cn('badge',`badge--${tone}`,className)}>{dot && <span className="size-1.5 shrink-0 rounded-full bg-current" />}{children}</span>;
}
