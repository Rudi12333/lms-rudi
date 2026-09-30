import type { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, EmptyState } from "@/components/ui";
import { Flash, SubmitButton } from "@/components/form";
import { submitTugas, deletePengumpulan } from "@/app/actions";
import { pick, type SearchParams } from "@/lib/params";

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

type TugasItem = Prisma.TugasGetPayload<{
  include: { mapel: true; kelas: true; pengumpulan: true };
}>;

function fmt(d: Date) {
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TugasCard({ t, now }: { t: TugasItem; now: Date }) {
  const p = t.pengumpulan[0];
  const lewat = now > t.deadline;
  const terlambat = p ? p.submittedAt > t.deadline : false;
  const sisaHari = Math.ceil((t.deadline.getTime() - now.getTime()) / 86_400_000);

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{t.judul}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {t.mapel.nama} • {t.kelas.name} • Deadline {fmt(t.deadline)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {!p ? (
            lewat ? (
              <Badge tone="red">Lewat batas waktu</Badge>
            ) : (
              <Badge tone={sisaHari <= 1 ? "amber" : "blue"}>
                {sisaHari <= 0 ? "Berakhir hari ini" : `${sisaHari} hari lagi`}
              </Badge>
            )
          ) : (
            <>
              <Badge tone={terlambat ? "red" : "green"}>
                {terlambat ? "Terlambat" : "Tepat waktu"}
              </Badge>
              {p.nilaiTugas !== null ? (
                <Badge tone="green">Nilai {p.nilaiTugas}</Badge>
              ) : (
                <Badge tone="amber">Menunggu nilai</Badge>
              )}
            </>
          )}
        </div>
      </div>

      <p className="mt-2 text-sm whitespace-pre-line text-slate-600">{t.deskripsi}</p>

      {p ? (
        <div className="mt-3 space-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <p>Dikumpulkan {fmt(p.submittedAt)}</p>
          {p.fileUrl ? (
            <p className="truncate">
              Tautan:{" "}
              <a
                href={p.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {p.fileUrl}
              </a>
            </p>
          ) : null}
          {p.catatan ? <p>Catatan Anda: {p.catatan}</p> : null}
          {p.feedback ? (
            <p className="font-medium text-slate-800">Komentar guru: {p.feedback}</p>
          ) : null}
        </div>
      ) : null}

      <form action={submitTugas} className="mt-3 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="tugasId" value={t.id} />
        <div>
          <label
            htmlFor={`link-${t.id}`}
            className="mb-1 block text-xs font-medium text-slate-700"
          >
            Tautan pekerjaan (Google Drive, dll.)
          </label>
          <input
            id={`link-${t.id}`}
            name="link"
            type="url"
            placeholder="https://..."
            defaultValue={p?.fileUrl ?? ""}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label
            htmlFor={`catatan-${t.id}`}
            className="mb-1 block text-xs font-medium text-slate-700"
          >
            Catatan untuk guru
          </label>
          <input
            id={`catatan-${t.id}`}
            name="catatan"
            type="text"
            maxLength={500}
            defaultValue={p?.catatan ?? ""}
            className={INPUT_CLASS}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
          <SubmitButton label={p ? "Kumpulkan Ulang" : "Kumpulkan"} />
          {p ? (
            <p className="text-xs text-slate-500">
              Mengumpulkan ulang akan menghapus nilai dan komentar sebelumnya.
            </p>
          ) : null}
        </div>
      </form>

      {p && p.nilaiTugas === null ? (
        <form action={deletePengumpulan} className="mt-2">
          <input type="hidden" name="id" value={p.id} />
          <button
            type="submit"
            className="rounded-md border border-rose-300 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50"
          >
            Tarik Pengumpulan
          </button>
        </form>
      ) : null}
    </div>
  );
}

export default async function SiswaTugasPage(props: { searchParams: SearchParams }) {
  const session = await requireRole("SISWA");
  const params = await props.searchParams;

  const tugas = await prisma.tugas.findMany({
    where: { kelas: { anggota: { some: { siswaId: session.userId } } } },
    include: {
      mapel: true,
      kelas: true,
      pengumpulan: { where: { siswaId: session.userId } },
    },
    orderBy: { deadline: "asc" },
  });

  const now = new Date();
  const belum = tugas.filter((t) => t.pengumpulan.length === 0);
  const sudah = tugas.filter((t) => t.pengumpulan.length > 0);

  return (
    <>
      <h1 className="text-xl font-bold text-slate-900">Tugas Saya</h1>
      <p className="-mt-3 text-sm text-slate-500">
        Kumpulkan tugas dengan menyertakan tautan pekerjaan dan/atau catatan.
      </p>

      <Flash sukses={pick(params.sukses)} error={pick(params.error)} />

      <Card title={`Belum Dikumpulkan (${belum.length})`} desc="Diurutkan dari deadline terdekat">
        {belum.length === 0 ? (
          <EmptyState message="Tidak ada tugas yang menunggu. Kerja bagus!" />
        ) : (
          <div className="space-y-4">
            {belum.map((t) => (
              <TugasCard key={t.id} t={t} now={now} />
            ))}
          </div>
        )}
      </Card>

      <Card title={`Sudah Dikumpulkan (${sudah.length})`}>
        {sudah.length === 0 ? (
          <EmptyState message="Belum ada tugas yang dikumpulkan." />
        ) : (
          <div className="space-y-4">
            {sudah.map((t) => (
              <TugasCard key={t.id} t={t} now={now} />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
