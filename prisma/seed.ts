import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "password123";

async function main() {
  console.log("Membersihkan data lama...");
  await prisma.pengumuman.deleteMany();
  await prisma.jadwal.deleteMany();
  await prisma.nilai.deleteMany();
  await prisma.pengumpulan.deleteMany();
  await prisma.tugas.deleteMany();
  await prisma.mapel.deleteMany();
  await prisma.kelasSiswa.deleteMany();
  await prisma.kelas.deleteMany();
  await prisma.user.deleteMany();

  console.log("Membuat user...");
  const hash = await bcrypt.hash(PASSWORD, 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@lms.sch.id",
      password: hash,
      name: "Admin Sekolah",
      role: "ADMIN",
      phone: "0812-1111-0001",
    },
  });

  const kepsek = await prisma.user.create({
    data: {
      email: "kepsek@lms.sch.id",
      password: hash,
      name: "Drs. Sutomo, M.Pd",
      role: "KEPSEK",
      phone: "0812-1111-0002",
    },
  });

  const kurikulum = await prisma.user.create({
    data: {
      email: "kurikulum@lms.sch.id",
      password: hash,
      name: "Hj. Ratna Dewi, S.Pd",
      role: "KURIKULUM",
      phone: "0812-1111-0003",
    },
  });

  const guru = await prisma.user.create({
    data: {
      email: "guru@lms.sch.id",
      password: hash,
      name: "Ahmad Syahrudin, S.Pd",
      role: "GURU",
      phone: "0812-1111-0004",
    },
  });

  const guru2 = await prisma.user.create({
    data: {
      email: "budi@lms.sch.id",
      password: hash,
      name: "Budi Santoso, S.Pd",
      role: "GURU",
    },
  });

  const siswa1 = await prisma.user.create({
    data: {
      email: "siswa@lms.sch.id",
      password: hash,
      name: "Rizky Pratama",
      role: "SISWA",
    },
  });

  const siswa2 = await prisma.user.create({
    data: {
      email: "siti@lms.sch.id",
      password: hash,
      name: "Siti Nurhaliza",
      role: "SISWA",
    },
  });

  const siswa3 = await prisma.user.create({
    data: {
      email: "dimas@lms.sch.id",
      password: hash,
      name: "Dimas Anggara",
      role: "SISWA",
    },
  });

  console.log("Membuat kelas...");
  const kelasX = await prisma.kelas.create({
    data: {
      name: "X IPA 1",
      tingkat: "X",
      tahunAjaran: "2025/2026",
      waliKelasId: guru.id,
    },
  });

  const kelasXi = await prisma.kelas.create({
    data: {
      name: "XI IPA 2",
      tingkat: "XI",
      tahunAjaran: "2025/2026",
      waliKelasId: guru2.id,
    },
  });

  await prisma.kelasSiswa.createMany({
    data: [
      { kelasId: kelasX.id, siswaId: siswa1.id },
      { kelasId: kelasX.id, siswaId: siswa2.id },
      { kelasId: kelasXi.id, siswaId: siswa3.id },
    ],
  });

  console.log("Membuat mata pelajaran...");
  const mapel = await prisma.mapel.create({
    data: {
      kode: "MTK-XIPA1",
      nama: "Matematika",
      kelasId: kelasX.id,
      guruId: guru.id,
      deskripsi: "Pembelajaran matematika untuk kelas X IPA.",
    },
  });

  const mapel2 = await prisma.mapel.create({
    data: {
      kode: "FIS-XIPA1",
      nama: "Fisika",
      kelasId: kelasX.id,
      guruId: guru.id,
    },
  });

  const mapel3 = await prisma.mapel.create({
    data: {
      kode: "BIO-XIIPA2",
      nama: "Biologi",
      kelasId: kelasXi.id,
      guruId: guru2.id,
    },
  });

  console.log("Membuat tugas...");
  const tugas1 = await prisma.tugas.create({
    data: {
      judul: "Latihan Aljabar Linear",
      deskripsi:
        "Kerjakan soal 1-20 pada buku bab 2. Tulis jawaban di kertas lalu unggah foto.",
      mapelId: mapel.id,
      kelasId: kelasX.id,
      guruId: guru.id,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  const tugas2 = await prisma.tugas.create({
    data: {
      judul: "Laporan Dinamika Gerak",
      deskripsi: "Buat laporan praktikum Percobaan 1Motion of a Projectile.",
      mapelId: mapel2.id,
      kelasId: kelasX.id,
      guruId: guru.id,
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.tugas.create({
    data: {
      judul: "Makalah Sistem Pernapasan",
      deskripsi:
        "Makalah minimal 3 halaman mengenai sistem pernapasan manusia.",
      mapelId: mapel3.id,
      kelasId: kelasXi.id,
      guruId: guru2.id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Membuat pengumpulan...");
  await prisma.pengumpulan.create({
    data: {
      tugasId: tugas2.id,
      siswaId: siswa1.id,
      catatan: "Sudah saya kerjakan, mohon dicek.",
      fileName: "laporan-dinamika.pdf",
      fileUrl: "/uploads/contoh-laporan.pdf",
      nilaiTugas: 85,
    },
  });

  await prisma.pengumpulan.create({
    data: {
      tugasId: tugas1.id,
      siswaId: siswa2.id,
      catatan: "Kumpulan jawaban.",
      fileName: "jawaban-aljabar.pdf",
      fileUrl: "/uploads/contoh-jawaban.pdf",
    },
  });

  console.log("Membuat nilai...");
  const nilaiData = [
    { siswaId: siswa1.id, mapel: "Matematika", kelas: "X IPA 1", nilai: 88 },
    { siswaId: siswa1.id, mapel: "Fisika", kelas: "X IPA 1", nilai: 79 },
    { siswaId: siswa2.id, mapel: "Matematika", kelas: "X IPA 1", nilai: 92 },
    { siswaId: siswa2.id, mapel: "Fisika", kelas: "X IPA 1", nilai: 85 },
    { siswaId: siswa3.id, mapel: "Biologi", kelas: "XI IPA 2", nilai: 90 },
  ];

  for (const n of nilaiData) {
    const predikat =
      n.nilai >= 90
        ? "A"
        : n.nilai >= 80
          ? "B"
          : n.nilai >= 70
            ? "C"
            : n.nilai >= 60
              ? "D"
              : "E";
    await prisma.nilai.create({
      data: {
        siswaId: n.siswaId,
        guruId: guru.id,
        mapel: n.mapel,
        kelas: n.kelas,
        semester: "Genap",
        nilaiAkhir: n.nilai,
        predikat,
      },
    });
  }

  console.log("Membuat jadwal...");
  const jadwal = [
    {
      hari: "Senin",
      m: "07:00",
      s: "08:30",
      k: kelasX.id,
      mapel: "Matematika",
      g: guru.id,
      r: "R. 101",
    },
    {
      hari: "Senin",
      m: "08:30",
      s: "10:00",
      k: kelasX.id,
      mapel: "Fisika",
      g: guru.id,
      r: "Lab IPA",
    },
    {
      hari: "Selasa",
      m: "07:00",
      s: "08:30",
      k: kelasX.id,
      mapel: "Matematika",
      g: guru.id,
      r: "R. 101",
    },
    {
      hari: "Rabu",
      m: "09:15",
      s: "10:45",
      k: kelasX.id,
      mapel: "Fisika",
      g: guru.id,
      r: "Lab IPA",
    },
    {
      hari: "Kamis",
      m: "07:00",
      s: "08:30",
      k: kelasXi.id,
      mapel: "Biologi",
      g: guru2.id,
      r: "Lab IPA",
    },
  ];

  for (const j of jadwal) {
    await prisma.jadwal.create({
      data: {
        hari: j.hari,
        jamMulai: j.m,
        jamSelesai: j.s,
        kelasId: j.k,
        mapel: j.mapel,
        guruId: j.g,
        ruangan: j.r,
      },
    });
  }

  console.log("Membuat pengumuman...");
  await prisma.pengumuman.createMany({
    data: [
      {
        judul: "Papan Pengumuman Tahun Ajaran Baru",
        isi: "Selamat datang di LMS Sekolah. Pastikan semua siswa mengecek pengumuman mingguan.",
        authorId: admin.id,
        audience: "SEMUA",
      },
      {
        judul: "Rapat Guru Koordinasi",
        isi: "Rapat koordinasi guru dilaksanakan Sabtu pukul 08:00 di ruang guru.",
        authorId: kepsek.id,
        audience: "GURU",
      },
      {
        judul: "Penyesuaian Jadwal Pelajaran",
        isi: "Mohon seluruh guru memeriksa kembali jadwal setelah perubahan semester.",
        authorId: kurikulum.id,
        audience: "GURU",
      },
    ],
  });

  console.log("\n=== SEED SELESAI ===");
  console.log("Password semua akun: password123\n");
  console.table([
    { role: "ADMIN", email: admin.email },
    { role: "GURU", email: guru.email },
    { role: "SISWA", email: siswa1.email },
    { role: "KEPSEK", email: kepsek.email },
    { role: "KURIKULUM", email: kurikulum.email },
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
