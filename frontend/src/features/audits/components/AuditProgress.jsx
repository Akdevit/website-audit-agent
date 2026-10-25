import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Link } from "react-router";
import { formatDuration, websiteLabel } from "@/lib/format";

export default function AuditProgress({ request }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="rounded-lg border border-line p-7 sm:p-10" role="status">
      <div className="flex items-center gap-3">
        <LoaderCircle
          size={20}
          strokeWidth={1.6}
          className="motion-safe:animate-spin"
        />
        <h2 className="text-base font-medium">
          {request?.isPaused ? "Waiting for a connection" : "Audit in progress"}
        </h2>
      </div>
      <p className="mt-5 text-sm font-medium">
        {websiteLabel(request?.variables?.url)}
      </p>
      <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
        {request?.isPaused
          ? "The request will start when your connection returns."
          : "Checks can take a few minutes. Your report will open here when the request finishes."}
      </p>
      <p className="mt-4 font-mono text-xs text-muted">
        Elapsed{" "}
        {formatDuration(Math.max(0, now - (request?.submittedAt || now)))}
      </p>
      <div className="mt-7 border-t border-line pt-5">
        <Link
          to="/audits"
          className="text-xs font-medium underline underline-offset-4"
        >
          View audit history
        </Link>
        <p className="mt-2 text-xs leading-5 text-muted">
          You can navigate within this workspace. Keep the browser tab open for
          this request.
        </p>
      </div>
    </div>
  );
}
