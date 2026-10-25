import { categoryFindings, severityGroup, severityTone } from '../lib/audit-insights';
import { auditCategories } from '../constants/audit-categories';

const severityOrder = { high: 0, medium: 1, low: 2, unknown: 3 };
const categoryLabels = {
  lighthouse: 'Lighthouse',
  seo: 'SEO',
  accessibility: 'Accessibility',
  browser: 'Browser diagnostics',
  links: 'Links',
  security: 'Security',
};
const lighthouseCategoryLabels = {
  performance: 'Performance',
  accessibility: 'Accessibility',
  'best-practices': 'Best Practices',
  seo: 'SEO',
};

function normalizeId(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function collectFindings(results, selectedCategory) {
  const records = [];
  const byLighthouseRule = new Map();

  for (const { id, label } of auditCategories) {
    if (selectedCategory && id !== selectedCategory) continue;
    for (const finding of categoryFindings(results?.[id])) {
      const ruleId = normalizeId(finding.id);
      if (ruleId && ['lighthouse', 'accessibility'].includes(id)) {
        const existingIndex = byLighthouseRule.get(ruleId);
        if (existingIndex !== undefined) {
          const existing = records[existingIndex];
          const preferred = id === 'accessibility' ? finding : existing.finding;
          records[existingIndex] = {
            ...existing,
            finding: {
              ...finding,
              ...existing.finding,
              ...preferred,
              description:
                preferred.description ||
                finding.description ||
                existing.finding.description,
              displayValue:
                preferred.displayValue ||
                finding.displayValue ||
                existing.finding.displayValue,
              recommendation:
                preferred.recommendation ||
                finding.recommendation ||
                existing.finding.recommendation,
              evidence: [
                existing.finding.details,
                existing.finding.evidence,
                finding.details,
                finding.evidence,
              ].filter(Boolean),
            },
            category: preferred === finding ? id : existing.category,
            label:
              preferred === finding ? label : existing.label,
          };
          continue;
        }
        byLighthouseRule.set(ruleId, records.length);
      }
      const lighthouseCategories = Array.isArray(finding.categories)
        ? finding.categories
            .map((categoryId) => lighthouseCategoryLabels[categoryId])
            .filter(Boolean)
        : [];
      records.push({
        finding,
        category: id,
        label:
          id === 'lighthouse' && lighthouseCategories.length
            ? [...new Set(lighthouseCategories)].join(', ')
            : categoryLabels[id] || label,
      });
    }
  }

  return records.sort((left, right) => {
    const leftSeverity = severityGroup(
      left.finding.severity || left.finding.impact,
    );
    const rightSeverity = severityGroup(
      right.finding.severity || right.finding.impact,
    );
    return severityOrder[leftSeverity] - severityOrder[rightSeverity];
  });
}

function displayEvidence(value) {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(displayEvidence).join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value, null, 2);
  return null;
}

export default function AuditIssuesTable({ results, category }) {
  const findings = collectFindings(results, category);
  const title = category
    ? `${category === 'lighthouse' ? 'Performance' : categoryLabels[category] || category} findings`
    : 'Issues and recommendations';

  return (
    <section className="mt-5" aria-labelledby="issues-title">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="issues-title" className="text-sm font-semibold">
          {title}
        </h2>
        <span className="text-xs text-muted">
          {findings.length} recorded
        </span>
      </div>
      {!findings.length ? (
        <p className="rounded-control border border-line bg-surface px-4 py-5 text-sm text-muted">
          No findings were saved for this check.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-panel border border-line bg-surface">
          <table className="w-full min-w-[760px] text-left text-xs">
            <caption className="sr-only">
              Audit findings ordered by severity, with expandable evidence and
              recommendations.
            </caption>
            <thead className="border-b border-line bg-canvas/70 text-[11px] text-muted">
              <tr>
                {['Severity', 'Issue', 'Category', 'Description', 'Recommended fix'].map(
                  (heading) => (
                    <th key={heading} scope="col" className="px-3 py-2.5 font-medium">
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {findings.map(({ finding, category: findingCategory, label }, index) => {
                const severity = finding.severity || finding.impact;
                const issue =
                  finding.title ||
                  finding.help ||
                  finding.message ||
                  finding.id ||
                  finding.url ||
                  'Recorded finding';
                const description =
                  finding.description ||
                  finding.message ||
                  finding.displayValue ||
                  finding.reason ||
                  '—';
                const recommendation =
                  finding.recommendation || finding.fix || finding.suggestion;
                const evidence = [
                  ['Evidence', finding.evidence],
                  ['Diagnostic details', finding.details],
                  ['Affected elements', finding.nodes],
                  ['Guidance', finding.help],
                  ['URL', finding.url],
                  ['Status code', finding.statusCode],
                  ['Rule', finding.id],
                ]
                  .map(([name, value]) => [name, displayEvidence(value)])
                  .filter(([, value]) => value);

                return (
                  <tr key={`${findingCategory}-${finding.key || index}`} className="align-top">
                    <td className="whitespace-nowrap px-3 py-3">
                      {severity ? (
                        <span className={`text-[11px] font-medium capitalize tone-${severityTone(severity)}`}>
                          {severity}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted">Unspecified</span>
                      )}
                    </td>
                    <td className="max-w-56 px-3 py-3">
                      <details className="group">
                        <summary className="cursor-pointer list-none font-medium leading-5 text-ink marker:hidden group-open:text-brand">
                          <span className="mr-1.5 text-muted" aria-hidden="true">+</span>
                          <span className="break-words">{issue}</span>
                        </summary>
                        <div className="mt-3 space-y-2 border-l border-line pl-3 text-[11px] leading-5 text-muted">
                          {evidence.map(([name, value]) => (
                            <div key={name}>
                              <p className="font-medium text-ink">{name}</p>
                              <pre className="mt-1 whitespace-pre-wrap break-words font-sans">{value}</pre>
                            </div>
                          ))}
                          {!evidence.length && (
                            <p>No additional evidence was saved.</p>
                          )}
                        </div>
                      </details>
                    </td>
                    <td className="px-3 py-3 text-muted">{label}</td>
                    <td className="max-w-64 px-3 py-3 leading-5 text-muted">
                      <p className="line-clamp-3 break-words">{description}</p>
                    </td>
                    <td className="max-w-64 px-3 py-3 leading-5 text-muted">
                      {recommendation ? (
                        <p className="break-words">{recommendation}</p>
                      ) : (
                        <span className="text-muted">Not recorded</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
