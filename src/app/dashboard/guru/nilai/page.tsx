import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, EmptyState } from "@/components/ui";
import { Flash } from "@/components/form";
import { createNilai, deleteNilai } from "@/app/actions";
import { pick, type SearchParams } from "@/lib/params";

const SEMESTER = ["Ganjil", "Genap"] as const;

const INPUT_CLASS =
  "w-full rounded-md border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500";

export default async function GuruNilaiPage(props: { searchParams: SearchParams }) {
  const session = await requireRole("GURU");
  const params = await props.searchParams;

  const mapel = await prisma.mapel.findMany({
    where: { guruId: session.userId },
    include: {
      kelas: {
        include: {
          anggota: { include: { siswa: true }, orderBy: { siswa: { name: "asc" } } },
        },
      },
    },
    orderBy: [{ kelas: { name: "asc" } }, { nama: "asc" }],
  });

  const namaMapel = [...new Set(mapel.map((m) => m.nama))];
  const siswaIds = [...new Set(mapel.flatMap((m) => m.kelas.anggota.map((a) => a.siswaId)))];

  const nilai = await prisma.nilai.findMany({
    where: { siswaId: { in: siswaIds }, mapel: { in: namaMapel } },
  });

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Penilaian</h1>
      <p className="-mt-3 text-sm text-slate-500">
        Input nilai akhir siswa per mata pelajaran dan semester. Menyimpan ulang pada semester
        yang sama akan memperbarui nilai sebelumnya.
      </p>

      <Flash sukses={pick(params.sukses)} error={pick(params.error)} />

      {mapel.length === 0 ? (
        <EmptyState message="Anda belum memiliki mata pelajaran. Hubungi kurikulum." />
      ) : (
        mapel.map((m) => (
          <Card
            key={m.id}
            title={`${m.nama} — ${m.kelas.name}`}
            desc={`${m.kelas.anggota.length} siswa • TA ${m.kelas.tahunAjaran}`}
          >
            {m.kelas.anggota.length === 0 ? (
              <EmptyState message="Belum ada siswa di kelas ini. Minta kurikulum menambahkan siswa." />
            ) : (
              <div className="space-y-3">
                {m.kelas.anggota.map(({ siswa }) => {
                  const tercatat = nilai.filter(
                    (n) => n.siswaId === siswa.id && n.mapel === m.nama,
                  );
                  return (
                    <div
                      key={siswa.id}
                      className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5"
                    >
                      <div className="min-w-0 basis-48">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {siswa.name}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {tercatat.length === 0 ? (
                            <span className="text-xs text-slate-400">Belum dinilai</span>
                          ) : (
                            tercatat.map((n) => (
                              <form key={n.id} action={deleteNilai} className="inline-flex">
                                <input type="hidden" name="id" value={n.id} />
                                <Badge
                                  tone={
                                    n.nilaiAkhir >= 80 ? "green" : n.nilaiAkhir >= 70 ? "amber" : "red"
                                  }
                                >
                                  {n.semester}: {n.nilaiAkhir} ({n.predikat})
                                </Badge>
                                <button
                                  type="submit"
                                  aria-label={`Hapus nilai ${n.semester} ${siswa.name}`}
                                  className="ml-1 text-xs text-rose-500 hover:text-rose-700"
                                >
                                  ✕
                                </button>
                              </form>
                            ))
                          )}
                        </div>
                      </div>

                      <form action={createNilai} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="mapelId" value={m.id} />
                        <input type="hidden" name="siswaId" value={siswa.id} />
                        <div className="w-24">
                          <label
                            htmlFor={`sem-${m.id}-${siswa.id}`}
                            className="mb-0.5 block text-[11px] text-slate-500"
                          >
                            Semester
                          </label>
                          <select
                            id={`sem-${m.id}-${siswa.id}`}
                            name="semester"
                            defaultValue="Genap"
                            className={INPUT_CLASS}
                          >
                            {SEMESTER.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-20">
                          <label
                            htmlFor={`nilai-${m.id}-${siswa.id}`}
                            className="mb-0.5 block text-[11px] text-slate-500"
                          >
                            Nilai
                          </label>
                          <input
                            id={`nilai-${m.id}-${siswa.id}`}
                            name="nilaiAkhir"
                            type="number"
                            min={0}
                            max={100}
                            step="0.5"
                            required
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div className="w-40">
                          <label
                            htmlFor={`cat-${m.id}-${siswa.id}`}
                            className="mb-0.5 block text-[11px] text-slate-500"
                          >
                            Catatan
                          </label>
                          <input
                            id={`cat-${m.id}-${siswa.id}`}
                            name="catatan"
                            type="text"
                            maxLength={300}
                            className={INPUT_CLASS}
                          />
                        </div>
                        <button
                          type="submit"
                          className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          Simpan
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        ))
      )}
    </>
  );
}
