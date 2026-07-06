import type { Prisma } from "@prisma/client";
import { arabicTerms, normalizeArabic } from "./arabic";

export type SP = Record<string, string | string[] | undefined>;

export const str = (v: string | string[] | undefined) =>
  typeof v === "string" && v.length > 0 ? v : undefined;

export function buildListingWhere(sp: SP): Prisma.ListingWhereInput {
  const q = str(sp.q);
  const min = Number(str(sp.min)) || undefined;
  const max = Number(str(sp.max)) || undefined;
  const category = str(sp.category);
  const terms = q ? arabicTerms(q) : [];
  return {
    status: "ACTIVE",
    // smart Arabic search: every term must appear in the normalized index,
    // so "ايفون" matches "آيفون" and "أيفون" alike
    ...(terms.length > 0
      ? {
          AND: terms.map((t) => ({
            OR: [
              { searchText: { contains: t } },
              { title: { contains: t } },
            ],
          })),
        }
      : q
        ? { searchText: { contains: normalizeArabic(q) } }
        : {}),
    ...(str(sp.city) ? { city: str(sp.city) } : {}),
    ...(str(sp.condition) ? { condition: str(sp.condition) } : {}),
    ...(str(sp.type) ? { type: str(sp.type) } : {}),
    ...(str(sp.featured) ? { isFeatured: true } : {}),
    ...(min || max ? { price: { gte: min, lte: max } } : {}),
    ...(category
      ? {
          category: {
            OR: [{ slug: category }, { parent: { slug: category } }],
          },
        }
      : {}),
  };
}

export function listingOrderBy(
  sort: string | undefined
): Prisma.ListingOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    case "views":
      return { views: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

/**
 * Relevance score for search results. Ordering: relevance → promotion
 * (featured) → same-city → recency.
 */
export function scoreListing(
  listing: { title: string; searchText: string; isFeatured: boolean; city: string; createdAt: Date },
  q: string,
  userCity?: string
): number {
  const terms = arabicTerms(q);
  const title = normalizeArabic(listing.title);
  let score = 0;
  for (const t of terms) {
    if (title.includes(t)) score += 5;
    else if (listing.searchText.includes(t)) score += 2;
  }
  if (listing.isFeatured) score += 3;
  if (userCity && listing.city === userCity) score += 1;
  // recency: up to +2 for listings under a week old
  const ageDays = (Date.now() - listing.createdAt.getTime()) / 86_400_000;
  score += Math.max(0, 2 - ageDays / 3.5);
  return score;
}
