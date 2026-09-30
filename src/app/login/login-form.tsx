"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROLES, ROLE_LABEL } from "@/lib/constants";

const DEMO = [
  { role: "ADMIN", email: "admin@lms.sch.id" },
  { role: "GURU", email: "guru@lms.sch.id" },
  { role: "SISWA", email: "siswa@lms.sch.id" },
  { role: "KEPSEK", email: "kepsek@lms.sch.id" },
  { role: "KURIKULUM", email: "kurikulum@lms.sch.id" },
] as const;

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as { ok: boolean; message?: string; redirect?: string };

      if (!res.ok || !data.ok) {
        setError(data.message ?? "Gagal masuk. Silakan coba lagi.");
        return;
      }

      router.push(data.redirect ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function isiDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("password123");
    setError(null);
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
            LS
          </div>
          <h1 className="text-xl font-bold text-slate-900">LMS Syahrudin</h1>
          <p className="mt-1 text-sm text-slate-500">Learning Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@sekolah.id"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Akun Demo (password123)
        </p>
        <div className="grid grid-cols-1 gap-2">
          {DEMO.map((d) => (
            <button
              key={d.role}
              type="button"
              onClick={() => isiDemo(d.email)}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm transition hover:border-blue-400 hover:bg-blue-50"
            >
              <span className="font-medium text-slate-700">{ROLE_LABEL[d.role as (typeof ROLES)[number]]}</span>
              <span className="text-xs text-slate-500">{d.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
