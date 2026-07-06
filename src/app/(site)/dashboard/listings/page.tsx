import Link from "next/link";
import { Eye, Gavel, Plus, Sparkles, Tag } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { LISTING_STATUS } from "@/lib/constants";
import { formatSAR, parseImages, timeAgo } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import { featureWithPointsAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "إعلاناتي" };

const STATUS_CLS: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  PENDING: "bg-amber-50 text-amber-700",
  SOLD: "bg-blue-50 text-blue-700",
  EXPIRED: "bg-neutral-100 text-neutral-500",
  REMOVED: "bg-red-50 text-red-600",
};

export default async function MyListingsPage() {
  const user = await requireUser();

  const listings = await db.listing.findMany({
    where: { sellerId: user.id },
    include: {
      auction: { include: { _count: { select: { bids: true } }, bids: { orderBy: { amount: "desc" }, take: 1 } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="section-title">إعلاناتي ومزاداتي</h1>
        <Link href="/sell" className="btn-primary">
          <Plus className="size-4" />
          أضف إعلان
        </Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title="لم تنشر أي إعلان بعد"
          hint="ابدأ ببيع ما لا تحتاجه — أو أطلق مزاداً واترك السوق يحدد السعر"
          action={<Link href="/sell" className="btn-primary mt-2">أضف إعلانك الأول</Link>}
        />
      ) : (
        <div className="card overflow-hidden divide-y divide-neutral-50">
          {listings.map((l) => {
            const cover = parseImages(l.images)[0];
            const href = l.auction ? `/auctions/${l.auction.id}` : `/listings/${l.id}`;
            const price =
              l.type === "AUCTION"
                ? (l.auction?.bids[0]?.amount ?? l.auction?.startPrice ?? 0)
                : (l.price ?? 0);
            const canFeature =
              l.status === "ACTIVE" && !l.isFeatured && user.points >= 100;
            return (
              <div key={l.id} className="flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors">
                <Link href={href} className="flex items-center gap-3 min-w-0 flex-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cover}
                    alt=""
                    className="size-16 rounded-lg object-cover border border-neutral-100 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm line-clamp-1">{l.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`badge ${l.type === "AUCTION" ? "bg-red-50 text-red-600" : "bg-primary-50 text-primary-700"}`}>
                        {l.type === "AUCTION" ? <Gavel className="size-3" /> : <Tag className="size-3" />}
                        {l.type === "AUCTION" ? "مزاد" : "بيع عادي"}
                      </span>
                      <span className={`badge ${STATUS_CLS[l.status] ?? "bg-neutral-100"}`}>
                        {LISTING_STATUS[l.status as keyof typeof LISTING_STATUS] ?? l.status}
                      </span>
                      {l.isFeatured && <span className="badge bg-primary-500 text-white">مميز</span>}
                    </div>
                  </div>
                </Link>
                <div className="text-left shrink-0 space-y-1.5">
                  <p className="font-bold text-primary-600 tabular-nums">{formatSAR(price)}</p>
                  <p className="text-xs text-neutral-400 flex items-center gap-1 justify-end">
                    <Eye className="size-3.5" />
                    {l.views}
                    <span className="mx-1">·</span>
                    <span suppressHydrationWarning>{timeAgo(l.createdAt)}</span>
                  </p>
                  {canFeature && (
                    <form action={featureWithPointsAction}>
                      <input type="hidden" name="listingId" value={l.id} />
                      <button className="badge bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer hover:bg-amber-200">
                        <Sparkles className="size-3" />
                        تمييز بـ100 نقطة
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
