import { requireRole } from "@/lib/auth";
import { Card } from "@/components/ui";
import { JadwalTable } from "@/components/views";

export default async function AdminJadwalPage() {
  await requireRole("ADMIN");
  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Jadwal Pelajaran</h1>
      <p className="-mt-3 text-sm text-slate-500">
        Jadwal lengkap sekolah. Penyusunan jadwal dilakukan Kurikulum.
      </p>
      <Card title="Jadwal Mingguan">
        <JadwalTable scope="semua" />
      </Card>
    </>
  );
}
