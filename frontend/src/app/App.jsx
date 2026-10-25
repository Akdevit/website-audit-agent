import { BrowserRouter, Route, Routes } from "react-router";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { lazy } from 'react';
import NotFoundPage from "@/pages/NotFoundPage";

const OverviewPage = lazy(() => import('@/features/dashboard/pages/OverviewPage'));
const NewAuditPage = lazy(() => import('@/features/audits/pages/NewAuditPage'));
const AuditHistoryPage = lazy(() => import('@/features/audits/pages/AuditHistoryPage'));
const AuditDetailPage = lazy(() => import('@/features/audits/pages/AuditDetailPage'));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="audits" element={<AuditHistoryPage />} />
          <Route path="audits/new" element={<NewAuditPage />} />
          <Route path="audits/:id" element={<AuditDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
