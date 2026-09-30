import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { ROLE_LABEL, ROLE_COLOR, type Role } from "@/lib/constants";
import LogoutButton from "./logout-button";

type NavItem = { href: string; label: string; icon: string };

const NAV: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: "/dashboard/admin", label: "Ringkasan", icon: "▦" },
    { href: "/dashboard/admin/pengguna", label: "Pengguna", icon: "👤" },
    { href: "/dashboard/admin/kelas", label: "Kelas", icon: "🏫" },
    { href: "/dashboard/admin/mapel", label: "Mata Pelajaran", icon: "📚" },
    { href: "/dashboard/admin/jadwal", label: "Jadwal", icon: "🗓" },
    { href: "/dashboard/admin/pengumuman", label: "Pengumuman", icon: "📢" },
  ],
  GURU: [
    { href: "/dashboard/guru", label: "Ringkasan", icon: "▦" },
    { href: "/dashboard/guru/tugas", label: "Tugas", icon: "📝" },
    { href: "/dashboard/guru/nilai", label: "Penilaian", icon: "✅" },
    { href: "/dashboard/guru/siswa", label: "Siswa", icon: "👥" },
    { href: "/dashboard/guru/jadwal", label: "Jadwal", icon: "🗓" },
    { href: "/dashboard/guru/pengumuman", label: "Pengumuman", icon: "📢" },
  ],
  SISWA: [
    { href: "/dashboard/siswa", label: "Ringkasan", icon: "▦" },
    { href: "/dashboard/siswa/tugas", label: "Tugas Saya", icon: "📝" },
    { href: "/dashboard/siswa/nilai", label: "Nilai Saya", icon: "🎓" },
    { href: "/dashboard/siswa/jadwal", label: "Jadwal", icon: "🗓" },
    { href: "/dashboard/siswa/pengumuman", label: "Pengumuman", icon: "📢" },
  ],
  KEPSEK: [
    { href: "/dashboard/kepsek", label: "Ringkasan", icon: "▦" },
    { href: "/dashboard/kepsek/siswa", label: "Data Siswa", icon: "👥" },
    { href: "/dashboard/kepsek/nilai", label: "Rekap Nilai", icon: "📊" },
    { href: "/dashboard/kepsek/jadwal", label: "Jadwal", icon: "🗓" },
    { href: "/dashboard/kepsek/pengumuman", label: "Pengumuman", icon: "📢" },
  ],
  KURIKULUM: [
    { href: "/dashboard/kurikulum", label: "Ringkasan", icon: "▦" },
    { href: "/dashboard/kurikulum/kelas", label: "Kelas", icon: "🏫" },
    { href: "/dashboard/kurikulum/mapel", label: "Mata Pelajaran", icon: "📚" },
    { href: "/dashboard/kurikulum/jadwal", label: "Jadwal", icon: "🗓" },
    { href: "/dashboard/kurikulum/siswa", label: "Data Siswa", icon: "👥" },
    { href: "/dashboard/kurikulum/pengumuman", label: "Pengumuman", icon: "📢" },
  ],
};

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await requireSession();
  const role = session.role;
  const base = `/dashboard/${role.toLowerCase()}`;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-base font-bold text-slate-900">LMS Syahrudin</p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLOR[role]}`}
          >
            {ROLE_LABEL[role]}
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV[role].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <p className="mb-2 px-1 text-xs text-slate-500">
            Masuk sebagai <span className="font-medium text-slate-700">{session.name}</span>
          </p>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{session.name}</p>
            <p className="truncate text-xs text-slate-500">{session.email}</p>
          </div>
          <span
            className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_COLOR[role]}`}
          >
            {ROLE_LABEL[role]}
          </span>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 md:hidden">
          {NAV[role].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="min-w-0 flex-1 p-5">
          <div className="mx-auto max-w-6xl space-y-5">
            <p className="hidden">{base}</p>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
