import { requireRole } from "@/lib/auth";
import { Card } from "@/components/ui";
import { Flash, FormField, FormSelect, SubmitButton } from "@/components/form";
import { createPengumuman } from "@/app/actions";
import { PengumumanList } from "@/components/views";
import { pick, type SearchParams } from "@/lib/params";

export default async function GuruPengumumanPage(props: { searchParams: SearchParams }) {
  const session = await requireRole("GURU");
  const params = await props.searchParams;

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Pengumuman</h1>
      <p className="-mt-3 text-sm text-slate-500">
        Bagikan informasi kepada siswa atau sesama guru.
      </p>

      <Flash sukses={pick(params.sukses)} error={pick(params.error)} />

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
        <PengumumanList role="GURU" userId={session.userId} canDelete={true} />
      </Card>
    </>
  );
}
