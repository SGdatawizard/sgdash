'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export default function Header() {
  const pathname = usePathname();

  const navItem = (href: string, label: string) => (
    <Link
      href={href}
      className={clsx(
        'text-xs tracking-wide2 uppercase font-medium transition-colors',
        pathname === href ? 'text-gold' : 'text-white/75 hover:text-white'
      )}
    >
      {label}
    </Link>
  );

  return (
    <header>
      <div className="bg-paper border-b border-line">
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full border border-navy/30 flex items-center justify-center text-navy font-display text-sm">
              SG
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg tracking-wide2 text-navy">STANLEY GIBBONS</div>
              <div className="text-[10px] tracking-wide3 uppercase text-ink/50">Auctions &middot; Est. 1856</div>
            </div>
          </div>
          <div className="text-right leading-tight hidden sm:block">
            <div className="font-display text-base text-navy">Performance Room</div>
            <div className="text-[10px] tracking-wide2 uppercase text-ink/45">C-suite KPI Dashboard</div>
          </div>
        </div>
      </div>
      <div className="perf perf-navy" aria-hidden />
      <div className="bg-navy">
        <div className="mx-auto max-w-7xl px-6 md:px-10 h-12 flex items-center justify-between">
          <nav className="flex items-center gap-8">
            {navItem('/', 'Dashboard')}
            {navItem('/admin', 'Data Entry')}
          </nav>
          <span className="text-[10px] tracking-wide2 uppercase text-gold/90">1856 | 2026 &middot; 170 Years</span>
        </div>
      </div>
    </header>
  );
}
