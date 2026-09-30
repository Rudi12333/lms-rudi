import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, EmptyState } from "@/components/ui";
import { HARI } from "@/lib/constants";

export default async function AdminKelasPage() {
  await requireRole("ADMIN");

  const kelas = await prisma.kelas.findMany({
    include: {
      waliKelas: true,
      mapel: true,
      _count: { select: { anggota: true, jadwal: true, tugas: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Data Kelas</h1>
      <p className="-mt-3 text-sm text-slate-500">
        Ringkasan kelas. Pengelolaan kelas dilakukan oleh Kurikulum.
      </p>

      {kelas.length === 0 ? (
        <EmptyState message="Belum ada kelas." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {kelas.map((k) => (
            <Card key={k.id} title={k.name}>
              <div className="space-y-2 text-sm">
                <p className="text-slate-600">
                  Tingkat {k.tingkat} • TA {k.tahunAjaran}
                </p>
                <p className="text-slate-600">Wali Kelas: {k.waliKelas?.name ?? "-"}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge tone="blue">{k._count.anggota} siswa</Badge>
                  <Badge tone="green">{k.mapel.length} mapel</Badge>
                  <Badge tone="amber">{k._count.jadwal} sesi jadwal</Badge>
                  <Badge tone="slate">{k._count.tugas} tugas</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card title="Referensi Hari">
        <div className="flex flex-wrap gap-2">
          {HARI.map((h) => (
            <Badge key={h} tone="slate">
              {h}
            </Badge>
          ))}
        </div>
      </Card>
    </>
  );
}
