import { requireRole } from "@/lib/auth";
import { Card } from "@/components/ui";
import { SiswaTable } from "@/components/views";

export default async function KepsekSiswaPage() {
  await requireRole("KEPSEK");
  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Data Siswa</h1>
      <p className="-mt-3 text-sm text-slate-500">
        Rekap seluruh siswa dan performa akademik.
      </p>
      <Card title="Daftar Siswa">
        <SiswaTable />
      </Card>
    </>
  );
}
