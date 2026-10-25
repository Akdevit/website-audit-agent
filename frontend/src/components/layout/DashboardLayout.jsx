import { Suspense, useEffect, useRef, useState } from "react";
import { PageSkeleton } from '@/components/ui/QueryState';
import { useIsMutating } from "@tanstack/react-query";
import { ChevronRight, LoaderCircle, Menu, RefreshCw, X } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";
import WorkspaceSidebar from "./WorkspaceSidebar";
import { useHealthQuery } from "@/hooks/useHealthQuery";
import { auditKeys } from "@/features/audits/api/audit-keys";
import { cn } from "@/lib/cn";
import { brand } from '@/config/brand';
import { BrandMark } from '@/components/brand/BrandLogo';

export default function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const dialog = useRef(null);
  const location = useLocation();
  const health = useHealthQuery();
  const creating = useIsMutating({ mutationKey: auditKeys.create() });
  const isDetail = /^\/audits\/(?!new$)[^/]+$/.test(location.pathname);
  const title =
    location.pathname === "/"
      ? "Overview"
      : location.pathname === "/audits/new"
        ? "New audit"
        : location.pathname === "/audits"
          ? "All audits"
          : isDetail
            ? "Audit report"
            : "Page not found";
  useEffect(() => {
    if (menuOpen && !dialog.current.open) dialog.current.showModal();
    else if (!menuOpen && dialog.current.open) dialog.current.close();
  }, [menuOpen]);
  useEffect(() => {
    document.title = `${title} · ${brand.name}`;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [title, location.pathname]);

  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="sr-only fixed top-3 left-3 z-50 rounded-lg bg-white p-3 focus:not-sr-only"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-sidebar bg-sidebar min-[1000px]:block">
        <WorkspaceSidebar />
      </aside>
      <dialog
        ref={dialog}
        id="mobile-navigation"
        aria-label="Navigation menu"
        onClose={() => setMenuOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setMenuOpen(false);
        }}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[85vw] border-0 p-0"
      >
        <button
          onClick={() => setMenuOpen(false)}
          className="absolute top-2 right-2 rounded p-2 text-slate-300 hover:bg-white/10"
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
        <WorkspaceSidebar onNavigate={() => setMenuOpen(false)} />
      </dialog>
      <div className="min-[1000px]:pl-sidebar">
        <header className="flex h-[72px] items-center justify-between gap-3 border-b border-line bg-surface px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
              aria-controls="mobile-navigation"
              aria-expanded={menuOpen}
              className="rounded p-2 text-muted min-[1000px]:hidden"
            >
              <Menu size={19} />
            </button>
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight sm:hidden" aria-label={`${brand.name} home`}><BrandMark className="size-7 text-brand" />{brand.name}</Link>
            <nav
              aria-label="Breadcrumb"
              className="hidden items-center gap-2.5 text-xs sm:flex"
            >
              <Link
                to="/"
                className="hidden text-muted hover:text-ink sm:inline"
              >
                {brand.name}
              </Link>
              <ChevronRight
                size={12}
                className="hidden text-muted/60 sm:block"
              />
              {isDetail && (
                <>
                  <Link
                    to="/audits"
                    className="hidden text-muted hover:text-ink sm:inline"
                  >
                    All audits
                  </Link>
                  <ChevronRight
                    size={12}
                    className="hidden text-muted/60 sm:block"
                  />
                </>
              )}
              <span className="font-medium" aria-current="page">
                {title}
              </span>
            </nav>
          </div>
          <div className="flex items-center gap-3 sm:gap-5"><button
            onClick={() => health.refetch()}
            disabled={health.isFetching}
            aria-label="Check backend connection"
            className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-canvas/50 px-3 py-2 text-[11px] text-muted hover:bg-canvas disabled:cursor-default"
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                health.isError
                    ? "bg-attention"
                  : health.isSuccess
                      ? "bg-good"
                      : "bg-neutral",
              )}
            />
            <span role="status">
              {health.isPending
                ? "Connecting"
                : health.isError
                  ? "API offline"
                  : "API connected"}
            </span>
            <RefreshCw
              size={11}
              className={health.isFetching ? "motion-safe:animate-spin" : ""}
            />
          </button>
          <span className="hidden border-l border-line pl-5 sm:block" title={brand.name}><BrandMark className="size-8 text-brand" /></span></div>
        </header>
        {!!creating && location.pathname !== "/audits/new" && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-canvas/60 px-5 py-3 text-xs sm:px-10"
          >
            <span className="flex items-center gap-2">
              <LoaderCircle size={13} className="motion-safe:animate-spin" />
              An audit request is in progress.
            </span>
            <Link
              to="/audits"
              className="font-medium underline underline-offset-4"
            >
              View audits
            </Link>
          </div>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-workspace px-5 py-7 outline-none sm:px-8 sm:py-8"
        >
          <Suspense fallback={<PageSkeleton />}><Outlet /></Suspense>
        </main>
      </div>
    </div>
  );
}
