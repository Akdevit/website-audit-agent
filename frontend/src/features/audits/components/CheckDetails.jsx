import { ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { auditCategories } from '../constants/audit-categories';
import { cn } from '@/lib/cn';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import FindingList from './FindingList';
import CoreMetrics from './CoreMetrics';
import CheckSummary from './CheckSummary';
import { categoryFindings } from '../lib/audit-insights';

export default function CheckDetails({audit}) {
  const [params,setParams]=useSearchParams();
  const available=auditCategories.filter(({id}) => audit.results?.[id]);
  const selected=params.get('category') || available[0]?.id || 'lighthouse';
  const category=auditCategories.find(({id}) => id === selected) || auditCategories[0];
  const data=audit.results?.[category.id];
  const failure=audit.toolErrors?.[category.id];
  return <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]"><nav aria-label="Audit categories" className="panel space-y-1 p-2">{auditCategories.map(({id,label,icon:Icon}) => <button key={id} aria-label={label} onClick={() => setParams({view:'checks',category:id})} aria-pressed={category.id === id} className={cn('flex w-full items-center justify-between gap-2 rounded-control px-3 py-3.5 text-left text-xs',category.id === id ? 'bg-brand-soft font-medium text-brand' : 'text-muted hover:bg-canvas')}><span className="flex items-center gap-2.5"><Icon size={16} strokeWidth={1.6} />{label}</span><span className="flex items-center gap-2"><span className="text-[10px]">{audit.results?.[id] ? categoryFindings(audit.results[id]).length : '—'}</span><ChevronRight size={12} /></span></button>)}</nav><section className="min-w-0"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold tracking-tight">{category.label}</h2><p className="mt-1.5 text-xs leading-6 text-muted">{category.description}</p></div><Badge tone={data ? 'info' : 'neutral'}>{data ? 'Results saved' : 'Not available'}</Badge></div>{!data ? <Alert title={failure ? 'This check failed' : 'No saved results'} tone="attention">{failure ? typeof failure === 'string' ? failure : failure.message || 'The tool could not complete this check.' : 'This check may have been skipped or failed. Review the report limitations for context.'}</Alert> : <><CheckSummary category={category.id} data={data} />{category.id === 'lighthouse' && <CoreMetrics values={data.metrics} />}<FindingList data={data} /></>}</section></div>;
}
