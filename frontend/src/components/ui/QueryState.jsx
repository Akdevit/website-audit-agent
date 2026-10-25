import { AlertCircle, FileSearch, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export function ErrorState({
  error,
  onRetry,
  title = "Could not load this page",
}) {
  return (
    <div
      role="alert"
      className="rounded-panel border border-poor/15 bg-poor-soft/60 p-6"
    >
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-poor" />
        <div>
          <h2 className="text-sm font-medium">{title}</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted">
            {error?.message || "Something went wrong. Please try again."}
          </p>
          {onRetry && (
            <Button variant="secondary" onClick={onRetry} className="mt-4">
              <RefreshCw size={14} />
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title = "No audits yet",
  description = "Run an audit to see your reports here.",
  action,
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-5 flex size-16 items-center justify-center rounded-2xl border border-brand/10 bg-brand-soft text-brand"><FileSearch size={28} strokeWidth={1.4} /></span>
      <h2 className="text-base font-medium">{title}</h2>
      <p className="mt-2 mb-5 max-w-sm text-sm leading-6 text-muted">
        {description}
      </p>
      {action}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="space-y-6 motion-safe:animate-pulse"
    >
      <div className="h-8 w-48 rounded bg-canvas" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((value) => (
          <div key={value} className="h-24 rounded-lg bg-canvas" />
        ))}
      </div>
      <div className="h-72 rounded-lg bg-canvas" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
