import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState } from "@/components/ui";
import { Flash, FormField, FormSelect, SubmitButton } from "@/components/form";
import { createJadwal, deleteJadwal } from "@/app/actions";
import { JadwalTable } from "@/components/views";
import { HARI } from "@/lib/constants";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function KurikulumJadwalPage(props: { searchParams: SearchParams }) {
  await requireRole("KURIKULUM", "ADMIN");
  const params = await props.searchParams;

  const [kelas, guru, jadwal] = await Promise.all([
    prisma.kelas.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "GURU" }, orderBy: { name: "asc" } }),
    prisma.jadwal.findMany({
      include: { kelas: true, guru: true },
      orderBy: [{ hari: "asc" }, { jamMulai: "asc" }],
    }),
  ]);

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Kelola Jadwal</h1>
      <p className="-mt-3 text-sm text-slate-500">
        Susun jadwal pelajaran. Sistem menolak jam yang bentrok pada kelas & hari yang sama.
      </p>

      <Flash
        sukses={typeof params.sukses === "string" ? params.sukses : undefined}
        error={typeof params.error === "string" ? params.error : undefined}
      />

      <Card title="Tambah Jadwal">
        {kelas.length === 0 || guru.length === 0 ? (
          <EmptyState message="Pastikan sudah ada kelas dan guru." />
        ) : (
          <form action={createJadwal} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormSelect
              label="Hari"
              name="hari"
              options={HARI.map((h) => ({ value: h, label: h }))}
            />
            <FormField label="Jam Mulai" name="jamMulai" type="time" />
            <FormField label="Jam Selesai" name="jamSelesai" type="time" />
            <FormSelect
              label="Kelas"
              name="kelasId"
              options={kelas.map((k) => ({ value: k.id, label: k.name }))}
            />
            <FormField label="Nama Mata Pelajaran" name="mapel" placeholder="Contoh: Matematika" />
            <FormSelect
              label="Guru Pengajar"
              name="guruId"
              options={guru.map((g) => ({ value: g.id, label: g.name }))}
            />
            <FormField label="Ruangan" name="ruangan" required={false} placeholder="Contoh: R. 101" />
            <div className="sm:col-span-2 lg:col-span-3">
              <SubmitButton label="Tambah Jadwal" />
            </div>
          </form>
        )}
      </Card>

      <Card title="Jadwal Terjadwal">
        <div className="space-y-4">
          <JadwalTable scope="semua" />
        </div>
      </Card>

      {jadwal.length > 0 ? (
        <Card title="Kelola Jadwal Terjadwal">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 pr-3">Hari</th>
                  <th className="py-2 pr-3">Jam</th>
                  <th className="py-2 pr-3">Kelas</th>
                  <th className="py-2 pr-3">Mapel</th>
                  <th className="py-2 pr-3">Guru</th>
                  <th className="py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jadwal.map((j) => (
                  <tr key={j.id}>
                    <td className="py-2 pr-3 text-slate-600">{j.hari}</td>
                    <td className="py-2 pr-3 text-slate-600">
                      {j.jamMulai}-{j.jamSelesai}
                    </td>
                    <td className="py-2 pr-3 font-medium text-slate-800">
                      {j.kelas.name}
                    </td>
                    <td className="py-2 pr-3 text-slate-600">{j.mapel}</td>
                    <td className="py-2 pr-3 text-slate-600">{j.guru.name}</td>
                    <td className="py-2 text-right">
                      <form action={deleteJadwal} className="inline">
                        <input type="hidden" name="id" value={j.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-rose-300 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50"
                        >
                          Hapus
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </>
  );
}
