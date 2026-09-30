import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, StatCard, Badge, EmptyState } from "@/components/ui";

export default async function KepsekDashboard() {
  const session = await requireRole("KEPSEK");

  const [totalSiswa, totalGuru, totalKelas, rataAll, nilaiTerendah, pengumuman] =
    await Promise.all([
      prisma.user.count({ where: { role: "SISWA" } }),
      prisma.user.count({ where: { role: "GURU" } }),
      prisma.kelas.count(),
      prisma.nilai.aggregate({ _avg: { nilaiAkhir: true } }),
      prisma.nilai.findMany({
        include: { siswa: true },
        orderBy: { nilaiAkhir: "asc" },
        take: 5,
      }),
      prisma.pengumuman.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
    ]);

  const rata = rataAll._avg.nilaiAkhir;

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Dashboard Kepala Sekolah</h1>
      <p className="-mt-3 text-sm text-slate-500">Selamat datang, {session.name}.</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Siswa" value={totalSiswa} tone="blue" />
        <StatCard label="Total Guru" value={totalGuru} tone="emerald" />
        <StatCard label="Kelas Aktif" value={totalKelas} tone="amber" />
        <StatCard
          label="Rata-rata Nilai Sekolah"
          value={rata ? rata.toFixed(1) : "-"}
          tone="violet"
        />
      </div>

      <Card title="Nilai Terendah" desc="Siswa yang perlu perhatian khusus">
        {nilaiTerendah.length === 0 ? (
          <EmptyState message="Belum ada data nilai." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {nilaiTerendah.map((n) => (
              <li key={n.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{n.siswa.name}</p>
                  <p className="text-xs text-slate-500">
                    {n.mapel} • {n.kelas}
                  </p>
                </div>
                <Badge tone={n.nilaiAkhir < 70 ? "red" : "amber"}>{n.nilaiAkhir}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Pengumuman Terbaru">
        {pengumuman.length === 0 ? (
          <EmptyState message="Belum ada pengumuman." />
        ) : (
          <ul className="space-y-3">
            {pengumuman.map((p) => (
              <li key={p.id} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-800">{p.judul}</p>
                <p className="mt-1 text-sm text-slate-600">{p.isi}</p>
                <p className="mt-1.5 text-xs text-slate-400">
                  {p.author.name} •{" "}
                  {p.createdAt.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
