"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { predikat, ROLES, HARI } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/*  Helper                                                             */
/* ------------------------------------------------------------------ */

function str(data: FormData, key: string) {
  const v = data.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function num(data: FormData, key: string) {
  const v = str(data, key);
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function revAll() {
  for (const r of ROLES) {
    revalidatePath(`/dashboard/${r.toLowerCase()}`);
  }
}

/* ------------------------------------------------------------------ */
/*  ADMIN                                                              */
/* ------------------------------------------------------------------ */

const userSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(ROLES, { message: "Role tidak valid" }),
});

export async function createUser(formData: FormData) {
  await requireRole("ADMIN");

  const parsed = userSchema.safeParse({
    name: str(formData, "name"),
    email: str(formData, "email").toLowerCase(),
    password: str(formData, "password"),
    role: str(formData, "role"),
  });

  if (!parsed.success) {
    redirect(
      `/dashboard/admin/pengguna?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Data tidak valid")}`,
    );
  }

  const data = parsed.data;
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    redirect("/dashboard/admin/pengguna?error=Email+sudah+terdaftar");
  }

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: await bcrypt.hash(data.password, 10),
      role: data.role,
    },
  });

  revalidatePath("/dashboard/admin/pengguna");
  revAll();
  redirect("/dashboard/admin/pengguna?sukses=Pengguna+ditambahkan");
}

export async function toggleUserStatus(formData: FormData) {
  const session = await requireRole("ADMIN");
  const id = str(formData, "id");
  if (!id || id === session.userId) redirect("/dashboard/admin/pengguna");

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) redirect("/dashboard/admin/pengguna?error=User+tidak+ditemukan");

  await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });
  revalidatePath("/dashboard/admin/pengguna");
  revAll();
}

export async function deleteUser(formData: FormData) {
  const session = await requireRole("ADMIN");
  const id = str(formData, "id");
  if (!id || id === session.userId) {
    redirect(
      "/dashboard/admin/pengguna?error=Tidak+bisa+menghapus+akun+sendiri",
    );
  }

  // Relasi guru ke Tugas/Jadwal/Nilai memakai onDelete: Cascade, sehingga menghapus
  // guru akan ikut menghapus tugas, pengumpulan siswa, jadwal, dan nilai miliknya.
  // Untuk akun yang sudah punya data akademik, arahkan admin untuk menonaktifkan saja.
  const [tugas, jadwal, nilai] = await Promise.all([
    prisma.tugas.count({ where: { guruId: id } }),
    prisma.jadwal.count({ where: { guruId: id } }),
    prisma.nilai.count({ where: { guruId: id } }),
  ]);
  if (tugas + jadwal + nilai > 0) {
    redirect(
      "/dashboard/admin/pengguna?error=Akun+ini+memiliki+data+akademik.+Nonaktifkan+akun,+jangan+dihapus",
    );
  }

  await prisma.user.delete({ where: { id } }).catch(() => {
    redirect("/dashboard/admin/pengguna?error=Gagal+menghapus+user");
  });

  revalidatePath("/dashboard/admin/pengguna");
  revAll();
  redirect("/dashboard/admin/pengguna?sukses=Pengguna+dihapus");
}

const kelasSchema = z.object({
  name: z.string().min(2, "Nama kelas minimal 2 karakter"),
  tingkat: z.string().min(1, "Tingkat wajib diisi"),
  tahunAjaran: z.string().min(4, "Tahun ajaran tidak valid"),
  waliKelasId: z.string().optional(),
});

export async function createKelas(formData: FormData) {
  await requireRole("ADMIN", "KURIKULUM");

  const parsed = kelasSchema.safeParse({
    name: str(formData, "name"),
    tingkat: str(formData, "tingkat"),
    tahunAjaran: str(formData, "tahunAjaran"),
    waliKelasId: str(formData, "waliKelasId") || undefined,
  });

  if (!parsed.success) {
    redirect(
      `/dashboard/kurikulum/kelas?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Data tidak valid")}`,
    );
  }

  const waliId = parsed.data.waliKelasId;
  if (waliId) {
    const wali = await prisma.user.findUnique({ where: { id: waliId } });
    if (!wali || wali.role !== "GURU") {
      redirect("/dashboard/kurikulum/kelas?error=Wali+kelas+harus+berrole+guru");
    }
  }

  const bentrok = await prisma.kelas.findUnique({
    where: { name: parsed.data.name },
  });
  if (bentrok) redirect("/dashboard/kurikulum/kelas?error=Nama+kelas+sudah+ada");

  await prisma.kelas.create({ data: parsed.data });

  revalidatePath("/dashboard/kurikulum/kelas");
  revalidatePath("/dashboard/admin/kelas");
  revAll();
  redirect("/dashboard/kurikulum/kelas?sukses=Kelas+ditambahkan");
}

const mapelSchema = z.object({
  kode: z.string().min(2, "Kode mapel minimal 2 karakter"),
  nama: z.string().min(3, "Nama mapel minimal 3 karakter"),
  kelasId: z.string().min(1, "Kelas wajib dipilih"),
  guruId: z.string().optional(),
});

export async function createMapel(formData: FormData) {
  await requireRole("ADMIN", "KURIKULUM");

  const parsed = mapelSchema.safeParse({
    kode: str(formData, "kode").toUpperCase(),
    nama: str(formData, "nama"),
    kelasId: str(formData, "kelasId"),
    guruId: str(formData, "guruId") || undefined,
  });

  if (!parsed.success) {
    redirect(
      `/dashboard/kurikulum/mapel?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Data tidak valid")}`,
    );
  }

  const kelas = await prisma.kelas.findUnique({
    where: { id: parsed.data.kelasId },
  });
  if (!kelas)
    redirect("/dashboard/kurikulum/mapel?error=Kelas+tidak+ditemukan");

  if (parsed.data.guruId) {
    const guru = await prisma.user.findUnique({
      where: { id: parsed.data.guruId },
    });
    if (!guru || guru.role !== "GURU") {
      redirect("/dashboard/kurikulum/mapel?error=Guru+tidak+valid");
    }
  }

  const bentrok = await prisma.mapel.findUnique({
    where: { kode: parsed.data.kode },
  });
  if (bentrok)
    redirect("/dashboard/kurikulum/mapel?error=Kode+mapel+sudah+ada");

  await prisma.mapel.create({ data: parsed.data });

  revalidatePath("/dashboard/kurikulum/mapel");
  revalidatePath("/dashboard/admin/mapel");
  revAll();
  redirect("/dashboard/kurikulum/mapel?sukses=Mata+pelajaran+ditambahkan");
}

export async function assignMapelGuru(formData: FormData) {
  await requireRole("ADMIN", "KURIKULUM");
  const mapelId = str(formData, "mapelId");
  const guruId = str(formData, "guruId") || null;

  if (guruId) {
    const guru = await prisma.user.findUnique({ where: { id: guruId } });
    if (!guru || guru.role !== "GURU") {
      redirect("/dashboard/kurikulum/mapel?error=Guru+tidak+valid");
    }
  }

  const mapel = await prisma.mapel.findUnique({ where: { id: mapelId } });
  if (!mapel)
    redirect("/dashboard/kurikulum/mapel?error=Mapel+tidak+ditemukan");

  await prisma.mapel.update({ where: { id: mapelId }, data: { guruId } });

  revalidatePath("/dashboard/kurikulum/mapel");
  revalidatePath("/dashboard/admin/mapel");
  revAll();
}

const jadwalSchema = z
  .object({
    hari: z.enum(HARI, { message: "Hari tidak valid" }),
    jamMulai: z.string().regex(/^\d{2}:\d{2}$/, "Format jam tidak valid"),
    jamSelesai: z.string().regex(/^\d{2}:\d{2}$/, "Format jam tidak valid"),
    kelasId: z.string().min(1, "Kelas wajib dipilih"),
    mapel: z.string().min(2, "Nama mata pelajaran minimal 2 karakter"),
    guruId: z.string().min(1, "Guru wajib dipilih"),
    ruangan: z.string().optional(),
  })
  .refine((d) => d.jamSelesai > d.jamMulai, {
    message: "Jam selesai harus lebih besar dari jam mulai",
    path: ["jamSelesai"],
  });

export async function createJadwal(formData: FormData) {
  await requireRole("ADMIN", "KURIKULUM");

  const parsed = jadwalSchema.safeParse({
    hari: str(formData, "hari"),
    jamMulai: str(formData, "jamMulai"),
    jamSelesai: str(formData, "jamSelesai"),
    kelasId: str(formData, "kelasId"),
    mapel: str(formData, "mapel"),
    guruId: str(formData, "guruId"),
    ruangan: str(formData, "ruangan") || undefined,
  });

  const target = "/dashboard/kurikulum/jadwal";
  if (!parsed.success) {
    redirect(
      `${target}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Data tidak valid")}`,
    );
  }

  const kelas = await prisma.kelas.findUnique({
    where: { id: parsed.data.kelasId },
  });
  if (!kelas) redirect(`${target}?error=Kelas+tidak+ditemukan`);

  const guru = await prisma.user.findUnique({
    where: { id: parsed.data.guruId },
  });
  if (!guru || guru.role !== "GURU")
    redirect(`${target}?error=Guru+tidak+valid`);

  // Dua rentang waktu bertabrakan bila mulai_A < selesai_B DAN selesai_A > mulai_B.
  // Format "HH:MM" berpadding nol sehingga aman dibandingkan sebagai string.
  const overlap = {
    hari: parsed.data.hari,
    jamMulai: { lt: parsed.data.jamSelesai },
    jamSelesai: { gt: parsed.data.jamMulai },
  };
  const bentrokKelas = await prisma.jadwal.findFirst({
    where: { ...overlap, kelasId: parsed.data.kelasId },
  });
  if (bentrokKelas) {
    redirect(`${target}?error=Jam+bentrok+dengan+jadwal+kelas+ini`);
  }
  const bentrokGuru = await prisma.jadwal.findFirst({
    where: { ...overlap, guruId: parsed.data.guruId },
  });
  if (bentrokGuru) {
    redirect(`${target}?error=Guru+sudah+mengajar+di+kelas+lain+pada+jam+tersebut`);
  }

  await prisma.jadwal.create({ data: parsed.data });

  revalidatePath(target);
  revalidatePath("/dashboard/guru/jadwal");
  revalidatePath("/dashboard/siswa/jadwal");
  revAll();
  redirect(`${target}?sukses=Jadwal+ditambahkan`);
}

export async function deleteJadwal(formData: FormData) {
  await requireRole("ADMIN", "KURIKULUM");
  const id = str(formData, "id");
  if (id) await prisma.jadwal.delete({ where: { id } }).catch(() => {});

  revalidatePath("/dashboard/kurikulum/jadwal");
  revalidatePath("/dashboard/guru/jadwal");
  revalidatePath("/dashboard/siswa/jadwal");
  revAll();
}

const pengumumanSchema = z.object({
  judul: z.string().min(3, "Judul minimal 3 karakter"),
  isi: z.string().min(5, "Isi pengumuman minimal 5 karakter"),
  audience: z.string().min(1, "Tujuan pengumuman wajib dipilih"),
});

export async function createPengumuman(formData: FormData) {
  const session = await requireRole("ADMIN", "GURU", "KEPSEK", "KURIKULUM");

  const parsed = pengumumanSchema.safeParse({
    judul: str(formData, "judul"),
    isi: str(formData, "isi"),
    audience: str(formData, "audience"),
  });

  if (!parsed.success) {
    redirect(
      `/dashboard/${session.role.toLowerCase()}/pengumuman?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Data tidak valid")}`,
    );
  }

  const allowed = ["SEMUA", "GURU", "SISWA"];
  const audience = allowed.includes(parsed.data.audience)
    ? parsed.data.audience
    : "SEMUA";

  await prisma.pengumuman.create({
    data: {
      judul: parsed.data.judul,
      isi: parsed.data.isi,
      audience,
      authorId: session.userId,
    },
  });

  revalidatePath(`/dashboard/${session.role.toLowerCase()}/pengumuman`);
  revAll();
  redirect(
    `/dashboard/${session.role.toLowerCase()}/pengumuman?sukses=Pengumuman+terbit`,
  );
}

export async function deletePengumuman(formData: FormData) {
  const session = await requireRole("ADMIN", "KEPSEK", "KURIKULUM", "GURU");
  const id = str(formData, "id");
  if (!id) redirect("/dashboard");

  const pengumuman = await prisma.pengumuman.findUnique({ where: { id } });
  if (!pengumuman) redirect("/dashboard");
  if (session.role !== "ADMIN" && pengumuman.authorId !== session.userId) {
    redirect(
      `/dashboard/${session.role.toLowerCase()}/pengumuman?error=Anda+tidak+boleh+menghapus+milik+orang+lain`,
    );
  }

  await prisma.pengumuman.delete({ where: { id } });

  revalidatePath(`/dashboard/${session.role.toLowerCase()}/pengumuman`);
  revAll();
}

export async function enrollSiswa(formData: FormData) {
  await requireRole("ADMIN", "KURIKULUM");
  const target = "/dashboard/kurikulum/kelas";
  const kelasId = str(formData, "kelasId");
  const siswaId = str(formData, "siswaId");

  if (!kelasId || !siswaId) {
    redirect(`${target}?error=Kelas+dan+siswa+wajib+dipilih`);
  }

  const [kelas, siswa] = await Promise.all([
    prisma.kelas.findUnique({ where: { id: kelasId } }),
    prisma.user.findUnique({ where: { id: siswaId } }),
  ]);
  if (!kelas) redirect(`${target}?error=Kelas+tidak+ditemukan`);
  if (!siswa || siswa.role !== "SISWA") {
    redirect(`${target}?error=Siswa+tidak+valid`);
  }

  // Satu siswa hanya boleh berada di satu kelas pada tahun ajaran yang sama.
  const sudah = await prisma.kelasSiswa.findFirst({
    where: { siswaId, kelas: { tahunAjaran: kelas.tahunAjaran } },
    include: { kelas: true },
  });
  if (sudah) {
    const pesan =
      sudah.kelasId === kelasId
        ? "Siswa sudah menjadi anggota kelas ini"
        : `Siswa sudah terdaftar di kelas ${sudah.kelas.name} pada TA ${kelas.tahunAjaran}`;
    redirect(`${target}?error=${encodeURIComponent(pesan)}`);
  }

  await prisma.kelasSiswa.create({ data: { kelasId, siswaId } });

  revalidatePath(target);
  revalidatePath("/dashboard/admin/kelas");
  revAll();
  redirect(`${target}?sukses=Siswa+ditambahkan+ke+kelas`);
}

export async function unenrollSiswa(formData: FormData) {
  await requireRole("ADMIN", "KURIKULUM");
  const target = "/dashboard/kurikulum/kelas";
  const id = str(formData, "id");
  if (!id) redirect(target);

  await prisma.kelasSiswa.delete({ where: { id } }).catch(() => {});

  revalidatePath(target);
  revalidatePath("/dashboard/admin/kelas");
  revAll();
  redirect(`${target}?sukses=Siswa+dikeluarkan+dari+kelas`);
}

/* ------------------------------------------------------------------ */
/*  GURU                                                               */
/* ------------------------------------------------------------------ */

const tugasSchema = z
  .object({
    judul: z.string().min(3, "Judul minimal 3 karakter"),
    deskripsi: z.string().min(5, "Deskripsi minimal 5 karakter"),
    mapelId: z.string().min(1, "Mata pelajaran wajib dipilih"),
    deadline: z.string().min(1, "Deadline wajib diisi"),
  })
  .refine((d) => !Number.isNaN(Date.parse(d.deadline)), {
    message: "Format deadline tidak valid",
    path: ["deadline"],
  });

export async function createTugas(formData: FormData) {
  const session = await requireRole("GURU", "ADMIN");

  const parsed = tugasSchema.safeParse({
    judul: str(formData, "judul"),
    deskripsi: str(formData, "deskripsi"),
    mapelId: str(formData, "mapelId"),
    deadline: str(formData, "deadline"),
  });

  const target = "/dashboard/guru/tugas";
  if (!parsed.success) {
    redirect(
      `${target}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Data tidak valid")}`,
    );
  }

  const mapel = await prisma.mapel.findUnique({
    where: { id: parsed.data.mapelId },
  });
  if (!mapel) redirect(`${target}?error=Mata+pelajaran+tidak+ditemukan`);
  if (session.role === "GURU" && mapel.guruId !== session.userId) {
    redirect(`${target}?error=Anda+bukan+pengampu+mata+pelajaran+ini`);
  }

  await prisma.tugas.create({
    data: {
      judul: parsed.data.judul,
      deskripsi: parsed.data.deskripsi,
      mapelId: parsed.data.mapelId,
      kelasId: mapel.kelasId,
      guruId: mapel.guruId ?? session.userId,
      deadline: new Date(parsed.data.deadline),
    },
  });

  revalidatePath(target);
  revalidatePath("/dashboard/siswa/tugas");
  revAll();
  redirect(`${target}?sukses=Tugas+dibuat`);
}

export async function deleteTugas(formData: FormData) {
  const session = await requireRole("GURU", "ADMIN");
  const id = str(formData, "id");
  if (!id) redirect("/dashboard/guru/tugas");

  const tugas = await prisma.tugas.findUnique({ where: { id } });
  if (!tugas) redirect("/dashboard/guru/tugas");
  if (session.role === "GURU" && tugas.guruId !== session.userId) {
    redirect(
      "/dashboard/guru/tugas?error=Anda+tidak+boleh+menghapus+tugas+ini",
    );
  }

  await prisma.tugas.delete({ where: { id } });
  revalidatePath("/dashboard/guru/tugas");
  revAll();
}

export async function nilaiiTugas(formData: FormData) {
  const session = await requireRole("GURU", "ADMIN");
  const id = str(formData, "id");
  const nilai = num(formData, "nilai");
  const catatan = str(formData, "catatan");

  if (!id) redirect("/dashboard/guru/tugas");
  if (Number.isNaN(nilai) || nilai < 0 || nilai > 100) {
    redirect("/dashboard/guru/tugas?error=Nilai+harus+antara+0+dan+100");
  }

  const pengumpulan = await prisma.pengumpulan.findUnique({ where: { id } });
  if (!pengumpulan)
    redirect("/dashboard/guru/tugas?error=Data+Tidak+ditemukan");

  const tugas = await prisma.tugas.findUnique({
    where: { id: pengumpulan.tugasId },
  });
  if (tugas && session.role === "GURU" && tugas.guruId !== session.userId) {
    redirect("/dashboard/guru/tugas?error=Anda+tidak+boleh+menilai+tugas+ini");
  }

  await prisma.pengumpulan.update({
    where: { id },
    data: { nilaiTugas: nilai, feedback: catatan || null },
  });

  revalidatePath("/dashboard/guru/tugas");
  revalidatePath("/dashboard/siswa");
  revAll();
}

const SEMESTER = ["Ganjil", "Genap"] as const;

const nilaiSchema = z.object({
  mapelId: z.string().min(1, "Mata pelajaran wajib dipilih"),
  siswaId: z.string().min(1, "Siswa wajib dipilih"),
  semester: z.enum(SEMESTER, { message: "Semester tidak valid" }),
  nilaiAkhir: z
    .number({ message: "Nilai harus berupa angka" })
    .min(0, "Nilai minimal 0")
    .max(100, "Nilai maksimal 100"),
  catatan: z.string().max(300, "Catatan maksimal 300 karakter").optional(),
});

export async function createNilai(formData: FormData) {
  const session = await requireRole("GURU", "ADMIN");
  const target = "/dashboard/guru/nilai";

  const parsed = nilaiSchema.safeParse({
    mapelId: str(formData, "mapelId"),
    siswaId: str(formData, "siswaId"),
    semester: str(formData, "semester"),
    nilaiAkhir: num(formData, "nilaiAkhir"),
    catatan: str(formData, "catatan") || undefined,
  });

  if (!parsed.success) {
    redirect(
      `${target}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Data tidak valid")}`,
    );
  }
  const data = parsed.data;

  const mapel = await prisma.mapel.findUnique({
    where: { id: data.mapelId },
    include: { kelas: true },
  });
  if (!mapel) redirect(`${target}?error=Mata+pelajaran+tidak+ditemukan`);
  if (session.role === "GURU" && mapel.guruId !== session.userId) {
    redirect(`${target}?error=Anda+bukan+pengampu+mata+pelajaran+ini`);
  }

  // Siswa harus benar-benar anggota kelas dari mapel tersebut.
  const anggota = await prisma.kelasSiswa.findUnique({
    where: { kelasId_siswaId: { kelasId: mapel.kelasId, siswaId: data.siswaId } },
  });
  if (!anggota) redirect(`${target}?error=Siswa+bukan+anggota+kelas+ini`);

  const pemberi = mapel.guruId ?? session.userId;
  const nilaiPredikat = predikat(data.nilaiAkhir);

  await prisma.nilai.upsert({
    where: {
      siswaId_mapel_semester: {
        siswaId: data.siswaId,
        mapel: mapel.nama,
        semester: data.semester,
      },
    },
    create: {
      siswaId: data.siswaId,
      guruId: pemberi,
      mapel: mapel.nama,
      kelas: mapel.kelas.name,
      semester: data.semester,
      nilaiAkhir: data.nilaiAkhir,
      predikat: nilaiPredikat,
      catatan: data.catatan ?? null,
    },
    update: {
      guruId: pemberi,
      kelas: mapel.kelas.name,
      nilaiAkhir: data.nilaiAkhir,
      predikat: nilaiPredikat,
      catatan: data.catatan ?? null,
    },
  });

  revalidatePath(target);
  revalidatePath("/dashboard/siswa/nilai");
  revAll();
  redirect(`${target}?sukses=Nilai+disimpan`);
}

export async function deleteNilai(formData: FormData) {
  const session = await requireRole("GURU", "ADMIN");
  const id = str(formData, "id");
  if (!id) redirect("/dashboard/guru/nilai");

  const nilai = await prisma.nilai.findUnique({ where: { id } });
  if (!nilai) redirect("/dashboard/guru/nilai?error=Data+nilai+tidak+ditemukan");
  if (session.role === "GURU" && nilai.guruId !== session.userId) {
    redirect("/dashboard/guru/nilai?error=Anda+tidak+boleh+menghapus+nilai+ini");
  }

  await prisma.nilai.delete({ where: { id } });

  revalidatePath("/dashboard/guru/nilai");
  revalidatePath("/dashboard/siswa/nilai");
  revAll();
  redirect("/dashboard/guru/nilai?sukses=Nilai+dihapus");
}

/* ------------------------------------------------------------------ */
/*  SISWA                                                              */
/* ------------------------------------------------------------------ */

const pengumpulanSchema = z.object({
  tugasId: z.string().min(1, "Tugas tidak valid"),
  catatan: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
  link: z
    .string()
    .max(500, "Tautan terlalu panjang")
    .refine((v) => {
      try {
        const u = new URL(v);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    }, "Tautan harus berupa URL http:// atau https:// yang valid")
    .optional(),
});

export async function submitTugas(formData: FormData) {
  const session = await requireRole("SISWA");
  const target = "/dashboard/siswa/tugas";

  const parsed = pengumpulanSchema.safeParse({
    tugasId: str(formData, "tugasId"),
    catatan: str(formData, "catatan") || undefined,
    link: str(formData, "link") || undefined,
  });
  if (!parsed.success) {
    redirect(
      `${target}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Data tidak valid")}`,
    );
  }
  const { tugasId, catatan, link } = parsed.data;

  if (!catatan && !link) {
    redirect(`${target}?error=Isi+catatan+atau+sertakan+tautan+pekerjaan`);
  }

  const tugas = await prisma.tugas.findUnique({ where: { id: tugasId } });
  if (!tugas) redirect(`${target}?error=Tugas+tidak+ditemukan`);

  const anggota = await prisma.kelasSiswa.findUnique({
    where: { kelasId_siswaId: { kelasId: tugas.kelasId, siswaId: session.userId } },
  });
  if (!anggota) redirect(`${target}?error=Anda+bukan+anggota+kelas+ini`);

  const fileName = link ? new URL(link).hostname : null;

  // Mengumpulkan ulang menghapus nilai & feedback lama agar guru menilai versi terbaru.
  await prisma.pengumpulan.upsert({
    where: { tugasId_siswaId: { tugasId, siswaId: session.userId } },
    create: {
      tugasId,
      siswaId: session.userId,
      catatan: catatan ?? null,
      fileUrl: link ?? null,
      fileName,
    },
    update: {
      catatan: catatan ?? null,
      fileUrl: link ?? null,
      fileName,
      submittedAt: new Date(),
      nilaiTugas: null,
      feedback: null,
    },
  });

  revalidatePath(target);
  revalidatePath("/dashboard/guru/tugas");
  revAll();
  redirect(`${target}?sukses=Tugas+terkirim`);
}

export async function deletePengumpulan(formData: FormData) {
  const session = await requireRole("SISWA");
  const id = str(formData, "id");
  if (!id) redirect("/dashboard/siswa/tugas");

  const pengumpulan = await prisma.pengumpulan.findUnique({ where: { id } });
  if (!pengumpulan || pengumpulan.siswaId !== session.userId) {
    redirect("/dashboard/siswa/tugas?error=Anda+tidak+boleh+menghapus+ini");
  }
  if (pengumpulan.nilaiTugas !== null) {
    redirect(
      "/dashboard/siswa/tugas?error=Pengumpulan+yang+sudah+dinilai+tidak+dapat+ditarik",
    );
  }

  await prisma.pengumpulan.delete({ where: { id } });
  revalidatePath("/dashboard/siswa/tugas");
  revalidatePath("/dashboard/guru/tugas");
  revAll();
  redirect("/dashboard/siswa/tugas?sukses=Pengumpulan+ditarik");
}
