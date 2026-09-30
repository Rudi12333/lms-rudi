import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, EmptyState } from "@/components/ui";

function rata(values: number[]): number | null {
  return values.length ? values.reduce((t, v) => t + v, 0) / values.length : null;
}

export default async function GuruSiswaPage() {
  const session = await requireRole("GURU");

  const [mapel, tugas, pengumpulan, nilai] = await Promise.all([
    prisma.mapel.findMany({
      where: { guruId: session.userId },
      include: {
        kelas: {
          include: {
            anggota: { include: { siswa: true }, orderBy: { siswa: { name: "asc" } } },
          },
        },
      },
      orderBy: { nama: "asc" },
    }),
    prisma.tugas.findMany({
      where: { guruId: session.userId },
      select: { id: true, kelasId: true },
    }),
    prisma.pengumpulan.findMany({
      where: { tugas: { guruId: session.userId } },
      select: { siswaId: true, nilaiTugas: true, tugas: { select: { kelasId: true } } },
    }),
    prisma.nilai.findMany({
      where: { guruId: session.userId },
      select: { siswaId: true, nilaiAkhir: true },
    }),
  ]);

  // Satu kartu per kelas; sebuah kelas bisa diajar guru untuk beberapa mapel.
  const kelasMap = new Map<string, { kelas: (typeof mapel)[number]["kelas"]; mapel: string[] }>();
  for (const m of mapel) {
    const entry = kelasMap.get(m.kelasId) ?? { kelas: m.kelas, mapel: [] };
    entry.mapel.push(m.nama);
    kelasMap.set(m.kelasId, entry);
  }

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Siswa Saya</h1>
      <p className="-mt-3 text-sm text-slate-500">
        Siswa pada kelas yang Anda ajar, beserta progres tugas dan rata-rata nilai.
      </p>

      {kelasMap.size === 0 ? (
        <EmptyState message="Anda belum memiliki mata pelajaran. Hubungi kurikulum." />
      ) : (
        [...kelasMap.values()].map(({ kelas, mapel: daftarMapel }) => {
          const totalTugasKelas = tugas.filter((t) => t.kelasId === kelas.id).length;
          return (
            <Card
              key={kelas.id}
              title={kelas.name}
              desc={`${daftarMapel.join(", ")} • ${kelas.anggota.length} siswa • ${totalTugasKelas} tugas`}
            >
              {kelas.anggota.length === 0 ? (
                <EmptyState message="Belum ada siswa di kelas ini." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                        <th className="py-2 pr-3">Nama</th>
                        <th className="py-2 pr-3">Email</th>
                        <th className="py-2 pr-3">Tugas Terkumpul</th>
                        <th className="py-2 pr-3">Rata-rata Tugas</th>
                        <th className="py-2">Rata-rata Nilai Akhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {kelas.anggota.map(({ siswa }) => {
                        const kumpul = pengumpulan.filter(
                          (p) => p.siswaId === siswa.id && p.tugas.kelasId === kelas.id,
                        );
                        const rataTugas = rata(
                          kumpul.flatMap((p) => (p.nilaiTugas === null ? [] : [p.nilaiTugas])),
                        );
                        const rataAkhir = rata(
                          nilai.filter((n) => n.siswaId === siswa.id).map((n) => n.nilaiAkhir),
                        );
                        return (
                          <tr key={siswa.id}>
                            <td className="py-2 pr-3 font-medium text-slate-800">{siswa.name}</td>
                            <td className="py-2 pr-3 text-slate-600">{siswa.email}</td>
                            <td className="py-2 pr-3">
                              <Badge
                                tone={
                                  totalTugasKelas === 0
                                    ? "slate"
                                    : kumpul.length >= totalTugasKelas
                                      ? "green"
                                      : "amber"
                                }
                              >
                                {kumpul.length}/{totalTugasKelas}
                              </Badge>
                            </td>
                            <td className="py-2 pr-3 text-slate-600">
                              {rataTugas === null ? "-" : rataTugas.toFixed(1)}
                            </td>
                            <td className="py-2">
                              {rataAkhir === null ? (
                                <span className="text-slate-400">-</span>
                              ) : (
                                <Badge
                                  tone={rataAkhir >= 80 ? "green" : rataAkhir >= 70 ? "amber" : "red"}
                                >
                                  {rataAkhir.toFixed(1)}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          );
        })
      )}
    </>
  );
}
