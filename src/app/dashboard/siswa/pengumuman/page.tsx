import { requireRole } from "@/lib/auth";
import { Card } from "@/components/ui";
import { PengumumanList } from "@/components/views";

export default async function SiswaPengumumanPage() {
  const session = await requireRole("SISWA");
  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Pengumuman</h1>
      <p className="-mt-3 text-sm text-slate-500">
        Informasi terbaru dari sekolah dan guru.
      </p>
      <Card title="Daftar Pengumuman">
        <PengumumanList role="SISWA" userId={session.userId} canDelete={false} />
      </Card>
    </>
  );
}
