import { Gauge, Search, ShieldCheck, Accessibility } from 'lucide-react';
import ScoreRing from './ScoreRing';
import { isScore, scoreBand } from '../lib/audit-insights';

const labels = [['performance','Performance',Gauge],['accessibility','Accessibility',Accessibility],['bestPractices','Best practices',ShieldCheck],['seo','SEO',Search]];
export default function LighthouseScores({scores}) {
  return <section aria-label="Lighthouse lab scores" className="my-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{labels.map(([key,label,Icon]) => {const value = scores?.[key];const band=scoreBand(value);return <div key={key} className="panel flex min-h-[104px] items-center gap-3 px-3 py-4 sm:px-4"><ScoreRing value={value} label={label} /><div className="min-w-0"><p className="flex items-center gap-1.5 text-xs font-medium"><Icon size={13} className="text-muted" />{label}</p><p className={`mt-1.5 text-[11px] tone-${band.tone}`}>{isScore(value) ? band.label : 'Not measured'}</p></div></div>;})}</section>;
}
