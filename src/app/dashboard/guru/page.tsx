import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, StatCard, Badge, EmptyState } from "@/components/ui";

export default async function GuruDashboard() {
  const session = await requireRole("GURU");

  const [mapel, tugas, pengumpulan, siswaIds, jadwalHari, tugasTerbaru] = await Promise.all([
    prisma.mapel.findMany({ where: { guruId: session.userId }, include: { kelas: true } }),
    prisma.tugas.findMany({ where: { guruId: session.userId }, include: { mapel: true } }),
    prisma.pengumpulan.count({ where: { tugas: { guruId: session.userId } } }),
    prisma.kelasSiswa.findMany({
      where: { kelas: { mapel: { some: { guruId: session.userId } } } },
      select: { siswaId: true },
    }),
    prisma.jadwal.findMany({
      where: { guruId: session.userId },
      include: { kelas: true },
      orderBy: [{ hari: "asc" }, { jamMulai: "asc" }],
    }),
    prisma.tugas.findMany({
      where: { guruId: session.userId },
      include: { mapel: true, kelas: true, _count: { select: { pengumpulan: true } } },
      orderBy: { deadline: "asc" },
      take: 5,
    }),
  ]);

  const hariIni = new Date().toLocaleDateString("id-ID", { weekday: "long" });

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Dashboard Guru</h1>
      <p className="-mt-3 text-sm text-slate-500">Selamat datang, {session.name}.</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Mata Pelajaran" value={mapel.length} tone="emerald" />
        <StatCard label="Tugas Dibuat" value={tugas.length} tone="blue" />
        <StatCard label="Total Pengumpulan" value={pengumpulan} tone="amber" />
        <StatCard label="Siswa Diajar" value={siswaIds.length} tone="violet" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Tugas Terdekat" desc="Diurutkan dari deadline terdekat">
          {tugasTerbaru.length === 0 ? (
            <EmptyState message="Belum ada tugas dibuat." />
          ) : (
            <ul className="space-y-3">
              {tugasTerbaru.map((t) => (
                <li key={t.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{t.judul}</p>
                      <p className="text-xs text-slate-500">
                        {t.mapel.nama} • {t.kelas.name}
                      </p>
                    </div>
                    <Badge tone={t._count.pengumpulan > 0 ? "green" : "amber"}>
                      {t._count.pengumpulan} masuk
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Deadline:{" "}
                    {new Date(t.deadline).toLocaleDateString("id-ID", {
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

        <Card title="Jadwal Mengajar" desc={`Hari ini: ${hariIni}`}>
          {jadwalHari.length === 0 ? (
            <EmptyState message="Belum ada jadwal." />
          ) : (
            <ul className="space-y-2">
              {jadwalHari.map((j) => (
                <li
                  key={j.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{j.mapel}</p>
                    <p className="text-xs text-slate-500">
                      {j.kelas.name} • {j.ruangan ?? "-"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-slate-700">
                      {j.jamMulai}-{j.jamSelesai}
                    </p>
                    <p className="text-[11px] text-slate-400">{j.hari}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Mata Pelajaran Anda">
        {mapel.length === 0 ? (
          <EmptyState message="Belum ada mata pelajaran yang diampu." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {mapel.map((m) => (
              <Badge key={m.id} tone="green">
                {m.nama} ({m.kelas.name})
              </Badge>
            ))}
          </div>
        )}
      </Card>

    </>
  );
}
