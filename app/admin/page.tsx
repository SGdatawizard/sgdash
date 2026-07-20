import Header from '@/components/Header';
import AdminClient from '@/components/admin/AdminClient';
import { getAllKpis } from '@/lib/kpi-service';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const kpis = await getAllKpis();
  return (
    <>
      <Header />
      <main className="min-h-screen bg-canvas">
        <AdminClient initialKpis={kpis} />
      </main>
    </>
  );
}
