import { Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { updatePlanAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "الباقات والأسعار" };

export default async function AdminPlansPage() {
  await requireStaff(["ADMIN"]);
  const plans = await db.plan.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title flex items-center gap-2">
          <Wallet className="size-6 text-primary-500" />
          الباقات والأسعار
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          التعديلات تنعكس فوراً على صفحة الاشتراكات وحدود النشر لكل مستخدم
        </p>
      </div>

      <div className="grid gap-5">
        {plans.map((plan) => {
          const features = (JSON.parse(plan.features) as string[]).join("\n");
          return (
            <form key={plan.id} action={updatePlanAction} className="card p-5 space-y-4">
              <input type="hidden" name="planId" value={plan.id} />
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs bg-neutral-100 rounded px-2 py-1">{plan.key}</span>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" name="highlight" defaultChecked={plan.highlight} className="size-4 accent-primary-500" />
                    الأكثر شيوعاً
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" name="isActive" defaultChecked={plan.isActive} className="size-4 accent-primary-500" />
                    نشطة
                  </label>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">اسم الباقة</label>
                  <input name="name" className="input" defaultValue={plan.name} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">السعر (ر.س)</label>
                  <input name="price" className="input" dir="ltr" defaultValue={plan.price} inputMode="numeric" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">الفترة</label>
                  <input name="period" className="input" defaultValue={plan.period} placeholder="شهرياً" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">حد الإعلانات النشطة</label>
                  <input name="maxListings" className="input" dir="ltr" defaultValue={plan.maxListings} inputMode="numeric" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">حد المزادات النشطة</label>
                  <input name="maxAuctions" className="input" dir="ltr" defaultValue={plan.maxAuctions} inputMode="numeric" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  المميزات (كل ميزة في سطر)
                </label>
                <textarea name="features" className="input min-h-28 py-3" defaultValue={features} />
              </div>

              <button className="btn-primary">حفظ الباقة</button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
