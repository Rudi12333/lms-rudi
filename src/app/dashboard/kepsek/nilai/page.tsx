import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, StatCard } from "@/components/ui";
import { RekapNilaiTable } from "@/components/views";

export default async function KepsekNilaiPage() {
  await requireRole("KEPSEK");

  const [jumlah, rata] = await Promise.all([
    prisma.nilai.count(),
    prisma.nilai.aggregate({ _avg: { nilaiAkhir: true } }),
  ]);

  const r = rata._avg.nilaiAkhir;

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Rekap Nilai</h1>
      <p className="-mt-3 text-sm text-slate-500">
        Capaian akademik seluruh siswa pada tahun ajaran berjalan.
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Jumlah Data Nilai" value={jumlah} tone="violet" />
        <StatCard label="Rata-rata" value={r ? r.toFixed(1) : "-"} tone="emerald" />
        <StatCard
          label="Predikat Rata-rata"
          value={r ? (r >= 80 ? "Baik" : r >= 70 ? "Cukup" : "Perlu Bimbingan") : "-"}
          tone={r && r >= 80 ? "emerald" : "amber"}
        />
      </div>

      <Card title="Seluruh Data Nilai">
        <RekapNilaiTable />
      </Card>
    </>
  );
}
