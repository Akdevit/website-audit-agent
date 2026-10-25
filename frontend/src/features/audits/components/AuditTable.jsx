import { ArrowUpRight, Monitor, Smartphone } from 'lucide-react';
import { Link } from 'react-router';
import { formatDate, formatDuration, websiteLabel } from '@/lib/format';
import { EmptyState } from '@/components/ui/QueryState';
import { ButtonLink } from '@/components/ui/Button';
import AuditStatus from './AuditStatus';
import ScoreValue from './ScoreValue';
import { scoreBand } from '../lib/audit-insights';

const scores = [
  ['performance', 'Performance'],
  ['accessibility', 'Accessibility'],
  ['bestPractices', 'Best practices'],
  ['seo', 'SEO'],
];

const optionalColumn = 'hidden px-4 py-3 md:table-cell';

export default function AuditTable({
  audits = [],
  isLoading = false,
  emptyState,
}) {
  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading audits"
        className="divide-y divide-line"
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <div
            key={value}
            className="flex items-center justify-between gap-6 p-5 motion-safe:animate-pulse"
          >
            <div className="h-8 w-48 rounded bg-canvas" />
            <div className="h-5 w-24 rounded bg-canvas" />
            <div className="hidden h-5 w-32 rounded bg-canvas sm:block" />
          </div>
        ))}
      </div>
    );
  }

  if (!audits.length) {
    return emptyState || <EmptyState action={<ButtonLink to="/audits/new">Create an audit</ButtonLink>} />;
  }

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full table-fixed text-left text-xs md:min-w-[980px] md:table-auto">
        <caption className="sr-only">
          Saved website audits, newest first. Scores are Lighthouse lab scores.
        </caption>
        <thead className="border-y border-line bg-canvas/60 text-[10px] text-muted">
          <tr>
            <th scope="col" className="w-[42%] px-2 py-3 font-medium sm:px-3 md:w-auto md:px-4">
              Website
            </th>
            <th scope="col" className="w-[28%] px-2 py-3 font-medium md:w-auto md:px-4">
              Status
            </th>
            <th scope="col" className="w-[16%] px-2 py-3 font-medium md:w-auto md:px-4">
              <span className="md:hidden">Perf.</span>
              <span className="hidden md:inline">Performance</span>
            </th>
            {scores.slice(1).map(([key, label]) => (
              <th key={key} scope="col" className={optionalColumn}>
                {label}
              </th>
            ))}
            <th scope="col" className={optionalColumn}>Device</th>
            <th scope="col" className={optionalColumn}>Created</th>
            <th scope="col" className={optionalColumn}>Duration</th>
            <th scope="col" className="w-[14%] px-2 py-3 font-medium md:w-auto md:px-3">
              <span className="sr-only">View report</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {audits.map((audit) => {
            const id = audit.id || audit._id;
            const Device = audit.device === 'desktop' ? Monitor : Smartphone;
            return (
              <tr key={id} className="group hover:bg-canvas/40">
                <td className="overflow-hidden px-2 py-3 sm:px-3 md:px-4">
                  <Link
                    to={`/audits/${id}`}
                    title={audit.url}
                    className="block min-w-0"
                  >
                    <span className="block truncate text-xs font-medium group-hover:text-brand">
                      {websiteLabel(audit.url)}
                    </span>
                    <span className="mt-1 hidden truncate text-[10px] text-muted sm:block md:max-w-[180px]">
                      {audit.url}
                    </span>
                  </Link>
                </td>
                <td className="overflow-hidden px-2 py-3 md:px-4">
                  <AuditStatus status={audit.status} />
                </td>
                {scores.map(([key, label], index) => {
                  const value = audit.results?.lighthouse?.scores?.[key];
                  const classes =
                    index === 0
                      ? 'px-2 py-3 md:px-4'
                      : optionalColumn;
                  return (
                    <td key={key} className={classes}>
                      <span
                        title={`${label}: ${scoreBand(value).label}`}
                        className={`inline-flex min-w-8 items-center justify-center tabular-nums tone-${scoreBand(value).tone}`}
                      >
                        <ScoreValue value={value} className="text-xs" />
                      </span>
                    </td>
                  );
                })}
                <td className={optionalColumn}>
                  <span className="flex items-center gap-1.5 capitalize text-muted">
                    <Device size={13} />
                    {audit.device}
                  </span>
                </td>
                <td className={`${optionalColumn} whitespace-nowrap text-muted`}>
                  {formatDate(audit.createdAt)}
                </td>
                <td className={`${optionalColumn} whitespace-nowrap text-muted`}>
                  {formatDuration(audit.durationMs)}
                </td>
                <td className="px-2 py-3 md:px-3">
                  <Link
                    to={`/audits/${id}`}
                    aria-label={`View audit for ${websiteLabel(audit.url)}`}
                    className="inline-flex rounded-control p-2 text-muted hover:bg-brand-soft hover:text-brand"
                  >
                    <ArrowUpRight size={15} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
