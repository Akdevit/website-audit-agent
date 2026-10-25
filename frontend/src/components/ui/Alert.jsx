import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function Alert({ title, children, tone = 'info', role = 'status' }) {
  const Icon = tone === 'poor' || tone === 'attention' ? AlertCircle : Info;
  return <div role={role} className={cn('flex items-start gap-3 rounded-panel border border-current/15 p-4',`badge--${tone}`)}><Icon size={17} className="mt-0.5 shrink-0" /><div className="min-w-0"><p className="text-sm font-medium">{title}</p>{children && <div className="mt-1.5 text-xs leading-6">{children}</div>}</div></div>;
}
