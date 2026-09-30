import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { Flash, FormField, FormSelect, SubmitButton } from "@/components/form";
import { createKelas } from "@/app/actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function KurikulumKelasPage(props: { searchParams: SearchParams }) {
  await requireRole("KURIKULUM", "ADMIN");
  const params = await props.searchParams;

  const [kelas, guru] = await Promise.all([
    prisma.kelas.findMany({
      include: { waliKelas: true, _count: { select: { anggota: true, mapel: true, jadwal: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ where: { role: "GURU" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Kelola Kelas</h1>
      <p className="-mt-3 text-sm text-slate-500">Buat kelas dan tentukan wali kelas.</p>

      <Flash
        sukses={typeof params.sukses === "string" ? params.sukses : undefined}
        error={typeof params.error === "string" ? params.error : undefined}
      />

      <Card title="Tambah Kelas">
        <form action={createKelas} className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nama Kelas" name="name" placeholder="Contoh: X IPA 1" />
          <FormField label="Tingkat" name="tingkat" placeholder="Contoh: X" />
          <FormField label="Tahun Ajaran" name="tahunAjaran" placeholder="Contoh: 2025/2026" />
          <FormSelect
            label="Wali Kelas"
            name="waliKelasId"
            required={false}
            options={[
              { value: "", label: "Belum ditentukan" },
              ...guru.map((g) => ({ value: g.id, label: g.name })),
            ]}
          />
          <div className="sm:col-span-2">
            <SubmitButton label="Simpan Kelas" />
          </div>
        </form>
      </Card>

      <Card title={`Daftar Kelas (${kelas.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="py-2 pr-3">Kelas</th>
                <th className="py-2 pr-3">Tingkat</th>
                <th className="py-2 pr-3">TA</th>
                <th className="py-2 pr-3">Wali Kelas</th>
                <th className="py-2 pr-3">Siswa</th>
                <th className="py-2 pr-3">Mapel</th>
                <th className="py-2">Sesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kelas.map((k) => (
                <tr key={k.id}>
                  <td className="py-2 pr-3 font-medium text-slate-800">{k.name}</td>
                  <td className="py-2 pr-3 text-slate-600">{k.tingkat}</td>
                  <td className="py-2 pr-3 text-slate-600">{k.tahunAjaran}</td>
                  <td className="py-2 pr-3 text-slate-600">{k.waliKelas?.name ?? "-"}</td>
                  <td className="py-2 pr-3 text-slate-600">{k._count.anggota}</td>
                  <td className="py-2 pr-3 text-slate-600">{k._count.mapel}</td>
                  <td className="py-2 text-slate-600">{k._count.jadwal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
