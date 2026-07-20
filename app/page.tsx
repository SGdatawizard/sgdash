import Header from '@/components/Header';
import DashboardClient from '@/components/DashboardClient';
import { getAllKpis } from '@/lib/kpi-service';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const kpis = await getAllKpis();
  return (
    <>
      <Header />
      <main className="min-h-screen bg-canvas">
        <DashboardClient kpis={kpis} />
      </main>
      <footer className="border-t border-line py-6 mt-4">
        <div className="mx-auto max-w-7xl px-6 md:px-10 text-[11px] text-ink/40 tracking-wide2 uppercase">
          Stanley Gibbons Auctions &middot; Internal use only
        </div>
      </footer>
    </>
  );
}
