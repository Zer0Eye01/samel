import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Star, Store } from "lucide-react";
import { db } from "@/lib/db";
import { cardInclude } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { AuctionCard } from "@/components/AuctionCard";
import { Avatar } from "@/components/Avatar";
import { CredibilityBadge } from "@/components/CredibilityBadge";
import { EmptyState } from "@/components/EmptyState";
import { ListingCard } from "@/components/ListingCard";
import { ReportButton } from "@/components/ReportButton";

export const dynamic = "force-dynamic";

export default async function PublicStorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await db.store.findUnique({
    where: { slug },
    include: {
      user: {
        include: {
          listings: {
            where: { status: "ACTIVE" },
            include: cardInclude,
            orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          },
          reviewsGotten: { select: { rating: true } },
        },
      },
    },
  });
  if (!store || store.user.isBanned) notFound();

  const owner = store.user;
  const ratings = owner.reviewsGotten;
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
      : null;

  return (
    <div className="pb-12">
      {/* store banner */}
      <div className="bg-gradient-to-l from-neutral-900 to-neutral-800 text-white">
        <div className="container-page py-10 flex flex-col sm:flex-row items-center gap-5">
          <span className="size-20 rounded-2xl bg-primary-500 flex items-center justify-center shrink-0">
            <Store className="size-10" />
          </span>
          <div className="flex-1 text-center sm:text-right space-y-2">
            <h1 className="font-display font-extrabold text-3xl flex items-center gap-2 justify-center sm:justify-start">
              {store.name}
              {owner.isPro && <span className="badge bg-white/10 text-primary-400">PRO</span>}
            </h1>
            {store.description && (
              <p className="text-neutral-300 text-sm max-w-xl">{store.description}</p>
            )}
            <div className="flex items-center gap-3 justify-center sm:justify-start flex-wrap text-sm text-neutral-400">
              <span className="flex items-center gap-1">
                <MapPin className="size-4" />
                {owner.city}
              </span>
              <span>منذ {formatDate(store.createdAt)}</span>
              {avgRating != null && (
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Star className="size-4 fill-current" />
                  {avgRating.toFixed(1)} ({ratings.length} تقييم)
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Link
              href={`/profile/${owner.id}`}
              className="flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 px-4 py-2 transition-colors"
            >
              <Avatar name={owner.name} color={owner.avatarColor} src={owner.avatarUrl} className="size-7 text-xs" />
              <span className="text-sm">{owner.name}</span>
            </Link>
            <div className="flex items-center gap-2">
              <CredibilityBadge score={owner.credibility} compact />
              <span className="text-xs text-neutral-400 flex items-center gap-1">
                <BadgeCheck className="size-3.5" />
                {owner.successfulTx} معاملة
              </span>
              <ReportButton targetType="USER" targetId={owner.id} compact />
            </div>
          </div>
        </div>
      </div>

      <div className="container-page mt-8">
        <h2 className="section-title mb-4">
          منتجات المتجر ({owner.listings.length})
        </h2>
        {owner.listings.length === 0 ? (
          <EmptyState title="لا توجد منتجات معروضة حالياً" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {owner.listings.map((listing) =>
              listing.type === "AUCTION" ? (
                <AuctionCard key={listing.id} listing={listing} />
              ) : (
                <ListingCard key={listing.id} listing={listing} />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
