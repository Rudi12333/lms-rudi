import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, StatCard, Badge, EmptyState } from "@/components/ui";

export default async function KurikulumDashboard() {
  const session = await requireRole("KURIKULUM");

  const [totalMapel, totalKelas, totalJadwal, mapelTanpaGuru, perKelas] = await Promise.all([
    prisma.mapel.count(),
    prisma.kelas.count(),
    prisma.jadwal.count(),
    prisma.mapel.count({ where: { guruId: null } }),
    prisma.kelas.findMany({
      include: {
        mapel: true,
        waliKelas: true,
        _count: { select: { anggota: true, jadwal: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const jamPerMinggu = totalJadwal;

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Dashboard Kurikulum</h1>
      <p className="-mt-3 text-sm text-slate-500">Selamat datang, {session.name}.</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Mata Pelajaran" value={totalMapel} tone="blue" />
        <StatCard label="Kelas" value={totalKelas} tone="emerald" />
        <StatCard label="Sesi Jadwal/Minggu" value={jamPerMinggu} tone="amber" />
        <StatCard label="Mapel Tanpa Guru" value={mapelTanpaGuru} tone="rose" />
      </div>

      {mapelTanpaGuru > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-800">Perhatian</p>
          <p className="mt-1 text-sm text-amber-700">
            Terdapat {mapelTanpaGuru} mata pelajaran yang belum ditugaskan ke guru. Silakan
            lengkapi melalui menu Mata Pelajaran.
          </p>
        </div>
      ) : null}

      <Card title="Struktur Kelas & Alokasi" desc="Jumlah mapel, siswa, dan sesi jadwal per kelas">
        {perKelas.length === 0 ? (
          <EmptyState message="Belum ada kelas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 pr-3">Kelas</th>
                  <th className="py-2 pr-3">Tingkat</th>
                  <th className="py-2 pr-3">Wali Kelas</th>
                  <th className="py-2 pr-3">Mapel</th>
                  <th className="py-2 pr-3">Siswa</th>
                  <th className="py-2">Sesi Jadwal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {perKelas.map((k) => (
                  <tr key={k.id}>
                    <td className="py-2 pr-3 font-medium text-slate-800">{k.name}</td>
                    <td className="py-2 pr-3 text-slate-600">{k.tingkat}</td>
                    <td className="py-2 pr-3 text-slate-600">{k.waliKelas?.name ?? "-"}</td>
                    <td className="py-2 pr-3 text-slate-600">{k.mapel.length}</td>
                    <td className="py-2 pr-3 text-slate-600">{k._count.anggota}</td>
                    <td className="py-2 text-slate-600">{k._count.jadwal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Distribusi Mata Pelajaran">
        <div className="flex flex-wrap gap-2">
          {perKelas.flatMap((k) =>
            k.mapel.map((m) => (
              <Badge key={m.id} tone={m.guruId ? "green" : "red"}>
                {m.nama} - {k.name}
                {m.guruId ? "" : " (belum ada guru)"}
              </Badge>
            )),
          )}
        </div>
      </Card>
    </>
  );
}
