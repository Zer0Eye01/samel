"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, Store } from "lucide-react";

export function StoreForm({
  initial,
}: {
  initial: { name: string; slug: string; description: string } | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState(
    initial ?? { name: "", slug: "", description: "" }
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "تعذّر الحفظ");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card p-5 space-y-4 max-w-xl">
      <div>
        <label className="block text-sm font-medium mb-1.5">اسم المتجر</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="مثال: متجر العمري للتقنية"
          required
          minLength={3}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">
          معرف المتجر (الرابط)
        </label>
        <div className="flex items-center gap-2" dir="ltr">
          <span className="text-sm text-neutral-400">samel.sa/store/</span>
          <input
            className="input flex-1"
            value={form.slug}
            onChange={(e) =>
              setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))
            }
            placeholder="my-store"
            pattern="[a-z0-9-]{3,30}"
            required
          />
        </div>
        <p className="text-xs text-neutral-400 mt-1">
          أحرف إنجليزية صغيرة وأرقام وشرطات فقط (3–30 حرفاً)
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">وصف المتجر</label>
        <textarea
          className="input min-h-24 py-3"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="ماذا تبيع؟ ما الذي يميز متجرك؟"
          maxLength={500}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          <CheckCircle2 className="size-4" />
          تم حفظ المتجر
        </p>
      )}

      <button className="btn-primary" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Store className="size-4" />}
        {initial ? "حفظ التغييرات" : "إنشاء المتجر"}
      </button>
    </form>
  );
}
