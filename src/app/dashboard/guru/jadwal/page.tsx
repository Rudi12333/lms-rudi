import { requireRole } from "@/lib/auth";
import { Card } from "@/components/ui";
import { JadwalTable } from "@/components/views";

export default async function GuruJadwalPage() {
  const session = await requireRole("GURU");
  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Jadwal Mengajar</h1>
      <p className="-mt-3 text-sm text-slate-500">
        Jadwal mengajar Anda. Perubahan jadwal dilakukan oleh Kurikulum.
      </p>
      <Card title="Jadwal Mingguan">
        <JadwalTable scope="guru" id={session.userId} />
      </Card>
    </>
  );
}
