import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, StatCard, Badge, EmptyState } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/constants";

export default async function AdminDashboard() {
  const session = await requireRole("ADMIN");

  const [totalUser, totalGuru, totalSiswa, totalKelas, totalMapel, totalTugas, users] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "GURU" } }),
      prisma.user.count({ where: { role: "SISWA" } }),
      prisma.kelas.count(),
      prisma.mapel.count(),
      prisma.tugas.count(),
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    ]);

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Dashboard Admin</h1>
      <p className="-mt-3 text-sm text-slate-500">
        Selamat datang, {session.name}. Ringkasan sistem LMS sekolah.
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Pengguna" value={totalUser} tone="violet" />
        <StatCard label="Guru" value={totalGuru} tone="emerald" />
        <StatCard label="Siswa" value={totalSiswa} tone="blue" />
        <StatCard label="Kelas" value={totalKelas} tone="amber" />
        <StatCard label="Mata Pelajaran" value={totalMapel} tone="blue" />
        <StatCard label="Tugas Aktif" value={totalTugas} tone="rose" />
      </div>

      <Card title="Pengguna Terbaru" desc="Akun yang baru ditambahkan ke sistem">
        {users.length === 0 ? (
          <EmptyState message="Belum ada pengguna." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{u.name}</p>
                  <p className="truncate text-xs text-slate-500">{u.email}</p>
                </div>
                <Badge
                  tone={
                    u.role === "ADMIN"
                      ? "blue"
                      : u.role === "GURU"
                        ? "green"
                        : u.role === "SISWA"
                          ? "slate"
                          : "amber"
                  }
                >
                  {ROLE_LABEL[u.role as keyof typeof ROLE_LABEL] ?? u.role}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
