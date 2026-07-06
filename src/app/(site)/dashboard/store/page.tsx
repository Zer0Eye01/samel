import Link from "next/link";
import { ExternalLink, Store } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { StoreForm } from "@/components/StoreForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "متجري" };

export default async function StorePage() {
  const user = await requireUser();
  const store = await db.store.findUnique({ where: { userId: user.id } });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <Store className="size-6 text-primary-500" />
            متجري
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            المتجر يجمع كل إعلاناتك تحت هوية واحدة برابط خاص يمكنك مشاركته
          </p>
        </div>
        {store && (
          <Link href={`/store/${store.slug}`} className="btn-secondary">
            <ExternalLink className="size-4" />
            عرض المتجر
          </Link>
        )}
      </div>

      <StoreForm
        initial={
          store
            ? { name: store.name, slug: store.slug, description: store.description }
            : null
        }
      />
    </div>
  );
}
