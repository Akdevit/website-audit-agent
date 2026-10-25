import { ArrowRight, Globe2, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormControls';

function ScopeIllustration() {
  return (
    <div className="scope-art relative flex h-full min-h-64 items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 280 240" fill="none" className="w-64 text-brand">
        <circle cx="140" cy="120" r="101" stroke="currentColor" strokeOpacity=".12" />
        <circle cx="140" cy="120" r="79" stroke="currentColor" strokeOpacity=".16" strokeDasharray="3 7" />
        <path d="M140 19v25m0 152v25M39 120h25m152 0h25" stroke="currentColor" strokeOpacity=".25" />
        <rect x="65" y="61" width="150" height="118" rx="13" fill="white" stroke="#c5ddd2" />
        <path d="M65 87h150" stroke="#dceae4" />
        <circle cx="79" cy="74" r="2.5" fill="#78b5a0" /><circle cx="88" cy="74" r="2.5" fill="#bad7ca" /><circle cx="97" cy="74" r="2.5" fill="#dceae4" />
        <rect x="82" y="103" width="41" height="7" rx="3.5" fill="#dceae4" />
        <rect x="82" y="118" width="65" height="5" rx="2.5" fill="#edf3f0" />
        <rect x="82" y="130" width="51" height="5" rx="2.5" fill="#edf3f0" />
        <path d="m157 139 11-16 12 5 17-22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M82 155h115" stroke="#dceae4" strokeDasharray="4 4" />
        <rect x="167" y="155" width="61" height="38" rx="10" fill="#137d70" />
        <circle cx="186" cy="174" r="8" stroke="white" strokeOpacity=".5" />
        <path d="m182 174 3 3 5-6m12 0h12m-12 6h8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="60" cy="97" r="14" fill="white" stroke="#c5ddd2" />
        <path d="m55 97 3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="218" cy="67" r="5" fill="#78b5a0" />
        <circle cx="74" cy="188" r="4" fill="#a7cdbb" />
      </svg>
    </div>
  );
}

export default function QuickAuditHero() {
  const navigate = useNavigate();
  function startAudit(event) {
    event.preventDefault();
    navigate(`/audits/new?${new URLSearchParams({ url: new FormData(event.currentTarget).get('url') })}`);
  }
  return (
    <section className="audit-hero grid lg:grid-cols-[minmax(0,1fr)_270px]" aria-labelledby="quick-audit-title">
      <div className="relative z-10 p-6 sm:p-8">
        <p className="mb-4 flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-brand"><ScanLine size={14} /> A LITTLE CLARITY GOES A LONG WAY</p>
        <h2 id="quick-audit-title" className="max-w-lg text-[26px] leading-tight font-semibold tracking-[-0.04em] text-[#194b41] sm:text-[32px]">See your website.<br />Find your next improvement.</h2>
        <p className="mt-3 max-w-md text-[13px] leading-6 text-[#52756a]">Turn a URL into clear findings and actionable fixes. Your next better website starts here.</p>
        <form onSubmit={startAudit} className="mt-6 flex max-w-xl flex-col gap-2 sm:flex-row">
          <div className="min-w-0 flex-1"><Input id="quick-url" name="url" type="url" required label="Website URL" hideLabel icon={Globe2} placeholder="https://your-website.com" className="border-white shadow-xs" /></div>
          <Button type="submit">Start audit <ArrowRight size={15} /></Button>
        </form>
        <p className="mt-3 text-[10px] leading-5 text-[#52756a]">Choose your device and audit scope in the next step.</p>
      </div>
      <div className="hidden overflow-hidden lg:block"><ScopeIllustration /></div>
    </section>
  );
}
