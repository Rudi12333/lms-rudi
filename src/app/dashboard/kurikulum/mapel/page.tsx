import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, EmptyState } from "@/components/ui";
import { Flash, FormField, FormSelect, SubmitButton } from "@/components/form";
import { createMapel, assignMapelGuru } from "@/app/actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function KurikulumMapelPage(props: { searchParams: SearchParams }) {
  await requireRole("KURIKULUM", "ADMIN");
  const params = await props.searchParams;

  const [mapel, kelas, guru] = await Promise.all([
    prisma.mapel.findMany({
      include: { kelas: true, guru: true, _count: { select: { tugas: true } } },
      orderBy: [{ kelas: { name: "asc" } }, { nama: "asc" }],
    }),
    prisma.kelas.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "GURU" }, orderBy: { name: "asc" } }),
  ]);

  const guruOptions = [
    { value: "", label: "Kosongkan" },
    ...guru.map((g) => ({ value: g.id, label: g.name })),
  ];

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Mata Pelajaran</h1>
      <p className="-mt-3 text-sm text-slate-500">
        Alokasi mapel per kelas dan penugasan guru pengampu.
      </p>

      <Flash
        sukses={typeof params.sukses === "string" ? params.sukses : undefined}
        error={typeof params.error === "string" ? params.error : undefined}
      />

      <Card title="Tambah Mata Pelajaran">
        {kelas.length === 0 ? (
          <EmptyState message="Buat kelas terlebih dahulu." />
        ) : (
          <form action={createMapel} className="grid gap-4 sm:grid-cols-2">
            <FormField label="Kode Mapel" name="kode" placeholder="Contoh: MTK-XIPA1" />
            <FormField label="Nama Mata Pelajaran" name="nama" placeholder="Contoh: Matematika" />
            <FormSelect
              label="Kelas"
              name="kelasId"
              options={kelas.map((k) => ({ value: k.id, label: k.name }))}
            />
            <FormSelect label="Guru Pengampu" name="guruId" options={guruOptions} required={false} />
            <div className="sm:col-span-2">
              <SubmitButton label="Simpan Mata Pelajaran" />
            </div>
          </form>
        )}
      </Card>

      <Card title={`Daftar Mata Pelajaran (${mapel.length})`}>
        {mapel.length === 0 ? (
          <EmptyState message="Belum ada mata pelajaran." />
        ) : (
          <div className="space-y-3">
            {mapel.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {m.nama} <span className="font-mono text-xs text-slate-400">({m.kode})</span>
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone="blue">{m.kelas.name}</Badge>
                    <Badge tone={m.guruId ? "green" : "red"}>
                      {m.guru?.name ?? "Belum ada guru"}
                    </Badge>
                    <Badge tone="slate">{m._count.tugas} tugas</Badge>
                  </div>
                </div>
                <form action={assignMapelGuru} className="flex items-end gap-2">
                  <input type="hidden" name="mapelId" value={m.id} />
                  <div>
                    <label
                      htmlFor={`guru-${m.id}`}
                      className="mb-1 block text-xs font-medium text-slate-600"
                    >
                      Guru Pengampu
                    </label>
                    <select
                      id={`guru-${m.id}`}
                      name="guruId"
                      defaultValue={m.guruId ?? ""}
                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
                    >
                      {guruOptions.map((o) => (
                        <option key={o.value || "kosong"} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    Simpan
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
