import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LMS Syahrudin",
  description: "Learning Management System Sekolah - Admin, Guru, Siswa, Kepsek, Kurikulum",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
