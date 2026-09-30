import { prisma } from "@/lib/prisma";
import { Card, Badge, EmptyState } from "@/components/ui";
import { HARI } from "@/lib/constants";
import { deletePengumuman } from "@/app/actions";

/** Tampilan jadwal yang bisa dipakai beberapa role. */
export async function JadwalTable({
  scope,
  id,
}: {
  scope: "kelas" | "guru" | "semua";
  id?: string;
}) {
  const where =
    scope === "kelas"
      ? { kelasId: id ?? "" }
      : scope === "guru"
        ? { guruId: id ?? "" }
        : {};

  const jadwal = await prisma.jadwal.findMany({
    where,
    include: { kelas: true, guru: true },
  });

  const grouped = HARI.map((hari) => ({
    hari,
    items: jadwal
      .filter((j) => j.hari === hari)
      .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai)),
  })).filter((g) => g.items.length > 0);

  if (grouped.length === 0) {
    return <EmptyState message="Belum ada jadwal." />;
  }

  return (
    <div className="space-y-5">
      {grouped.map((g) => (
        <div key={g.hari}>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">{g.hari}</h3>
          <ul className="space-y-2">
            {g.items.map((j) => (
              <li
                key={j.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {j.mapel} — {j.kelas.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {j.guru.name} • {j.ruangan ?? "Tanpa ruangan"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="blue">
                    {j.jamMulai}-{j.jamSelesai}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export async function PengumumanList({
  role,
  userId,
  canDelete,
}: {
  role: string;
  userId: string;
  canDelete: boolean;
}) {
  const list = await prisma.pengumuman.findMany({
    where: { OR: [{ audience: "SEMUA" }, { audience: role }] },
    include: { author: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (list.length === 0) return <EmptyState message="Belum ada pengumuman." />;

  return (
    <ul className="space-y-3">
      {list.map((p) => (
        <li key={p.id} className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">{p.judul}</p>
              <p className="mt-1 text-sm whitespace-pre-line text-slate-600">{p.isi}</p>
              <p className="mt-2 text-xs text-slate-400">
                {p.author.name} •{" "}
                {p.createdAt.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Badge tone={p.audience === "SEMUA" ? "slate" : "blue"}>
                {p.audience === "SEMUA" ? "Semua" : p.audience}
              </Badge>
              {canDelete && p.authorId === userId ? (
                <form action={deletePengumuman}>
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-rose-300 px-2 py-0.5 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    Hapus
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export async function SiswaTable({ limited }: { limited?: boolean }) {
  const siswa = await prisma.user.findMany({
    where: { role: "SISWA" },
    include: {
      keanggotaanKelas: { include: { kelas: true } },
      nilaiDirimo: true,
    },
    orderBy: { name: "asc" },
    take: limited ? 20 : undefined,
  });

  if (siswa.length === 0) return <EmptyState message="Belum ada data siswa." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            <th className="py-2 pr-3">Nama</th>
            <th className="py-2 pr-3">Email</th>
            <th className="py-2 pr-3">Kelas</th>
            <th className="py-2">Rata-rata</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {siswa.map((s) => {
            const avg = s.nilaiDirimo.length
              ? s.nilaiDirimo.reduce((t, n) => t + n.nilaiAkhir, 0) / s.nilaiDirimo.length
              : null;
            return (
              <tr key={s.id}>
                <td className="py-2 pr-3 font-medium text-slate-800">{s.name}</td>
                <td className="py-2 pr-3 text-slate-600">{s.email}</td>
                <td className="py-2 pr-3 text-slate-600">
                  {s.keanggotaanKelas.map((a) => a.kelas.name).join(", ") || "-"}
                </td>
                <td className="py-2">
                  {avg === null ? (
                    <span className="text-slate-400">-</span>
                  ) : (
                    <Badge tone={avg >= 80 ? "green" : avg >= 70 ? "amber" : "red"}>
                      {avg.toFixed(1)}
                    </Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export async function RekapNilaiTable() {
  const nilai = await prisma.nilai.findMany({
    include: { siswa: true },
    orderBy: [{ kelas: "asc" }, { mapel: "asc" }],
  });

  if (nilai.length === 0) return <EmptyState message="Belum ada data nilai." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            <th className="py-2 pr-3">Siswa</th>
            <th className="py-2 pr-3">Kelas</th>
            <th className="py-2 pr-3">Mapel</th>
            <th className="py-2 pr-3">Semester</th>
            <th className="py-2 pr-3">Nilai</th>
            <th className="py-2">Predikat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {nilai.map((n) => (
            <tr key={n.id}>
              <td className="py-2 pr-3 font-medium text-slate-800">{n.siswa.name}</td>
              <td className="py-2 pr-3 text-slate-600">{n.kelas}</td>
              <td className="py-2 pr-3 text-slate-600">{n.mapel}</td>
              <td className="py-2 pr-3 text-slate-600">{n.semester}</td>
              <td className="py-2 pr-3 text-slate-800">{n.nilaiAkhir}</td>
              <td className="py-2">
                <Badge tone={n.nilaiAkhir >= 80 ? "green" : n.nilaiAkhir >= 70 ? "amber" : "red"}>
                  {n.predikat}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export async function JadwalCardWrapper({
  title,
  scope,
  id,
}: {
  title: string;
  scope: "kelas" | "guru" | "semua";
  id?: string;
}) {
  return (
    <Card title={title}>
      <JadwalTable scope={scope} id={id} />
    </Card>
  );
}
