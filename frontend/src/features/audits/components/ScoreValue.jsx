import { cn } from '@/lib/cn';
import { isScore, scoreBand } from '../lib/audit-insights';

export default function ScoreValue({value,className}) {
  return <span title={scoreBand(value).label} className={cn('font-mono text-sm font-medium tabular-nums',`tone-${scoreBand(value).tone}`,className)}>{isScore(value) ? Math.round(value) : '—'}</span>;
}
