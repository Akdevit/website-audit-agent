import { scoreBands } from '../lib/audit-insights';

export default function ScoreLegend() {
  return <ul aria-label="Score ranges" className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-muted">{scoreBands.map(({tone,label,range}) => <li key={tone} className="flex items-center gap-1.5"><span className={`size-1.5 rounded-full bg-current tone-${tone}`} />{range}<span className="sr-only"> {label}</span></li>)}<li>— Not measured</li></ul>;
}
