import { useState } from 'react';
import { ArrowRight, Globe2, Monitor, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, RadioGroup, Select, Textarea } from '@/components/ui/FormControls';
import { auditPresets } from '../constants/audit-presets';

export default function AuditSetupForm({onSubmit,defaultUrl='',defaultFocus='complete',defaultDevice='mobile'}) {
  const preset = auditPresets.find((entry) => entry.id === defaultFocus) || auditPresets[0];
  const [device,setDevice] = useState(defaultDevice === 'desktop' ? 'desktop' : 'mobile');
  const [scope,setScope] = useState(preset.id);
  const [query,setQuery] = useState(preset.query || '');
  const [errors,setErrors] = useState({});
  function handleSubmit(event) {
    event.preventDefault();
    const url=String(new FormData(event.currentTarget).get('url') || '').trim();
    const nextErrors={};
    try {if (!['http:','https:'].includes(new URL(url).protocol)) throw new Error();} catch {nextErrors.url='Enter a complete HTTP or HTTPS URL.';}
    if (!query.trim()) nextErrors.query='Describe what you want to check.';
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) onSubmit({url,query:query.trim(),device});
  }
  function changeScope(event) { const next=event.target.value;setScope(next);setQuery(auditPresets.find(({id}) => id === next)?.query || ''); }
  return <form onSubmit={handleSubmit} className="space-y-6"><Input id="website-url" name="url" type="url" required label="Website URL" defaultValue={defaultUrl} icon={Globe2} placeholder="https://your-website.com" error={errors.url} description="Enter the full address of the page you want to check." /><RadioGroup label="Device" name="device" value={device} onValueChange={setDevice} options={[{value:'mobile',label:'Mobile',icon:Smartphone},{value:'desktop',label:'Desktop',icon:Monitor}]} /><Select id="audit-scope" label="Audit scope" name="scope" value={scope} onChange={changeScope} options={auditPresets.map(({id,label}) => ({value:id,label}))} description="Choose a preset, or customize the instructions below." /><Textarea id="audit-query" name="query" label="Audit instructions" required maxLength={2000} value={query} onChange={(event) => setQuery(event.target.value)} error={errors.query} placeholder="For example: focus on slow loading and broken links" description="Tell the agent what to investigate and which issues matter most." /><div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6"><p className="text-xs text-muted">Your report is saved to audit history.</p><Button type="submit">Start audit<ArrowRight size={15} /></Button></div></form>;
}
