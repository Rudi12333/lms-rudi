export const ROLES = ["ADMIN", "GURU", "SISWA", "KEPSEK", "KURIKULUM"] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  GURU: "Guru",
  SISWA: "Siswa",
  KEPSEK: "Kepsek",
  KURIKULUM: "Kurikulum",
};

export const ROLE_COLOR: Record<Role, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  GURU: "bg-emerald-100 text-emerald-700",
  SISWA: "bg-blue-100 text-blue-700",
  KEPSEK: "bg-amber-100 text-amber-700",
  KURIKULUM: "bg-rose-100 text-rose-700",
};

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** Halaman dashboard tiap role */
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/dashboard/admin",
  GURU: "/dashboard/guru",
  SISWA: "/dashboard/siswa",
  KEPSEK: "/dashboard/kepsek",
  KURIKULUM: "/dashboard/kurikulum",
};

export function predikat(nilai: number): string {
  if (nilai >= 90) return "A";
  if (nilai >= 80) return "B";
  if (nilai >= 70) return "C";
  if (nilai >= 60) return "D";
  return "E";
}

export const HARI = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;
