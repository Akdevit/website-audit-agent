import { Pie, PieChart } from 'recharts';
import { isScore, scoreBand } from '../lib/audit-insights';

export default function ScoreRing({value,label}) {
  const band = scoreBand(value);
  const valid = isScore(value);
  return <div className="relative size-[72px] shrink-0" role="img" aria-label={`${label}: ${valid ? `${value} out of 100, ${band.label}` : 'not measured'}`}><PieChart width={72} height={72} aria-hidden="true"><Pie data={valid ? [{value,fill:`var(--color-${band.tone})`},{value:100-value,fill:'var(--color-chart-track)'}] : [{value:100,fill:'var(--color-chart-track)'}]} dataKey="value" startAngle={90} endAngle={-270} innerRadius={28} outerRadius={33} stroke="none" isAnimationActive={false} /></PieChart><span className={`pointer-events-none absolute inset-0 flex items-center justify-center text-xl font-semibold tabular-nums tone-${band.tone}`}>{valid ? Math.round(value) : '—'}</span></div>;
}
