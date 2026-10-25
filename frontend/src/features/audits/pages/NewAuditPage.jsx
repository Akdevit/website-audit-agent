import { useMutationState } from "@tanstack/react-query";
import { useRef } from "react";
import { Check, ChevronRight, ScanLine, ShieldCheck } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import PageHeader from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/QueryState";
import AuditSetupForm from "../components/AuditSetupForm";
import AuditProgress from "../components/AuditProgress";
import { auditKeys } from "../api/audit-keys";
import { useCreateAudit } from "../hooks/useAudits";
import { auditCategories } from '../constants/audit-categories';

export default function NewAuditPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const mutation = useCreateAudit();
  const submitting = useRef(false);
  const requests = useMutationState({
    filters: { mutationKey: auditKeys.create(), status: "pending" },
    select: (entry) => ({
      variables: entry.state.variables,
      submittedAt: entry.state.submittedAt,
      isPaused: entry.state.isPaused,
    }),
  });
  const current = requests.at(-1);
  function submit(input) {
    if (current || submitting.current) return;
    submitting.current = true;
    mutation.mutate(input, {
      onSuccess: (audit) => navigate(`/audits/${audit.id || audit._id}`),
      onSettled: () => {
        submitting.current = false;
      },
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="A BETTER WEBSITE STARTS HERE"
        title="New audit"
        description="Set your focus. We'll help you see what needs attention."
      />
      <ol
        className="mb-7 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-4 text-xs sm:gap-5"
        aria-label="Audit steps"
      >
        <li className="flex items-center gap-2 font-medium" aria-current={!current ? 'step' : undefined}>
          <span className="step-marker bg-brand text-white">
            {current ? <Check size={11} /> : "1"}
          </span>
          Configure
          <ChevronRight
            size={12}
            className="ml-1 text-muted/50"
            aria-hidden="true"
          />
        </li>
        <li
          className={`flex items-center gap-3 ${current ? "text-ink" : "text-muted"}`}
          aria-current={current ? 'step' : undefined}
        >
          <span className={`step-marker ${current ? 'bg-brand text-white' : 'bg-canvas text-muted'}`}>2</span> Run checks
          <ChevronRight
            size={12}
            className="text-muted/50"
            aria-hidden="true"
          />
        </li>
        <li className="flex items-center gap-2 text-muted"><span className="step-marker bg-canvas">3</span> Report</li>
      </ol>
      <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,680px)_minmax(200px,1fr)]">
        <div className="min-w-0">
          {mutation.isError && !current && (
            <div className="mb-6">
              <ErrorState
                title="The audit request failed"
                error={mutation.error}
              />
            </div>
          )}
          {current ? (
            <AuditProgress request={current} />
          ) : (
            <div className="panel p-6 sm:p-7">
              <div className="mb-7 flex items-center gap-3 border-b border-line pb-5"><span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand"><ScanLine size={20} /></span><div><h2 className="text-sm font-semibold">Audit configuration</h2><p className="mt-1 text-xs text-muted">One page. The checks that matter to you.</p></div></div>
              <AuditSetupForm
                key={`${params.get("url")}-${params.get("focus")}-${params.get("device")}`}
                onSubmit={submit}
                defaultUrl={params.get("url") || ""}
                defaultFocus={params.get("focus") || "complete"}
                defaultDevice={params.get("device") || "mobile"}
              />
            </div>
          )}
        </div>
        <aside className="rounded-panel border border-line bg-surface p-6">
          <p className="mb-3 text-[10px] font-semibold tracking-[0.14em] text-brand">FROM URL TO ACTION</p>
          <h2 className="text-base font-semibold tracking-tight">What to expect</h2>
          <ol className="mt-5 space-y-5 text-xs leading-6 text-muted">
            <li>
              <span className="mb-1 block font-medium text-ink">
                01 / Page checks
              </span>
              The agent checks the supplied page using tools relevant to your
              scope.
            </li>
            <li>
              <span className="mb-1 block font-medium text-ink">
                02 / Findings
              </span>
              Review verified issues, supporting evidence, and suggested fixes.
            </li>
            <li>
              <span className="mb-1 block font-medium text-ink">
                03 / Saved report
              </span>
              Open the report again from All audits or export the results as
              JSON.
            </li>
          </ol>
          <div className="mt-6 border-t border-line pt-5"><h3 className="mb-4 text-xs font-medium">Available checks</h3><div className="grid grid-cols-2 gap-x-3 gap-y-4">{auditCategories.map(({id,label,icon:Icon}) => <span key={id} className="flex items-center gap-2 text-[10px] text-muted"><Icon size={14} className="shrink-0 text-brand" />{label}</span>)}</div></div>
          <p className="mt-6 rounded-xl bg-brand-soft p-4 text-xs leading-6 text-muted">
            <ShieldCheck size={18} className="mb-2 text-brand" />
            Automated checks have limits. Review skipped or failed checks
            alongside the results.
          </p>
        </aside>
      </div>
    </>
  );
}
