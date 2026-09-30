import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, EmptyState } from "@/components/ui";
import { Flash, FormField, FormSelect, SubmitButton } from "@/components/form";
import { createKelas, enrollSiswa, unenrollSiswa } from "@/app/actions";
import { pick, type SearchParams } from "@/lib/params";

export default async function KurikulumKelasPage(props: { searchParams: SearchParams }) {
  await requireRole("KURIKULUM", "ADMIN");
  const params = await props.searchParams;

  const [kelas, guru, siswa] = await Promise.all([
    prisma.kelas.findMany({
      include: {
        waliKelas: true,
        anggota: { include: { siswa: true }, orderBy: { siswa: { name: "asc" } } },
        _count: { select: { anggota: true, mapel: true, jadwal: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ where: { role: "GURU" }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: "SISWA", isActive: true },
      include: { keanggotaanKelas: { include: { kelas: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const siswaOptions = siswa.map((s) => {
    const di = s.keanggotaanKelas.map((k) => k.kelas.name).join(", ");
    return { value: s.id, label: di ? `${s.name} (kelas: ${di})` : `${s.name} (belum ada kelas)` };
  });

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Kelola Kelas</h1>
      <p className="-mt-3 text-sm text-slate-500">Buat kelas dan tentukan wali kelas.</p>

      <Flash sukses={pick(params.sukses)} error={pick(params.error)} />

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

      <Card
        title="Anggota Kelas"
        desc="Tambahkan siswa ke kelas. Satu siswa hanya dapat berada di satu kelas per tahun ajaran."
      >
        {kelas.length === 0 || siswa.length === 0 ? (
          <EmptyState message="Pastikan sudah ada kelas dan siswa aktif." />
        ) : (
          <form action={enrollSiswa} className="grid gap-4 sm:grid-cols-2">
            <FormSelect
              label="Kelas"
              name="kelasId"
              options={kelas.map((k) => ({ value: k.id, label: `${k.name} (TA ${k.tahunAjaran})` }))}
            />
            <FormSelect label="Siswa" name="siswaId" options={siswaOptions} />
            <div className="sm:col-span-2">
              <SubmitButton label="Tambahkan ke Kelas" />
            </div>
          </form>
        )}
      </Card>

      {kelas.map((k) => (
        <Card key={k.id} title={`Siswa ${k.name}`} desc={`${k.anggota.length} siswa`}>
          {k.anggota.length === 0 ? (
            <EmptyState message="Belum ada siswa di kelas ini." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {k.anggota.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{a.siswa.name}</p>
                    <p className="truncate text-xs text-slate-500">{a.siswa.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!a.siswa.isActive ? <Badge tone="red">Nonaktif</Badge> : null}
                    <form action={unenrollSiswa}>
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-rose-300 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50"
                      >
                        Keluarkan
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </>
  );
}
