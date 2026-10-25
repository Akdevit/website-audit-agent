import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import { auditCategories } from '../constants/audit-categories';

export default function AuditCoverage() {
  return (
    <section className="mb-7" aria-labelledby="coverage-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="coverage-title" className="text-xs font-medium text-muted">Six perspectives. A healthier website.</h2>
        <span className="text-[10px] text-muted">Choose a focus to get started</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {auditCategories.map(({ id, label, icon: Icon, description }) => (
          <Link key={id} to={`/audits/new?focus=${id === 'lighthouse' ? 'performance' : id}`} title={description} className="group flex min-w-0 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-3 text-[11px] font-medium transition-colors hover:border-brand/30 hover:bg-brand-soft">
            <Icon size={16} strokeWidth={1.7} className="shrink-0 text-brand" />
            <span className="min-w-0">{label === 'Browser diagnostics' ? 'Browser' : label === 'Search visibility' ? 'SEO' : label}</span>
            <ArrowUpRight size={11} className="ml-auto shrink-0 text-muted/60 group-hover:text-brand" />
          </Link>
        ))}
      </div>
    </section>
  );
}
