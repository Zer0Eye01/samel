import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Star, Store as StoreIcon } from "lucide-react";
import { db } from "@/lib/db";
import { cardInclude } from "@/lib/types";
import { formatDate, trustLevel } from "@/lib/utils";
import { AuctionCard } from "@/components/AuctionCard";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { ListingCard } from "@/components/ListingCard";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    include: {
      listings: {
        where: { status: "ACTIVE" },
        include: cardInclude,
        orderBy: { createdAt: "desc" },
      },
      store: true,
      reviewsGotten: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
  if (!user || user.isBanned) notFound();

  const level = trustLevel(user.credibility);
  const reviews = user.reviewsGotten;
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  return (
    <div className="container-page py-8 pb-12 space-y-6">
      <div className="card p-6 flex flex-col sm:flex-row items-center gap-5">
        <Avatar name={user.name} color={user.avatarColor} src={user.avatarUrl} className="size-20 text-3xl" />
        <div className="flex-1 text-center sm:text-right space-y-2">
          <h1 className="font-display font-bold text-2xl flex items-center gap-2 justify-center sm:justify-start">
            {user.name}
            {user.isPro && <span className="badge bg-neutral-900 text-primary-400">PRO</span>}
          </h1>
          <p className="text-sm text-neutral-500 flex items-center gap-3 justify-center sm:justify-start flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="size-4" />
              {user.city}
            </span>
            <span>عضو منذ {formatDate(user.createdAt)}</span>
            <span className="flex items-center gap-1">
              <BadgeCheck className="size-4 text-success" />
              {user.successfulTx} معاملة ناجحة
            </span>
            {avgRating != null && (
              <span className="flex items-center gap-1 text-amber-500 font-semibold">
                <Star className="size-4 fill-current" />
                {avgRating.toFixed(1)} ({reviews.length} تقييم)
              </span>
            )}
          </p>
          {user.store && (
            <Link
              href={`/store/${user.store.slug}`}
              className="badge bg-neutral-900 text-white hover:bg-neutral-800 mt-1"
            >
              <StoreIcon className="size-3.5" />
              {user.store.name}
            </Link>
          )}
        </div>

        <div className="w-full sm:w-64 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">نقاط المصداقية</span>
            <span className="font-display font-extrabold text-lg" style={{ color: level.color }}>
              {user.credibility}/100
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${user.credibility}%`, backgroundColor: level.color }}
            />
          </div>
          <p className="text-xs font-bold text-center" style={{ color: level.color }}>
            {level.label}
          </p>
        </div>
      </div>

      {reviews.length > 0 && (
        <section className="card p-5 space-y-3">
          <h2 className="font-bold flex items-center gap-2">
            <Star className="size-5 text-amber-500 fill-current" />
            التقييمات ({reviews.length})
          </h2>
          <ul className="divide-y divide-neutral-50">
            {reviews.map((r) => (
              <li key={r.id} className="py-2.5 flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-neutral-500">{r.author.name}</p>
                  {r.comment && <p className="text-neutral-700 mt-0.5">{r.comment}</p>}
                </div>
                <span className="flex items-center gap-0.5 shrink-0" dir="ltr">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3.5 ${i < r.rating ? "text-amber-500 fill-current" : "text-neutral-200"}`}
                    />
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="section-title mb-4">
          إعلانات {user.name} ({user.listings.length})
        </h2>
        {user.listings.length === 0 ? (
          <EmptyState title="لا توجد إعلانات نشطة حالياً" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {user.listings.map((listing) =>
              listing.type === "AUCTION" ? (
                <AuctionCard key={listing.id} listing={listing} />
              ) : (
                <ListingCard key={listing.id} listing={listing} />
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}
