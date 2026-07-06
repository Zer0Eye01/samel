import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { LISTING_STATUS } from "@/lib/constants";
import { formatSAR, parseImages, timeAgo } from "@/lib/utils";
import {
  removeListingAction,
  restoreListingAction,
  toggleFeatureAction,
} from "../actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "إدارة الإعلانات" };

export default async function AdminListingsPage() {
  await requireStaff(["ADMIN", "MODERATOR"]);

  const listings = await db.listing.findMany({
    orderBy: { createdAt: "desc" },
    include: { seller: true, category: true, auction: true },
    take: 100,
  });

  return (
    <div className="space-y-5">
      <h1 className="section-title">إدارة الإعلانات</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-175">
          <thead>
            <tr className="border-b border-neutral-100 text-right text-xs text-neutral-500">
              <th className="p-3 font-semibold">الإعلان</th>
              <th className="p-3 font-semibold">البائع</th>
              <th className="p-3 font-semibold">السعر</th>
              <th className="p-3 font-semibold">الحالة</th>
              <th className="p-3 font-semibold">النشر</th>
              <th className="p-3 font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {listings.map((l) => (
              <tr key={l.id} className="hover:bg-neutral-50/60">
                <td className="p-3">
                  <Link
                    href={l.auction ? `/auctions/${l.auction.id}` : `/listings/${l.id}`}
                    className="flex items-center gap-2 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={parseImages(l.images)[0]}
                      alt=""
                      className="size-10 rounded-lg object-cover border border-neutral-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold line-clamp-1 group-hover:text-primary-600 max-w-52">
                        {l.title}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {l.type === "AUCTION" ? "مزاد" : "بيع"} · {l.category.nameAr}
                        {l.isFeatured && " · مميز"}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="p-3 text-xs text-neutral-600">{l.seller.name}</td>
                <td className="p-3 tabular-nums text-xs">
                  {l.price != null
                    ? formatSAR(l.price)
                    : l.auction
                      ? formatSAR(l.auction.winningBid ?? l.auction.startPrice)
                      : "—"}
                </td>
                <td className="p-3">
                  <span
                    className={`badge ${
                      l.status === "ACTIVE"
                        ? "bg-green-50 text-green-700"
                        : l.status === "REMOVED"
                          ? "bg-red-50 text-red-600"
                          : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {LISTING_STATUS[l.status as keyof typeof LISTING_STATUS] ?? l.status}
                  </span>
                </td>
                <td className="p-3 text-xs text-neutral-400" suppressHydrationWarning>
                  {timeAgo(l.createdAt)}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <form action={toggleFeatureAction}>
                      <input type="hidden" name="listingId" value={l.id} />
                      <button className="badge bg-primary-500 text-white cursor-pointer hover:bg-primary-600">
                        {l.isFeatured ? "إلغاء التمييز" : "تمييز"}
                      </button>
                    </form>
                    {l.status === "REMOVED" ? (
                      <form action={restoreListingAction}>
                        <input type="hidden" name="listingId" value={l.id} />
                        <button className="badge bg-green-600 text-white cursor-pointer hover:bg-green-700">
                          استرجاع
                        </button>
                      </form>
                    ) : (
                      <form action={removeListingAction}>
                        <input type="hidden" name="listingId" value={l.id} />
                        <button className="badge bg-red-600 text-white cursor-pointer hover:bg-red-700">
                          حذف
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
