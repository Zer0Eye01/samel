"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { applyCredibility, resolveDispute } from "@/lib/credibility";

async function audit(actorId: string, action: string, detail: string) {
  await db.auditLog.create({ data: { actorId, action, detail } });
}

export async function toggleBanAction(formData: FormData) {
  const staff = await requireStaff(["ADMIN", "MODERATOR"]);
  const userId = String(formData.get("userId"));
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.role === "ADMIN") return;
  await db.user.update({
    where: { id: userId },
    data: { isBanned: !user.isBanned },
  });
  await audit(
    staff.id,
    user.isBanned ? "UNBAN_USER" : "BAN_USER",
    `${user.name} (${user.phone})`
  );
  revalidatePath("/admin/users");
}

export async function adjustCredibilityAction(formData: FormData) {
  const staff = await requireStaff(["ADMIN", "SUPPORT"]);
  const userId = String(formData.get("userId"));
  const delta = Number(formData.get("delta"));
  const reason = String(formData.get("reason") || "تعديل إداري");
  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 50) return;
  await applyCredibility(userId, delta, `${reason} (بواسطة ${staff.name})`);
  await audit(staff.id, "ADJUST_CREDIBILITY", `${userId}: ${delta > 0 ? "+" : ""}${delta} — ${reason}`);
  revalidatePath("/admin/users");
}

export async function toggleFeatureAction(formData: FormData) {
  const staff = await requireStaff(["ADMIN", "MODERATOR"]);
  const id = String(formData.get("listingId"));
  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing) return;
  await db.listing.update({
    where: { id },
    data: { isFeatured: !listing.isFeatured },
  });
  await audit(staff.id, listing.isFeatured ? "UNFEATURE_LISTING" : "FEATURE_LISTING", listing.title);
  revalidatePath("/admin/listings");
}

export async function removeListingAction(formData: FormData) {
  const staff = await requireStaff(["ADMIN", "MODERATOR"]);
  const id = String(formData.get("listingId"));
  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing) return;
  await db.listing.update({ where: { id }, data: { status: "REMOVED" } });
  await audit(staff.id, "REMOVE_LISTING", listing.title);
  revalidatePath("/admin/listings");
}

export async function restoreListingAction(formData: FormData) {
  const staff = await requireStaff(["ADMIN", "MODERATOR"]);
  const id = String(formData.get("listingId"));
  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing) return;
  await db.listing.update({ where: { id }, data: { status: "ACTIVE" } });
  await audit(staff.id, "RESTORE_LISTING", listing.title);
  revalidatePath("/admin/listings");
}

export async function resolveDisputeAction(formData: FormData) {
  const staff = await requireStaff(["ADMIN", "SUPPORT"]);
  const disputeId = String(formData.get("disputeId"));
  const favor = String(formData.get("favor"));
  const resolution = String(formData.get("resolution") || "").trim();
  if (favor !== "SELLER" && favor !== "BUYER") return;
  if (resolution.length < 5) return;
  await resolveDispute(disputeId, favor, resolution, staff.id);
  revalidatePath("/admin/disputes");
}

export async function createBannerAction(formData: FormData) {
  const staff = await requireStaff(["ADMIN"]);
  const title = String(formData.get("title") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim() || null;
  const linkUrl = String(formData.get("linkUrl") || "").trim() || null;
  const embedHtml = String(formData.get("embedHtml") || "").trim() || null;
  const position = String(formData.get("position") || "HOME_TOP");
  if (!title || (!imageUrl && !embedHtml)) return;
  await db.banner.create({ data: { title, imageUrl, linkUrl, embedHtml, position } });
  await audit(staff.id, "CREATE_BANNER", title);
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function toggleBannerAction(formData: FormData) {
  const staff = await requireStaff(["ADMIN"]);
  const id = String(formData.get("bannerId"));
  const banner = await db.banner.findUnique({ where: { id } });
  if (!banner) return;
  await db.banner.update({
    where: { id },
    data: { status: banner.status === "ACTIVE" ? "DISABLED" : "ACTIVE" },
  });
  await audit(staff.id, "TOGGLE_BANNER", `${banner.title} → ${banner.status === "ACTIVE" ? "معطل" : "نشط"}`);
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function deleteBannerAction(formData: FormData) {
  const staff = await requireStaff(["ADMIN"]);
  const id = String(formData.get("bannerId"));
  const banner = await db.banner.delete({ where: { id } }).catch(() => null);
  if (banner) await audit(staff.id, "DELETE_BANNER", banner.title);
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function closeReportAction(formData: FormData) {
  const staff = await requireStaff(["ADMIN", "MODERATOR", "SUPPORT"]);
  const id = String(formData.get("reportId"));
  const outcome = String(formData.get("outcome")); // RESOLVED | DISMISSED
  if (outcome !== "RESOLVED" && outcome !== "DISMISSED") return;
  await db.report.update({
    where: { id },
    data: { status: outcome, resolvedAt: new Date() },
  });
  await audit(staff.id, `REPORT_${outcome}`, id);
  revalidatePath("/admin/reports");
}

export async function hideCommentAction(formData: FormData) {
  const staff = await requireStaff(["ADMIN", "MODERATOR", "SUPPORT"]);
  const id = String(formData.get("commentId"));
  const comment = await db.comment.findUnique({ where: { id } });
  if (!comment) return;
  await db.comment.update({
    where: { id },
    data: { isHidden: !comment.isHidden },
  });
  await audit(staff.id, comment.isHidden ? "UNHIDE_COMMENT" : "HIDE_COMMENT", id);
  revalidatePath("/admin/reports");
}

export async function updatePlanAction(formData: FormData) {
  const staff = await requireStaff(["ADMIN"]);
  const id = String(formData.get("planId"));
  const name = String(formData.get("name") || "").trim();
  const price = Number(formData.get("price"));
  const period = String(formData.get("period") || "").trim();
  const maxListings = Number(formData.get("maxListings"));
  const maxAuctions = Number(formData.get("maxAuctions"));
  const features = String(formData.get("features") || "")
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
  if (!name || !Number.isFinite(price) || price < 0) return;
  await db.plan.update({
    where: { id },
    data: {
      name,
      price: Math.round(price),
      period,
      maxListings: Number.isInteger(maxListings) ? maxListings : undefined,
      maxAuctions: Number.isInteger(maxAuctions) ? maxAuctions : undefined,
      features: JSON.stringify(features),
      highlight: formData.get("highlight") != null,
      isActive: formData.get("isActive") != null,
    },
  });
  await audit(staff.id, "UPDATE_PLAN", `${name} — ${price} ر.س`);
  revalidatePath("/admin/plans");
  revalidatePath("/pro");
}

export async function addBannedWordAction(formData: FormData) {
  const staff = await requireStaff(["ADMIN"]);
  const { normalizeArabic } = await import("@/lib/arabic");
  const word = normalizeArabic(String(formData.get("word") || ""));
  if (word.length < 2) return;
  await db.bannedWord.upsert({
    where: { word },
    create: { word },
    update: {},
  });
  await audit(staff.id, "ADD_BANNED_WORD", word);
  revalidatePath("/admin/moderation");
}

export async function deleteBannedWordAction(formData: FormData) {
  const staff = await requireStaff(["ADMIN"]);
  const id = String(formData.get("wordId"));
  const word = await db.bannedWord.delete({ where: { id } }).catch(() => null);
  if (word) await audit(staff.id, "DELETE_BANNED_WORD", word.word);
  revalidatePath("/admin/moderation");
}

export async function broadcastAction(formData: FormData) {
  const staff = await requireStaff(["ADMIN"]);
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const link = String(formData.get("link") || "").trim() || null;
  if (title.length < 3 || body.length < 5) return;
  const users = await db.user.findMany({
    where: { isBanned: false },
    select: { id: true },
  });
  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: "SYSTEM",
      title,
      body,
      link,
    })),
  });
  await audit(staff.id, "BROADCAST", `${title} → ${users.length} مستخدم`);
  revalidatePath("/admin/moderation");
}
