import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, StatCard, Badge, EmptyState } from "@/components/ui";

function formatDate(d: Date) {
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default async function SiswaDashboard() {
  const session = await requireRole("SISWA");

  const milikKelasSaya = { kelas: { anggota: { some: { siswaId: session.userId } } } };

  const [kelas, tugas, pengumpulan, nilai, jadwal, rataRata, tugasBelum, belumDikumpulkan] =
    await Promise.all([
    prisma.kelasSiswa.findMany({
      where: { siswaId: session.userId },
      include: { kelas: { include: { mapel: { include: { guru: true } } } } },
    }),
    prisma.tugas.count({ where: { kelas: { anggota: { some: { siswaId: session.userId } } } } }),
    prisma.pengumpulan.findMany({
      where: { siswaId: session.userId },
      include: { tugas: { include: { mapel: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.nilai.findMany({
      where: { siswaId: session.userId },
      orderBy: { mapel: "asc" },
    }),
    prisma.jadwal.findMany({
      where: { kelas: { anggota: { some: { siswaId: session.userId } } } },
      include: { kelas: true, guru: true },
      orderBy: [{ hari: "asc" }, { jamMulai: "asc" }],
    }),
    prisma.nilai.aggregate({
      where: { siswaId: session.userId },
      _avg: { nilaiAkhir: true },
    }),
    prisma.tugas.findMany({
      where: { ...milikKelasSaya, pengumpulan: { none: { siswaId: session.userId } } },
      include: { mapel: true },
      orderBy: { deadline: "asc" },
      take: 5,
    }),
    prisma.tugas.count({
      where: { ...milikKelasSaya, pengumpulan: { none: { siswaId: session.userId } } },
    }),
  ]);

  const now = new Date();
  const rata = rataRata._avg.nilaiAkhir;

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Dashboard Siswa</h1>
      <p className="-mt-3 text-sm text-slate-500">Selamat datang, {session.name}.</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Kelas" value={kelas.length} tone="blue" />
        <StatCard label="Tugas Diberikan" value={tugas} tone="amber" />
        <StatCard label="Belum Dikumpulkan" value={belumDikumpulkan} tone="rose" />
        <StatCard
          label="Rata-rata Nilai"
          value={rata ? rata.toFixed(1) : "-"}
          tone="emerald"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Kelas Saya">
          {kelas.length === 0 ? (
            <EmptyState message="Anda belum terdaftar di kelas manapun." />
          ) : (
            <ul className="space-y-3">
              {kelas.map(({ kelas: k }) => (
                <li key={k.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{k.name}</p>
                    <Badge tone="blue">TA {k.tahunAjaran}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {k.mapel.map((m) => (
                      <Badge key={m.id} tone="slate">
                        {m.nama}
                        {m.guru ? ` - ${m.guru.name.split(",")[0]}` : ""}
                      </Badge>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Jadwal Saya" desc="Minggu ini">
          {jadwal.length === 0 ? (
            <EmptyState message="Belum ada jadwal." />
          ) : (
            <ul className="space-y-2">
              {jadwal.map((j) => (
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

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Tugas Belum Dikumpulkan" desc="Diurutkan dari deadline terdekat">
          {tugasBelum.length === 0 ? (
            <EmptyState message="Tidak ada tugas yang menunggu." />
          ) : (
            <ul className="space-y-2">
              {tugasBelum.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{t.judul}</p>
                    <p className="text-xs text-slate-500">
                      {t.mapel.nama} • {formatDate(t.deadline)}
                    </p>
                  </div>
                  <Badge tone={t.deadline < now ? "red" : "amber"}>
                    {t.deadline < now ? "Lewat" : "Menunggu"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/siswa/tugas"
            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Lihat semua tugas →
          </Link>
        </Card>

        <Card title="Riwayat Pengumpulan">
          {pengumpulan.length === 0 ? (
            <EmptyState message="Belum ada tugas yang dikumpulkan." />
          ) : (
            <ul className="space-y-2">
              {pengumpulan.map((p) => (
                <li key={p.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {p.tugas.judul}
                    </p>
                    {p.nilaiTugas !== null ? (
                      <Badge tone="green">{p.nilaiTugas}</Badge>
                    ) : (
                      <Badge tone="amber">Menunggu nilai</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {p.tugas.mapel.nama} • dikumpulkan {formatDate(p.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Nilai Saya">
        {nilai.length === 0 ? (
          <EmptyState message="Belum ada nilai yang tercatat." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 pr-3">Mata Pelajaran</th>
                  <th className="py-2 pr-3">Kelas</th>
                  <th className="py-2 pr-3">Semester</th>
                  <th className="py-2 pr-3">Nilai</th>
                  <th className="py-2">Predikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {nilai.map((n) => (
                  <tr key={n.id}>
                    <td className="py-2 pr-3 font-medium text-slate-800">{n.mapel}</td>
                    <td className="py-2 pr-3 text-slate-600">{n.kelas}</td>
                    <td className="py-2 pr-3 text-slate-600">{n.semester}</td>
                    <td className="py-2 pr-3 text-slate-800">{n.nilaiAkhir}</td>
                    <td className="py-2">
                      <Badge tone={n.nilaiAkhir >= 80 ? "green" : "amber"}>{n.predikat}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
