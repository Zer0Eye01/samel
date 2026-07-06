import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Eye, FileText, MapPin, Star } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { cardInclude } from "@/lib/types";
import { getT } from "@/lib/i18n";
import { formatSAR, parseImages, timeAgo } from "@/lib/utils";
import { AuctionCard } from "@/components/AuctionCard";
import { ChatButton } from "@/components/ChatButton";
import { Comments } from "@/components/Comments";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Gallery } from "@/components/Gallery";
import { ListingCard } from "@/components/ListingCard";
import { ReportButton } from "@/components/ReportButton";
import { SectionHeader } from "@/components/SectionHeader";
import { SellerCard } from "@/components/SellerCard";

export const dynamic = "force-dynamic";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { lang, t } = await getT();
  const { id } = await params;
  const [session, listing] = await Promise.all([
    getSession(),
    db.listing.findUnique({
      where: { id },
      include: { seller: true, category: { include: { parent: true } }, auction: true },
    }),
  ]);
  if (!listing) notFound();

  // auction listings live on their own page
  if (listing.type === "AUCTION" && listing.auction) {
    redirect(`/auctions/${listing.auction.id}`);
  }

  db.listing
    .update({ where: { id }, data: { views: { increment: 1 } } })
    .catch(() => {});

  const [fav, similar] = await Promise.all([
    session
      ? db.favorite.findUnique({
          where: { userId_listingId: { userId: session.sub, listingId: id } },
        })
      : null,
    db.listing.findMany({
      where: {
        status: "ACTIVE",
        categoryId: listing.categoryId,
        id: { not: id },
      },
      include: cardInclude,
      take: 4,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const cat = listing.category;

  return (
    <div className="container-page py-6 pb-12">
      {/* breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-neutral-500 mb-4 flex-wrap">
        <Link href="/" className="hover:text-primary-600">{t.categoryPage.home}</Link>
        <ChevronLeft className="size-3.5 ltr:rotate-180" />
        {cat.parent && (
          <>
            <Link href={`/category/${cat.parent.slug}`} className="hover:text-primary-600">
              {lang === "en" ? cat.parent.nameEn : cat.parent.nameAr}
            </Link>
            <ChevronLeft className="size-3.5 ltr:rotate-180" />
          </>
        )}
        <Link href={`/category/${cat.slug}`} className="hover:text-primary-600">
          {lang === "en" ? cat.nameEn : cat.nameAr}
        </Link>
        <ChevronLeft className="size-3.5 ltr:rotate-180" />
        <span className="text-neutral-800 line-clamp-1">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
          <Gallery images={parseImages(listing.images)} title={listing.title} />

          <div className="card p-5 space-y-3 max-lg:hidden">
            <h2 className="font-bold flex items-center gap-2">
              <FileText className="size-5 text-primary-500" />
              {t.detail.description}
            </h2>
            <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 lg:sticky lg:top-20 space-y-4">
          <div className="card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display font-bold text-xl sm:text-2xl text-neutral-900">
                {listing.title}
              </h1>
              {listing.isFeatured && (
                <span className="badge bg-primary-500 text-white shrink-0">
                  <Star className="size-3 fill-current" />
                  {t.card.featured}
                </span>
              )}
            </div>

            <p className="font-display font-extrabold text-3xl text-primary-600">
              {listing.price != null ? formatSAR(listing.price) : t.card.negotiable}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="badge bg-neutral-100 text-neutral-600">
                {t.card.conditions[listing.condition] ?? listing.condition}
              </span>
              <span className="badge bg-neutral-100 text-neutral-600">
                <MapPin className="size-3.5" />
                {listing.city}
                {listing.neighborhood ? ` · ${listing.neighborhood}` : ""}
              </span>
              <span className="badge bg-neutral-100 text-neutral-600">
                <Eye className="size-3.5" />
                {listing.views.toLocaleString("en-US")}
              </span>
              <span className="badge bg-neutral-100 text-neutral-600" suppressHydrationWarning>
                {timeAgo(listing.createdAt, lang)}
              </span>
              <span className="badge bg-blue-50 text-blue-700">
                {t.detail.delivery[listing.deliveryMethod] ?? listing.deliveryMethod}
              </span>
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              {session?.sub !== listing.sellerId && (
                <ChatButton listingId={listing.id} />
              )}
              <FavoriteButton
                listingId={listing.id}
                initialFav={!!fav}
                loggedIn={!!session}
              />
              <ReportButton targetType="LISTING" targetId={listing.id} />
            </div>
          </div>

          <SellerCard
            seller={listing.seller}
            showContact={listing.showPhone}
            phone={listing.phone}
            whatsapp={listing.whatsapp}
            contactNote="فضّل البائع إخفاء بيانات التواصل المباشر."
          />

          <div className="card p-4 text-xs text-neutral-600 leading-relaxed space-y-1.5">
            <p className="font-bold text-neutral-800">{t.detail.safetyTitle}</p>
            <ul className="space-y-1 ps-4 list-disc marker:text-primary-500">
              {t.detail.safety.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
            <p className="text-neutral-400 pt-1">{t.detail.safetyFooter}</p>
          </div>
        </div>

        <div className="card p-5 space-y-3 lg:hidden">
          <h2 className="font-bold flex items-center gap-2">
            <FileText className="size-5 text-primary-500" />
            {t.detail.description}
          </h2>
          <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
            {listing.description}
          </p>
        </div>
      </div>

      <div className="mt-8 max-w-3xl">
        <Comments
          listingId={listing.id}
          sellerId={listing.sellerId}
          loggedIn={!!session}
        />
      </div>

      {similar.length > 0 && (
        <section className="mt-12">
          <SectionHeader title={t.detail.similar} href={`/category/${cat.slug}`} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similar.map((l) =>
              l.type === "AUCTION" ? (
                <AuctionCard key={l.id} listing={l} />
              ) : (
                <ListingCard key={l.id} listing={l} />
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
}
