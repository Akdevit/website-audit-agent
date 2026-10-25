import { ArrowRight, ArrowUpRight, FolderClock, LayoutDashboard, Plus, ScanLine } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { Link, NavLink } from 'react-router';
import { brand } from '@/config/brand';
import { cn } from '@/lib/cn';

const navigation = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/audits', label: 'All audits', icon: FolderClock, end: true },
  { to: '/audits/new', label: 'New audit', icon: Plus },
];

export default function WorkspaceSidebar({ onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-sidebar px-5 py-7 text-slate-300">
      <Link to="/" onClick={onNavigate} className="mx-1 w-fit" aria-label={`${brand.name} home`}>
        <BrandLogo inverse />
      </Link>
      <div className="mt-9 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-semibold text-white">W</span>
        <div><p className="text-xs font-medium text-white">My workspace</p><p className="mt-1 text-[10px] text-slate-400">Website intelligence</p></div>
      </div>
      <p className="mt-8 mb-3 px-3 text-[10px] font-semibold tracking-[0.16em] text-slate-400">WORKSPACE</p>
      <nav aria-label="Main navigation" className="space-y-1.5">
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate}
            className={({ isActive }) => cn('group flex items-center gap-3 rounded-control px-3 py-3 text-[13px] transition-colors', isActive ? 'bg-[#203c3d] font-medium text-[#a2e4d5]' : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
            {({ isActive }) => <><Icon size={18} strokeWidth={1.7} />{label}{isActive && <span className="ml-auto size-1.5 rounded-full bg-[#78d2bc]" />}</>}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-12">
        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
          <ScanLine size={22} className="mb-4 text-[#78d2bc]" strokeWidth={1.5} />
          <p className="text-[13px] font-medium text-white">A clearer picture.</p>
          <p className="mt-2 text-[11px] leading-5 text-slate-400">Six audit categories. One place to find your next improvement.</p>
          <Link to="/audits/new" onClick={onNavigate} className="mt-4 flex items-center justify-between text-xs font-medium text-[#a2e4d5] hover:text-white">Explore your website <ArrowUpRight size={15} /></Link>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-white/10 px-1 pt-5">
          <span className="text-[10px] text-slate-400">Built for better websites</span>
          <ArrowRight size={13} className="text-slate-400" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

