import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import type { CardListing } from "@/lib/types";
import { getT } from "@/lib/i18n";
import { formatSAR, parseImages, timeAgo } from "@/lib/utils";

export async function ListingCard({ listing }: { listing: CardListing }) {
  const { lang, t } = await getT();
  const images = parseImages(listing.images);
  const cover = images[0] ?? "/images/ph/chair1.svg";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="card group overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={listing.title}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {listing.isFeatured && (
          <span className="badge absolute top-2 right-2 bg-primary-500 text-white shadow-sm">
            {t.card.featured}
          </span>
        )}
      </div>

      <div className="p-3 space-y-1.5">
        <p className="text-primary-600 font-bold font-display text-lg leading-tight">
          {listing.price != null ? formatSAR(listing.price) : t.card.negotiable}
        </p>
        <h3 className="font-medium text-sm text-neutral-800 line-clamp-1">
          {listing.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-neutral-400 pt-0.5">
          <span className="inline-flex items-center gap-1 min-w-0">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{listing.city}</span>
            <span className="text-neutral-300">·</span>
            <span className="shrink-0">
              {t.card.conditions[listing.condition] ?? listing.condition}
            </span>
          </span>
          <span className="shrink-0" suppressHydrationWarning>
            {timeAgo(listing.createdAt, lang)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 pt-1.5 border-t border-neutral-100 text-xs text-neutral-500">
          <span
            className="size-4 rounded-full inline-flex items-center justify-center text-white text-[9px] font-bold"
            style={{ backgroundColor: listing.seller.avatarColor }}
          >
            {listing.seller.name.charAt(0)}
          </span>
          <span className="truncate">{listing.seller.name}</span>
          <span className="inline-flex items-center gap-0.5 text-neutral-400 font-medium mr-auto shrink-0">
            <Star className="size-3 fill-current text-amber-400" />
            {listing.seller.credibility}
          </span>
        </div>
      </div>
    </Link>
  );
}
