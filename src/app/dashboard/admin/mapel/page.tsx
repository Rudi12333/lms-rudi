import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, EmptyState } from "@/components/ui";

export default async function AdminMapelPage() {
  await requireRole("ADMIN");

  const mapel = await prisma.mapel.findMany({
    include: { kelas: true, guru: true, _count: { select: { tugas: true } } },
    orderBy: [{ kelas: { name: "asc" } }, { nama: "asc" }],
  });

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Mata Pelajaran</h1>
      <p className="-mt-3 text-sm text-slate-500">
        Alokasi mata pelajaran per kelas. Pengaturan oleh Kurikulum.
      </p>

      <Card title={`Total Mata Pelajaran (${mapel.length})`}>
        {mapel.length === 0 ? (
          <EmptyState message="Belum ada mata pelajaran." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 pr-3">Kode</th>
                  <th className="py-2 pr-3">Nama Mapel</th>
                  <th className="py-2 pr-3">Kelas</th>
                  <th className="py-2 pr-3">Guru Pengampu</th>
                  <th className="py-2 pr-3">Tugas</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mapel.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 pr-3 font-mono text-xs text-slate-500">{m.kode}</td>
                    <td className="py-2 pr-3 font-medium text-slate-800">{m.nama}</td>
                    <td className="py-2 pr-3 text-slate-600">{m.kelas.name}</td>
                    <td className="py-2 pr-3 text-slate-600">{m.guru?.name ?? "-"}</td>
                    <td className="py-2 pr-3 text-slate-600">{m._count.tugas}</td>
                    <td className="py-2">
                      <Badge tone={m.guruId ? "green" : "red"}>
                        {m.guruId ? "Terisi" : "Kosong"}
                      </Badge>
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
