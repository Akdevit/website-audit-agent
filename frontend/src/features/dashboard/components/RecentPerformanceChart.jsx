import { Bar, BarChart, CartesianGrid, Rectangle, Tooltip, XAxis, YAxis } from 'recharts';
import ChartFrame from '@/components/charts/ChartFrame';
import { formatDate, websiteLabel } from '@/lib/format';
import { isScore, scoreBand } from '@/features/audits/lib/audit-insights';
import ScoreLegend from '@/features/audits/components/ScoreLegend';

function RunTooltip({active,payload}) {
  if (!active || !payload?.length) return null;
  const run = payload[0].payload;
  return <div className="chart-tooltip"><p className="font-medium">{websiteLabel(run.url)}</p><p className="mt-1 capitalize text-muted">{run.device} · {formatDate(run.createdAt,true)}</p><p className={`mt-2 font-medium tone-${run.tone}`}>Performance: {run.score}/100</p></div>;
}
export default function RecentPerformanceChart({ audits, isLoading }) {
  const data = [...audits].reverse().filter((audit) => isScore(audit.results?.lighthouse?.scores?.performance)).map((audit,index) => {const score = audit.results.lighthouse.scores.performance; const {tone} = scoreBand(score); return {...audit,run:index+1,score,tone,fill:`var(--color-${tone})`};});
  return <section className="panel" aria-labelledby="performance-chart-title"><div className="panel-heading"><div><h2 id="performance-chart-title" className="section-title">Recent performance</h2><p className="mt-1.5 text-xs text-muted">Measured scores from the latest {audits.length || 10} saved audits</p></div><span className="badge badge--neutral">Lighthouse</span></div><div className="p-5">{data.length ? <><ChartFrame label="Lighthouse performance scores by saved run, oldest to newest"><BarChart data={data} margin={{top:12,right:8,left:-25,bottom:4}} accessibilityLayer><CartesianGrid vertical={false} stroke="var(--color-chart-grid)" strokeDasharray="3 4" /><XAxis dataKey="run" tickFormatter={(value) => `Run ${value}`} axisLine={false} tickLine={false} tick={{fontSize:10,fill:'var(--color-muted)'}} dy={8} /><YAxis domain={[0,100]} ticks={[0,25,50,75,100]} axisLine={false} tickLine={false} tick={{fontSize:10,fill:'var(--color-muted)'}} /><Tooltip content={<RunTooltip />} cursor={{fill:'var(--color-canvas)'}} /><Bar dataKey="score" name="Performance" barSize={30} radius={[5,5,0,0]} isAnimationActive={false} shape={(props) => <Rectangle {...props} fill={props.payload.fill} />} /></BarChart></ChartFrame><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><ScoreLegend /><span className="text-[10px] text-muted">Oldest → newest</span></div></> : <div className="flex h-64 items-center justify-center text-center text-xs leading-6 text-muted">{isLoading ? 'Loading performance scores…' : 'No measured performance scores in these audits.'}</div>}</div></section>;
}
