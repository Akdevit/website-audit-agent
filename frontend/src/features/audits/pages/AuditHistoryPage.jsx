import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Search } from "lucide-react";
import { Input, Select } from '@/components/ui/FormControls';
import ScoreLegend from '../components/ScoreLegend';
import { Navigate, useSearchParams } from "react-router";
import PageHeader from "@/components/ui/PageHeader";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/QueryState";
import AuditTable from "../components/AuditTable";
import { useAuditList } from "../hooks/useAudits";

export default function AuditHistoryPage() {
  const [params, setParams] = useSearchParams();
  const [search,setSearch] = useState('');
  const [status,setStatus] = useState('all');
  const requestedPage = Number(params.get("page") || 1);
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
  const query = useAuditList({ page, limit: 10 });
  const pagination = query.data?.pagination;
  const visible = (query.data?.audits || []).filter((audit) => audit.url.toLowerCase().includes(search.trim().toLowerCase()) && (status === 'all' || audit.status === status));
  if (
    pagination &&
    !query.isPlaceholderData &&
    page > Math.max(1, pagination.totalPages)
  )
    return (
      <Navigate
        replace
        to={`/audits?page=${Math.max(1, pagination.totalPages)}`}
      />
    );
  const total = pagination?.total;
  const first = total ? (page - 1) * 10 + 1 : 0;
  const last = total ? Math.min(page * 10, total) : 0;
  return (
    <>
      <PageHeader
        eyebrow="YOUR AUDIT LIBRARY"
        title="All audits"
        description="Your saved scans, reports, and results."
        action={
          <ButtonLink to="/audits/new">
            <Plus size={15} />
            New audit
          </ButtonLink>
        }
      />
      {query.isError && (
        <div className="mb-5">
          <ErrorState
            error={query.error}
            onRetry={() => query.refetch()}
            title="Could not load audit history"
          />
        </div>
      )}
      <section
        className="panel overflow-hidden"
        aria-labelledby="history-title"
      >
        <div className="flex items-center justify-between px-5 py-4">
          <h2 id="history-title" className="text-sm font-medium">
            Audit history
            {typeof total === "number" && (
              <span className="ml-2 rounded bg-canvas px-1.5 py-0.5 text-[11px] text-muted">
                {total}
              </span>
            )}
          </h2>
          <Button
            variant="ghost"
            disabled={query.isFetching}
            onClick={() => query.refetch()}
            className="min-h-8 px-2 py-1.5 text-xs"
          >
            <RefreshCw
              size={13}
              className={query.isFetching ? "motion-safe:animate-spin" : ""}
            />
            Refresh
          </Button>
        </div>
        <div className="grid gap-3 border-t border-line px-5 py-4 sm:grid-cols-[minmax(0,1fr)_180px]"><Input id="audit-search" label="Search this page" hideLabel icon={Search} placeholder="Find a website on this page" value={search} onChange={(event) => setSearch(event.target.value)} /><Select id="status-filter" label="Status on this page" hideLabel value={status} onChange={(event) => setStatus(event.target.value)} options={[{value:'all',label:'All statuses'},...['completed','failed','running','pending'].map((value) => ({value,label:value[0].toUpperCase()+value.slice(1)}))]} /></div>
        {(query.data || query.isPending) && (
          <AuditTable audits={visible} isLoading={query.isPending} emptyState={search || status !== 'all' ? <EmptyState title="No matches on this page" description="Change the filters or move to another page." action={<Button variant="secondary" onClick={() => {setSearch('');setStatus('all');}}>Clear filters</Button>} /> : undefined} />
        )}
        {!!total && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
            <p className="text-xs text-muted" aria-live="polite">
              {query.isPlaceholderData
                ? "Loading page…"
                : `${first}–${last} of ${total} audits`}
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                className="min-h-8 px-2 py-1.5"
                aria-label="Previous page"
                disabled={page <= 1 || query.isPlaceholderData}
                onClick={() => setParams({ page: String(page - 1) })}
              >
                <ChevronLeft size={14} />
              </Button>
              <span className="text-xs text-muted">
                Page {page} of {Math.max(1, pagination.totalPages)}
              </span>
              <Button
                variant="secondary"
                className="min-h-8 px-2 py-1.5"
                aria-label="Next page"
                disabled={
                  page >= pagination.totalPages || query.isPlaceholderData
                }
                onClick={() => setParams({ page: String(page + 1) })}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </section>
      <div className="mt-4 flex flex-wrap justify-between gap-3"><ScoreLegend /><p className="text-[10px] text-muted">Search and status filters apply to the current page.</p></div>
    </>
  );
}
