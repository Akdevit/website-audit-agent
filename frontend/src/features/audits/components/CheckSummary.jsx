import KeyValueList from '@/components/ui/KeyValueList';
import { displayValue } from '../lib/audit-insights';

const humanize = (value) =>
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (letter) => letter.toUpperCase());

function SummaryTable({ items, title }) {
  const available = items.filter(([, value]) => value !== undefined);
  if (!available.length) return null;

  return (
    <section className="mt-4 rounded-panel border border-line bg-surface">
      {title && (
        <h3 className="border-b border-line px-4 py-3 text-xs font-semibold">
          {title}
        </h3>
      )}
      <dl className="grid grid-cols-2 divide-x divide-line sm:grid-cols-4">
        {available.map(([label, value]) => (
          <div key={label} className="min-w-0 px-4 py-3">
            <dt className="text-[11px] text-muted">{label}</dt>
            <dd className="mt-1.5 break-words text-sm font-medium tabular-nums">
              {displayValue(value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SeoSummary({ data }) {
  const metadata = data.metadata || {};
  const scalarMetadata = Object.entries(metadata)
    .filter(([, value]) => value == null || typeof value !== 'object')
    .map(([key, value]) => [humanize(key), value]);

  return (
    <div className="rounded-panel border border-line bg-surface px-4 sm:px-5">
      {metadata.title && (
        <div className="border-b border-line py-4">
          <p className="text-[11px] text-muted">Page title</p>
          <p className="mt-1.5 break-words text-sm font-medium">{metadata.title}</p>
        </div>
      )}
      {scalarMetadata.length > 0 && (
        <KeyValueList items={scalarMetadata} />
      )}
      {['openGraph', 'twitter'].map((key) => {
        const values = metadata[key];
        if (!values || typeof values !== 'object') return null;
        return (
          <div key={key} className="border-t border-line py-3">
            <h3 className="mb-1 text-xs font-medium">
              {key === 'openGraph' ? 'Open Graph' : 'Twitter card'}
            </h3>
            <KeyValueList
              items={Object.entries(values).map(([name, value]) => [
                humanize(name),
                value,
              ])}
            />
          </div>
        );
      })}
    </div>
  );
}

function SecuritySummary({ data }) {
  return (
    <div className="rounded-panel border border-line bg-surface px-4 sm:px-5">
      <KeyValueList
        items={[
          ['HTTPS enabled', data.https?.enabled],
          ['TLS authorized', data.tls?.authorized],
          ['TLS protocol', data.tls?.protocol],
          ['Redirect count', data.https?.redirectCount],
        ]}
      />
    </div>
  );
}

export default function CheckSummary({ category, data }) {
  if (category === 'seo') return <SeoSummary data={data} />;
  if (category === 'security') return <SecuritySummary data={data} />;

  if (category === 'accessibility') {
    const summary = data.summary || {};
    return (
      <>
        <SummaryTable
          items={[
            ['Violations', summary.totalViolations],
            ['Affected elements', summary.affectedElements],
            ['Passed rules', summary.passedRules],
            ['Incomplete rules', summary.incompleteRules],
          ]}
          title="Accessibility results"
        />
        {summary.byImpact && (
          <section className="mt-4 rounded-panel border border-line bg-surface">
            <h3 className="border-b border-line px-4 py-3 text-xs font-semibold">
              Violations by impact
            </h3>
            <KeyValueList
              items={Object.entries(summary.byImpact).map(([impact, count]) => [
                humanize(impact),
                count,
              ])}
            />
          </section>
        )}
      </>
    );
  }

  if (category === 'links') {
    const summary = data.summary || {};
    return (
      <>
        <SummaryTable
          items={[
            ['Checked internal links', summary.checkedLinks],
            ['Broken links', summary.brokenLinks],
            ['Network errors', summary.networkErrors],
            ['Unchecked internal links', summary.uncheckedInternal],
            ['Internal links', summary.internalLinks],
            ['External links', summary.externalLinks],
          ]}
          title="Link check summary"
        />
        <p className="mt-2 text-xs leading-5 text-muted">
          External links are collected but are not requested for validation.
        </p>
      </>
    );
  }

  if (category === 'browser') {
    return (
      <SummaryTable
        items={[
          ['Page errors', Array.isArray(data.pageErrors) ? data.pageErrors.length : undefined],
          ['Recorded issues', Array.isArray(data.issues) ? data.issues.length : undefined],
          ['Failed requests', Array.isArray(data.failedRequests) ? data.failedRequests.length : undefined],
          ['HTTP errors', Array.isArray(data.httpErrors) ? data.httpErrors.length : undefined],
        ]}
        title="Browser diagnostics"
      />
    );
  }

  return null;
}
