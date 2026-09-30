import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, EmptyState } from "@/components/ui";
import { Flash, FormField, FormSelect, SubmitButton } from "@/components/form";
import { createUser, toggleUserStatus, deleteUser } from "@/app/actions";
import { ROLE_LABEL, ROLES, type Role } from "@/lib/constants";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pick(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

export default async function PenggunaPage(props: { searchParams: SearchParams }) {
  await requireRole("ADMIN");
  const params = await props.searchParams;

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Manajemen Pengguna</h1>
      <p className="-mt-3 text-sm text-slate-500">Kelola akun admin, guru, siswa, kepsek, dan kurikulum.</p>

      <Flash sukses={pick(params.sukses)} error={pick(params.error)} />

      <Card title="Tambah Pengguna">
        <form action={createUser} className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nama Lengkap" name="name" placeholder="Nama lengkap" />
          <FormField label="Email" name="email" type="email" placeholder="nama@sekolah.id" />
          <FormField label="Password" name="password" type="password" placeholder="Minimal 6 karakter" />
          <FormSelect
            label="Role"
            name="role"
            options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
          />
          <div className="sm:col-span-2">
            <SubmitButton label="Simpan Pengguna" />
          </div>
        </form>
      </Card>

      <Card title={`Daftar Pengguna (${users.length})`}>
        {users.length === 0 ? (
          <EmptyState message="Belum ada pengguna." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 pr-3">Nama</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2 pr-3 font-medium text-slate-800">{u.name}</td>
                    <td className="py-2 pr-3 text-slate-600">{u.email}</td>
                    <td className="py-2 pr-3">
                      <Badge tone={u.role === "SISWA" ? "slate" : "blue"}>
                        {ROLE_LABEL[u.role as Role] ?? u.role}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">
                      <Badge tone={u.isActive ? "green" : "red"}>
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="py-2">
                      <div className="flex justify-end gap-2">
                        <form action={toggleUserStatus}>
                          <input type="hidden" name="id" value={u.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
                          >
                            {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </form>
                        <form action={deleteUser}>
                          <input type="hidden" name="id" value={u.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-rose-300 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50"
                          >
                            Hapus
                          </button>
                        </form>
                      </div>
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
