import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, StatCard, Badge, EmptyState } from "@/components/ui";

export default async function SiswaNilaiPage() {
  const session = await requireRole("SISWA");

  const [nilai, tugasDinilai] = await Promise.all([
    prisma.nilai.findMany({
      where: { siswaId: session.userId },
      orderBy: [{ semester: "asc" }, { mapel: "asc" }],
    }),
    prisma.pengumpulan.aggregate({
      where: { siswaId: session.userId, nilaiTugas: { not: null } },
      _avg: { nilaiTugas: true },
      _count: { nilaiTugas: true },
    }),
  ]);

  const rataAkhir = nilai.length
    ? nilai.reduce((t, n) => t + n.nilaiAkhir, 0) / nilai.length
    : null;
  const rataTugas = tugasDinilai._avg.nilaiTugas;

  const perSemester = new Map<string, typeof nilai>();
  for (const n of nilai) {
    const list = perSemester.get(n.semester) ?? [];
    list.push(n);
    perSemester.set(n.semester, list);
  }

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Nilai Saya</h1>
      <p className="-mt-3 text-sm text-slate-500">
        Nilai akhir per mata pelajaran dan ringkasan nilai tugas.
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Rata-rata Nilai Akhir"
          value={rataAkhir === null ? "-" : rataAkhir.toFixed(1)}
          tone="emerald"
        />
        <StatCard
          label="Rata-rata Nilai Tugas"
          value={rataTugas === null ? "-" : rataTugas.toFixed(1)}
          hint={`${tugasDinilai._count.nilaiTugas} tugas sudah dinilai`}
          tone="blue"
        />
        <StatCard label="Mata Pelajaran Dinilai" value={nilai.length} tone="violet" />
      </div>

      {nilai.length === 0 ? (
        <EmptyState message="Belum ada nilai yang tercatat." />
      ) : (
        [...perSemester.entries()].map(([semester, list]) => {
          const rata = list.reduce((t, n) => t + n.nilaiAkhir, 0) / list.length;
          return (
            <Card
              key={semester}
              title={`Semester ${semester}`}
              desc={`Rata-rata ${rata.toFixed(1)}`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                      <th className="py-2 pr-3">Mata Pelajaran</th>
                      <th className="py-2 pr-3">Kelas</th>
                      <th className="py-2 pr-3">Nilai</th>
                      <th className="py-2 pr-3">Predikat</th>
                      <th className="py-2">Catatan Guru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {list.map((n) => (
                      <tr key={n.id}>
                        <td className="py-2 pr-3 font-medium text-slate-800">{n.mapel}</td>
                        <td className="py-2 pr-3 text-slate-600">{n.kelas}</td>
                        <td className="py-2 pr-3 text-slate-800">{n.nilaiAkhir}</td>
                        <td className="py-2 pr-3">
                          <Badge
                            tone={n.nilaiAkhir >= 80 ? "green" : n.nilaiAkhir >= 70 ? "amber" : "red"}
                          >
                            {n.predikat}
                          </Badge>
                        </td>
                        <td className="py-2 text-slate-600">{n.catatan ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })
      )}
    </>
  );
}
