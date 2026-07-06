"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

const FEATURE_COST = 100; // points for 7 days of featuring

export async function featureWithPointsAction(formData: FormData) {
  const user = await requireUser();
  const listingId = String(formData.get("listingId"));

  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== user.id) return;
  if (listing.status !== "ACTIVE" || listing.isFeatured) return;
  if (user.points < FEATURE_COST) return;

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { points: { decrement: FEATURE_COST } },
    }),
    db.listing.update({
      where: { id: listingId },
      data: {
        isFeatured: true,
        featuredUntil: new Date(Date.now() + 7 * 86_400_000),
      },
    }),
  ]);

  await notify(
    user.id,
    "SYSTEM",
    "تم تمييز إعلانك",
    `أصبح "${listing.title}" إعلاناً مميزاً لمدة 7 أيام مقابل ${FEATURE_COST} نقطة.`,
    `/dashboard/listings`
  );

  revalidatePath("/dashboard/listings");
  revalidatePath("/");
}
