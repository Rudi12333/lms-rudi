import { requireRole } from "@/lib/auth";
import { Card } from "@/components/ui";
import { Flash, FormField, FormSelect, SubmitButton } from "@/components/form";
import { createPengumuman } from "@/app/actions";
import { PengumumanList } from "@/components/views";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminPengumumanPage(props: { searchParams: SearchParams }) {
  const session = await requireRole("ADMIN");
  const params = await props.searchParams;
  const sukses = typeof params.sukses === "string" ? params.sukses : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Pengumuman</h1>
      <p className="-mt-3 text-sm text-slate-500">Terbitkan pengumuman ke seluruh sekolah.</p>

      <Flash sukses={sukses} error={error} />

      <Card title="Buat Pengumuman">
        <form action={createPengumuman} className="space-y-4">
          <FormField label="Judul" name="judul" placeholder="Judul pengumuman" />
          <div>
            <label htmlFor="isi" className="mb-1 block text-sm font-medium text-slate-700">
              Isi Pengumuman
            </label>
            <textarea
              id="isi"
              name="isi"
              rows={4}
              required
              placeholder="Tulis isi pengumuman..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <FormSelect
            label="Ditujukan Untuk"
            name="audience"
            options={[
              { value: "SEMUA", label: "Semua warga sekolah" },
              { value: "GURU", label: "Guru saja" },
              { value: "SISWA", label: "Siswa saja" },
            ]}
          />
          <SubmitButton label="Terbitkan" />
        </form>
      </Card>

      <Card title="Daftar Pengumuman">
        <PengumumanList role="ADMIN" userId={session.userId} canDelete={true} />
      </Card>
    </>
  );
}
