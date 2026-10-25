import { useState } from 'react';
import Markdown from 'react-markdown';
import {
  ArrowLeft,
  ArrowUpRight,
  Download,
  Monitor,
  RotateCw,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/ui/QueryState';
import Alert from '@/components/ui/Alert';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { downloadJson } from '@/lib/download';
import {
  formatDate,
  formatDuration,
  safeWebsiteUrl,
  websiteLabel,
} from '@/lib/format';
import AuditStatus from '../components/AuditStatus';
import AuditIssuesTable from '../components/AuditIssuesTable';
import AuditToolStatus from '../components/AuditToolStatus';
import CheckSummary from '../components/CheckSummary';
import CoreMetrics from '../components/CoreMetrics';
import LighthouseScores from '../components/LighthouseScores';
import ScoreRing from '../components/ScoreRing';
import { scoreBand } from '../lib/audit-insights';
import { useAuditDetail, useDeleteAudit } from '../hooks/useAudits';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'performance', label: 'Performance' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'best-practices', label: 'Best Practices' },
  { id: 'seo', label: 'SEO' },
  { id: 'security', label: 'Security' },
  { id: 'links', label: 'Links' },
];

const categoryTabs = {
  lighthouse: 'performance',
  accessibility: 'accessibility',
  seo: 'seo',
  security: 'security',
  links: 'links',
  browser: 'overview',
};

function CheckUnavailable({ audit, category, label }) {
  const error = audit.toolErrors?.[category];
  if (audit.results?.[category]) return null;

  if (error) {
    return (
      <Alert title={`${label} check failed`} tone="poor" role="alert">
        {typeof error === 'string'
          ? error
          : error.message || 'The check reported an error.'}
      </Alert>
    );
  }

  const running = ['pending', 'running'].includes(audit.status);
  return (
    <Alert title={running ? `${label} check is pending` : 'No saved check results'} tone="attention">
      {running
        ? 'Results will be available after the audit finishes.'
        : audit.status === 'failed'
          ? 'The audit stopped before this check produced a saved result.'
          : 'This check was not run or no result was saved.'}
    </Alert>
  );
}

function SavedReport({ report, auditStatus }) {
  if (!report) {
    return (
      <p className="text-sm leading-6 text-muted">
        {['pending', 'running'].includes(auditStatus)
          ? 'The summary will appear when the audit finishes.'
          : 'No AI summary was saved for this audit.'}
      </p>
    );
  }

  return (
    <div className="report-copy">
      <Markdown
        skipHtml
        components={{
          a: ({ children, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {typeof report === 'string' ? report : JSON.stringify(report, null, 2)}
      </Markdown>
    </div>
  );
}

export default function AuditDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const query = useAuditDetail(id);
  const deletion = useDeleteAudit();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (query.isPending) return <PageSkeleton />;
  if (query.isError && !query.data) {
    return [400, 404].includes(query.error.status) ? (
      <EmptyState
        title="Audit not found"
        description="This report may have been deleted, or the audit ID is invalid."
        action={<ButtonLink to="/audits">Back to all audits</ButtonLink>}
      />
    ) : (
      <ErrorState
        title="Could not load this report"
        error={query.error}
        onRetry={() => query.refetch()}
      />
    );
  }

  const audit = query.data;
  const sourceUrl = safeWebsiteUrl(audit.url);
  const repeatParams = new URLSearchParams({
    url: audit.url,
    device: audit.device || 'mobile',
  });
  const legacyView = params.get('view');
  const legacyCategory = params.get('category');
  const selectedTab =
    tabs.find(({ id: tabId }) => tabId === params.get('tab'))?.id ||
    (legacyView === 'checks' ? categoryTabs[legacyCategory] : null) ||
    'overview';
  const rawDataSelected = legacyView === 'data';
  const DeviceIcon = audit.device === 'desktop' ? Monitor : Smartphone;

  return (
    <>
      <Link
        to="/audits"
        className="mb-4 inline-flex items-center gap-2 text-xs text-muted hover:text-brand"
      >
        <ArrowLeft size={14} />
        All audits
      </Link>

      <section className="border-b border-line pb-5" aria-labelledby="audit-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1
                id="audit-title"
                className="min-w-0 text-xl font-semibold tracking-tight [overflow-wrap:anywhere]"
              >
                {websiteLabel(audit.url)}
              </h1>
              <AuditStatus status={audit.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-0 items-center gap-1 hover:text-brand"
                >
                  <span className="max-w-[min(72vw,480px)] truncate">
                    {audit.url}
                  </span>
                  <ArrowUpRight size={12} />
                </a>
              )}
              <span className="inline-flex items-center gap-1.5 capitalize">
                <DeviceIcon size={13} />
                {audit.device || 'Unknown device'}
              </span>
              <span>{formatDate(audit.completedAt || audit.createdAt, true)}</span>
              <span>{formatDuration(audit.durationMs)}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => downloadJson(audit, `audit-${id}.json`)}
            >
              <Download size={14} />
              Export JSON
            </Button>
            <ButtonLink to={`/audits/new?${repeatParams}`}>
              <RotateCw size={14} />
              Run again
            </ButtonLink>
          </div>
        </div>
      </section>

      {query.isError && (
        <div className="mt-4">
          <ErrorState
            title="Could not refresh this report"
            error={query.error}
            onRetry={() => query.refetch()}
          />
        </div>
      )}
      {audit.status === 'running' && (
        <div className="mt-4">
          <Alert title="Audit in progress">
            The report checks for saved updates automatically.
          </Alert>
        </div>
      )}
      {audit.status === 'failed' && (
        <div className="mt-4">
          <Alert title="Audit failed" tone="poor" role="alert">
            {audit.error ||
              'The audit request did not complete. Review saved tool statuses before trying again.'}
          </Alert>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3 border-b border-line">
        <nav
          aria-label="Report sections"
          className="flex min-w-0 flex-1 gap-5 overflow-x-auto"
        >
          {tabs.map(({ id: tabId, label }) => (
            <Link
              key={tabId}
              to={`?tab=${tabId}`}
              aria-current={!rawDataSelected && selectedTab === tabId ? 'page' : undefined}
              className={`-mb-px shrink-0 border-b-2 px-0.5 py-3 text-xs font-medium ${
                !rawDataSelected && selectedTab === tabId
                  ? 'border-brand text-brand'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link
          to="?view=data"
          aria-current={rawDataSelected ? 'page' : undefined}
          className={`shrink-0 py-3 text-xs ${
            rawDataSelected ? 'font-medium text-brand' : 'text-muted hover:text-ink'
          }`}
        >
          Raw JSON
        </Link>
      </div>

      <div className="pt-5">
        {rawDataSelected ? (
          <section
            className="overflow-hidden rounded-panel border border-line bg-surface"
            aria-label="Raw audit data"
          >
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold">Raw audit data</h2>
            </div>
            <pre className="max-h-[650px] overflow-auto bg-surface p-4 text-xs leading-5">
              {JSON.stringify(audit, null, 2)}
            </pre>
          </section>
        ) : selectedTab === 'overview' ? (
          <>
            <LighthouseScores scores={audit.results?.lighthouse?.scores} />
            <p className="mb-5 text-[11px] leading-5 text-muted">
              Lighthouse scores are lab results and do not represent real-user measurements.
            </p>
            <section
              className="rounded-panel border border-line bg-surface p-4 sm:p-5"
              aria-labelledby="ai-summary-title"
            >
              <h2 id="ai-summary-title" className="mb-3 text-sm font-semibold">
                AI audit summary
              </h2>
              <SavedReport report={audit.report} auditStatus={audit.status} />
            </section>
            {audit.results?.browser && (
              <section className="mt-6" aria-labelledby="browser-diagnostics-title">
                <div className="mb-3">
                  <h2 id="browser-diagnostics-title" className="text-sm font-semibold">
                    Browser diagnostics
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    Captured browser errors and runtime findings.
                  </p>
                </div>
                <CheckSummary category="browser" data={audit.results.browser} />
              </section>
            )}
            <AuditIssuesTable results={audit.results} />
            <AuditToolStatus audit={audit} />
          </>
        ) : selectedTab === 'performance' ? (
          <>
            <CheckUnavailable
              audit={audit}
              category="lighthouse"
              label="Performance"
            />
            {audit.results?.lighthouse ? (
              <>
                <LighthouseScores scores={audit.results.lighthouse.scores} />
                <CoreMetrics values={audit.results.lighthouse.metrics} />
                <AuditIssuesTable
                  results={audit.results}
                  category="lighthouse"
                />
              </>
            ) : null}
          </>
        ) : selectedTab === 'best-practices' ? (
          <>
            <CheckUnavailable
              audit={audit}
              category="lighthouse"
              label="Best Practices"
            />
            {audit.results?.lighthouse ? (
              <>
                <section className="flex items-center gap-4 rounded-panel border border-line bg-surface p-4">
                  <ScoreRing
                    value={audit.results.lighthouse.scores?.bestPractices}
                    label="Best Practices"
                  />
                  <div>
                    <h2 className="text-sm font-semibold">Best Practices score</h2>
                    <p
                      className={`mt-1 text-xs tone-${scoreBand(audit.results.lighthouse.scores?.bestPractices).tone}`}
                    >
                      {scoreBand(audit.results.lighthouse.scores?.bestPractices).label}
                    </p>
                  </div>
                </section>
                <p className="mt-3 text-xs leading-5 text-muted">
                  Saved Lighthouse issues are not separated by category in this report.
                  Review the combined Lighthouse findings under Performance.
                </p>
                <Link
                  to="?tab=performance"
                  className="mt-2 inline-block text-xs font-medium text-brand hover:underline"
                >
                  View Lighthouse findings
                </Link>
              </>
            ) : null}
          </>
        ) : (
          (() => {
            const category = selectedTab;
            const label = tabs.find(({ id: tabId }) => tabId === category)?.label || category;
            const data = audit.results?.[category];
            return (
              <>
                <CheckUnavailable audit={audit} category={category} label={label} />
                {data && <CheckSummary category={category} data={data} />}
                {data && (
                  <AuditIssuesTable
                    results={audit.results}
                    category={category}
                  />
                )}
              </>
            );
          })()
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="max-w-full truncate font-mono text-[10px] text-muted">
          Audit ID: {id}
        </p>
        <Button
          variant="ghost"
          disabled={['running', 'pending'].includes(audit.status)}
          title={
            ['running', 'pending'].includes(audit.status)
              ? 'An active audit cannot be deleted here'
              : undefined
          }
          onClick={() => {
            deletion.reset();
            setConfirmDelete(true);
          }}
          className="min-h-8 px-2 py-1.5 text-xs hover:text-poor"
        >
          <Trash2 size={13} />
          Delete audit
        </Button>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => {
          if (!deletion.isPending) setConfirmDelete(false);
        }}
        onConfirm={() =>
          deletion.mutate(id, {
            onSuccess: () => navigate('/audits', { replace: true }),
          })
        }
        isPending={deletion.isPending}
        error={deletion.error}
        title="Delete this audit?"
        description="This permanently removes the saved report and its results. This action cannot be undone."
      />
    </>
  );
}
