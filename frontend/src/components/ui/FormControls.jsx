import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

function Field({ id, label, description, error, hideLabel, children }) {
  return <div><label htmlFor={id} className={hideLabel ? 'sr-only' : 'field-label'}>{label}</label>{children}{error ? <p id={`${id}-error`} role="alert" className="field-error">{error}</p> : description ? <p id={`${id}-description`} className="field-description">{description}</p> : null}</div>;
}
function attributes(id, description, error) { return {id,'aria-invalid':!!error,'aria-describedby':error ? `${id}-error` : description ? `${id}-description` : undefined}; }

export function Input({ id, label, description, error, hideLabel, icon: Icon, className, ...props }) {
  const generated = useId();
  const fieldId = id || generated;
  return <Field id={fieldId} label={label} description={description} error={error} hideLabel={hideLabel}><div className="relative">{Icon && <Icon size={16} className="pointer-events-none absolute top-3.5 left-3.5 text-muted" aria-hidden="true" />}<input {...props} {...attributes(fieldId,description,error)} className={cn('field',Icon && 'pl-10',className)} /></div></Field>;
}
export function Textarea({ id, label, description, error, className, ...props }) {
  const generated = useId();
  const fieldId = id || generated;
  return <Field id={fieldId} label={label} description={description} error={error}><textarea {...props} {...attributes(fieldId,description,error)} className={cn('field min-h-28 resize-y',className)} /></Field>;
}
export function Select({ id, label, description, error, hideLabel, options, className, ...props }) {
  const generated = useId();
  const fieldId = id || generated;
  return <Field id={fieldId} label={label} description={description} error={error} hideLabel={hideLabel}><div className="relative"><select {...props} {...attributes(fieldId,description,error)} className={cn('field appearance-none pr-10',className)}>{options.map(({value,label:optionLabel}) => <option key={value} value={value}>{optionLabel}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute top-3.5 right-3.5 text-muted" aria-hidden="true" /></div></Field>;
}
export function RadioGroup({ label, name, value, onValueChange, options }) {
  return <fieldset><legend className="field-label">{label}</legend><div className="grid grid-cols-2 gap-3">{options.map(({value:optionValue,label:optionLabel,icon:Icon}) => <label key={optionValue} className={cn('flex cursor-pointer items-center justify-between gap-2 rounded-control border px-3 py-3.5 text-xs',value === optionValue ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:bg-canvas')}><span className="flex items-center gap-2">{Icon && <Icon size={16} strokeWidth={1.6} />}{optionLabel}</span><input type="radio" name={name} value={optionValue} checked={value === optionValue} onChange={() => onValueChange(optionValue)} className="accent-brand" /></label>)}</div></fieldset>;
}
