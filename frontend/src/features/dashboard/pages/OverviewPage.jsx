import { ArrowUpRight, CircleAlert, Files, Gauge, Plus, ScanLine } from 'lucide-react';
import { Link } from 'react-router';
import PageHeader from '@/components/ui/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import { ErrorState } from '@/components/ui/QueryState';
import { useAuditList } from '@/features/audits/hooks/useAudits';
import AuditTable from '@/features/audits/components/AuditTable';
import { isScore, scoreBand } from '@/features/audits/lib/audit-insights';
import RecentPerformanceChart from '../components/RecentPerformanceChart';
import AuditActivityChart from '../components/AuditActivityChart';
import QuickAuditHero from '../components/QuickAuditHero';
import AuditCoverage from '@/features/audits/components/AuditCoverage';

export default function OverviewPage() {
  const query = useAuditList({ limit: 10 });
  const audits = query.data?.audits || [];
  const measured = audits
    .map((audit) => audit.results?.lighthouse?.scores?.performance)
    .filter(isScore);
  const average = measured.length
    ? Math.round(measured.reduce((sum, value) => sum + value, 0) / measured.length)
    : null;
  const failed = audits.filter((audit) => audit.status === 'failed').length;

  return (
    <>
      <PageHeader
        eyebrow="YOUR WEBSITE, IN FOCUS"
        title="Workspace overview"
        description="A clear view of your websites. A confident next step."
        action={
          <ButtonLink to="/audits/new">
            <Plus size={15} />
            New audit
          </ButtonLink>
        }
      />

      <QuickAuditHero />
      <AuditCoverage />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
        <StatCard
          label="Saved audits"
          value={query.isPending ? '…' : query.data?.pagination.total}
          description="All records in this workspace"
          icon={Files}
          tone="info"
        />
        <StatCard
          label="Measured audits"
          value={query.isPending ? '…' : query.data ? measured.length : null}
          description={`With scores in the latest ${audits.length || 10} records`}
          icon={ScanLine}
        />
        <StatCard
          label="Average performance"
          value={average == null ? '—' : `${average}/100`}
          description="Mean of measured recent scores"
          icon={Gauge}
          tone={scoreBand(average).tone}
        />
        <StatCard
          label="Failed requests"
          value={query.isPending ? '…' : query.data ? failed : null}
          description={`In the latest ${audits.length || 10} records`}
          icon={CircleAlert}
          tone={failed ? 'poor' : 'neutral'}
        />
      </div>

      {query.isError && (
        <div className="mb-6">
          <ErrorState
            error={query.error}
            onRetry={() => query.refetch()}
            title="Could not refresh your audits"
          />
        </div>
      )}

      {(audits.length > 0 || query.isPending) && (
        <div className="mb-6 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <RecentPerformanceChart
            audits={audits}
            isLoading={query.isPending}
          />
          <AuditActivityChart audits={audits} isLoading={query.isPending} />
        </div>
      )}

      <section className="panel overflow-hidden" aria-labelledby="recent-title">
        <div className="panel-heading">
          <div>
            <h2 id="recent-title" className="section-title">
              Recent audits
            </h2>
            <p className="mt-1.5 text-xs text-muted">
              The five most recent requests
            </p>
          </div>
          <Link
            to="/audits"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
          >
            View all audits
            <ArrowUpRight size={14} />
          </Link>
        </div>
        {(query.data || query.isPending) && (
          <AuditTable audits={audits.slice(0, 5)} isLoading={query.isPending} />
        )}
      </section>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] leading-5 text-muted">
        <p>
          Charts summarize the latest {audits.length || 10} saved records, not
          the entire workspace.
        </p>
        <p>Missing scores are excluded from averages.</p>
      </div>
    </>
  );
}
