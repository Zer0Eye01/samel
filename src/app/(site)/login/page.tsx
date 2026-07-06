"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Gavel, Loader2 } from "lucide-react";
import { useLang } from "@/components/LangProvider";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLang();
  const a = t.auth;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? a.genericError);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="card w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="size-12 rounded-2xl bg-primary-500 text-white inline-flex items-center justify-center">
            <Gavel className="size-6" />
          </span>
          <h1 className="font-display font-bold text-2xl">{a.loginTitle}</h1>
          <p className="text-sm text-neutral-500">{a.loginSub}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{a.identifier}</label>
            <input
              className="input"
              dir="ltr"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{a.password}</label>
            <input
              className="input"
              dir="ltr"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button className="btn-primary w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {a.loginBtn}
          </button>
        </form>

        <div className="text-center text-sm text-neutral-500">
          {a.noAccount}{" "}
          <Link href="/register" className="text-primary-600 font-semibold hover:underline">
            {a.registerNow}
          </Link>
        </div>

        <div className="rounded-lg bg-neutral-50 border border-neutral-100 p-3 text-xs text-neutral-500 space-y-1">
          <p className="font-semibold text-neutral-600">{a.demoAccounts}</p>
          <p dir="ltr" className="text-right">demo@samel.sa / demo1234</p>
          <p dir="ltr" className="text-right">admin@samel.sa / admin123</p>
        </div>
      </div>
    </div>
  );
}
