import { safeWebsiteUrl } from '@/lib/format';
const displayValue = (value) => value == null || value === '' ? '—' : typeof value === 'boolean' ? value ? 'Yes' : 'No' : String(value);

export default function KeyValueList({ items }) {
  return <dl className="divide-y divide-line">{items.map(([label,value]) => { const url = typeof value === 'string' && /^https?:\/\//.test(value) ? safeWebsiteUrl(value) : null; return <div key={label} className="grid gap-2 py-3.5 sm:grid-cols-[160px_minmax(0,1fr)]"><dt className="text-xs leading-6 text-muted">{label}</dt><dd className="min-w-0 text-xs leading-6 [overflow-wrap:anywhere]">{url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">{value}</a> : displayValue(value)}</dd></div>; })}</dl>;
}
