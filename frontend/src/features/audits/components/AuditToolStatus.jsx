import { auditCategories } from '../constants/audit-categories';

function toolState(audit, id) {
  if (audit.results?.[id]) {
    return { label: 'Results saved', detail: 'Review the recorded findings.' };
  }
  const error = audit.toolErrors?.[id];
  if (error) {
    return {
      label: 'Failed',
      detail:
        typeof error === 'string'
          ? error
          : error.message || 'The tool reported an error.',
    };
  }
  if (['pending', 'running'].includes(audit.status)) {
    return { label: 'Pending', detail: 'The audit has not finished.' };
  }
  if (audit.status === 'failed') {
    return {
      label: 'Not recorded',
      detail: 'The audit stopped before a tool result was saved.',
    };
  }
  return {
    label: 'Not run',
    detail: 'No result or tool error was recorded for this check.',
  };
}

export default function AuditToolStatus({ audit }) {
  return (
    <section className="mt-6" aria-labelledby="tool-status-title">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="tool-status-title" className="text-sm font-semibold">
          Audit checks
        </h2>
        <p className="text-xs text-muted">
          Saved results indicate execution, not a passing check.
        </p>
      </div>
      <div className="overflow-x-auto rounded-panel border border-line bg-surface">
        <table className="w-full min-w-[560px] text-left text-xs">
          <caption className="sr-only">
            Execution status of each website audit tool.
          </caption>
          <thead className="border-b border-line bg-canvas/70 text-[11px] text-muted">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">Check</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {auditCategories.map(({ id, label }) => {
              const state = toolState(audit, id);
              return (
                <tr key={id} className="align-top">
                  <th scope="row" className="px-4 py-3 font-medium">{label}</th>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={
                        state.label === 'Failed'
                          ? 'font-medium text-poor'
                          : state.label === 'Results saved'
                            ? 'text-ink'
                            : 'text-muted'
                      }
                    >
                      {state.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 leading-5 text-muted">{state.detail}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
