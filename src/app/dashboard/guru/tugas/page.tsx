import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, EmptyState } from "@/components/ui";
import { Flash, FormField, FormSelect, SubmitButton } from "@/components/form";
import { createTugas, deleteTugas, nilaiiTugas } from "@/app/actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function GuruTugasPage(props: { searchParams: SearchParams }) {
  const session = await requireRole("GURU");
  const params = await props.searchParams;

  const [mapel, tugas] = await Promise.all([
    prisma.mapel.findMany({
      where: { guruId: session.userId },
      include: { kelas: true },
      orderBy: { nama: "asc" },
    }),
    prisma.tugas.findMany({
      where: { guruId: session.userId },
      include: {
        mapel: true,
        kelas: true,
        pengumpulan: { include: { siswa: true }, orderBy: { updatedAt: "desc" } },
      },
      orderBy: { deadline: "asc" },
    }),
  ]);

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Kelola Tugas</h1>
      <p className="-mt-3 text-sm text-slate-500">
        Buat tugas, pantau pengumpulan, dan beri nilai.
      </p>

      <Flash sukses={params.sukses} error={params.error} />

      <Card title="Buat Tugas Baru">
        {mapel.length === 0 ? (
          <EmptyState message="Anda belum memiliki mata pelajaran. Hubungi kurikulum." />
        ) : (
          <form action={createTugas} className="grid gap-4 sm:grid-cols-2">
            <FormField label="Judul Tugas" name="judul" placeholder="Contoh: Latihan Aljabar" />
            <FormSelect
              label="Mata Pelajaran"
              name="mapelId"
              options={mapel.map((m) => ({
                value: m.id,
                label: `${m.nama} - ${m.kelas.name}`,
              }))}
            />
            <div className="sm:col-span-2">
              <label htmlFor="deskripsi" className="mb-1 block text-sm font-medium text-slate-700">
                Deskripsi Tugas
              </label>
              <textarea
                id="deskripsi"
                name="deskripsi"
                rows={3}
                required
                placeholder="Instructions untuk siswa..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <FormField label="Deadline" name="deadline" type="datetime-local" />
            <input type="hidden" name="kelasId" value={mapel[0]?.kelasId ?? ""} />
            <div className="sm:col-span-2">
              <SubmitButton label="Buat Tugas" />
            </div>
          </form>
        )}
      </Card>

      <Card title={`Daftar Tugas (${tugas.length})`}>
        {tugas.length === 0 ? (
          <EmptyState message="Belum ada tugas." />
        ) : (
          <div className="space-y-4">
            {tugas.map((t) => (
              <div key={t.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{t.judul}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {t.mapel.nama} • {t.kelas.name} • Deadline{" "}
                      {new Date(t.deadline).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <form action={deleteTugas}>
                    <input type="hidden" name="id" value={t.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-rose-300 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      Hapus
                    </button>
                  </form>
                </div>

                <p className="mt-2 text-sm text-slate-600">{t.deskripsi}</p>

                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Pengumpulan ({t.pengumpulan.length})
                  </p>
                  {t.pengumpulan.length === 0 ? (
                    <p className="text-xs text-slate-400">Belum ada siswa yang mengumpulkan.</p>
                  ) : (
                    <div className="space-y-2">
                      {t.pengumpulan.map((p) => (
                        <form
                          key={p.id}
                          action={nilaiiTugas}
                          className="flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 px-3 py-2"
                        >
                          <input type="hidden" name="id" value={p.id} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {p.siswa.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {p.fileName ?? "Tanpa file"} •{" "}
                              {new Date(p.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                          </div>
                          <div className="w-20">
                            <label className="mb-0.5 block text-[11px] text-slate-500">Nilai</label>
                            <input
                              name="nilai"
                              type="number"
                              min={0}
                              max={100}
                              step="0.5"
                              defaultValue={p.nilaiTugas ?? ""}
                              className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="w-32">
                            <label className="mb-0.5 block text-[11px] text-slate-500">Catatan</label>
                            <input
                              name="catatan"
                              type="text"
                              defaultValue={p.catatan ?? ""}
                              className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
                            />
                          </div>
                          <button
                            type="submit"
                            className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Simpan
                          </button>
                        </form>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Statistik Pengumpulan">
        <div className="flex flex-wrap gap-2">
          {tugas.map((t) => (
            <Badge key={t.id} tone={t.pengumpulan.length > 0 ? "green" : "amber"}>
              {t.judul}: {t.pengumpulan.length} masuk
            </Badge>
          ))}
        </div>
      </Card>
    </>
  );
}
