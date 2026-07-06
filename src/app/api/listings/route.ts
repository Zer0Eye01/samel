import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPlanLimits } from "@/lib/limits";
import { buildSearchText } from "@/lib/arabic";
import { findBannedWord } from "@/lib/moderation";

const MAX_FILE = 5 * 1024 * 1024; // 5MB (client compresses larger images)
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

// category icon → fallback placeholder image
const FALLBACK: Record<string, string> = {
  car: "car2",
  building: "apt1",
  smartphone: "phone1",
  sofa: "sofa1",
  shirt: "bag1",
  paw: "cat1",
  dumbbell: "dumbbell1",
  wrench: "tools1",
  factory: "tools1",
  briefcase: "book1",
  package: "chair1",
};

const base = z.object({
  type: z.enum(["STANDARD", "AUCTION"]),
  categoryId: z.string().min(1),
  title: z.string().min(4).max(100),
  description: z.string().min(20).max(5000),
  condition: z.enum(["NEW", "LIKE_NEW", "USED"]),
  city: z.string().min(2),
  neighborhood: z.string().max(60).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "سجّل دخولك أولاً" }, { status: 401 });
  }

  const fd = await req.formData().catch(() => null);
  if (!fd) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = base.safeParse({
    type: fd.get("type"),
    categoryId: fd.get("categoryId"),
    title: fd.get("title"),
    description: fd.get("description"),
    condition: fd.get("condition"),
    city: fd.get("city"),
    neighborhood: fd.get("neighborhood") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "يرجى التحقق من الحقول المطلوبة" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const category = await db.category.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) {
    return NextResponse.json({ error: "فئة غير موجودة" }, { status: 400 });
  }

  // banned content check (admin-managed word list)
  const banned = await findBannedWord(`${data.title} ${data.description}`);
  if (banned) {
    return NextResponse.json(
      { error: "الإعلان يحتوي محتوى مخالفاً لسياسات المنصة والأنظمة المحلية" },
      { status: 422 }
    );
  }

  // account limits (from admin-editable plans)
  const limits = await getPlanLimits(user.isPro);
  const activeCount = await db.listing.count({
    where: { sellerId: user.id, status: "ACTIVE", type: data.type },
  });
  if (data.type === "STANDARD" && activeCount >= limits.maxListings) {
    return NextResponse.json(
      { error: `الحد الأقصى ${limits.maxListings} إعلانات نشطة — رقِّ حسابك إلى برو` },
      { status: 403 }
    );
  }
  if (data.type === "AUCTION" && activeCount >= limits.maxAuctions) {
    return NextResponse.json(
      { error: `الحد الأقصى ${limits.maxAuctions} مزادات نشطة` },
      { status: 403 }
    );
  }

  // auction fields
  let auctionInput: {
    startPrice: number;
    minIncrement: number;
    buyNowPrice: number | null;
    durationHours: number;
    terms: string | null;
  } | null = null;
  let price: number | null = null;

  if (data.type === "AUCTION") {
    const startPrice = Number(fd.get("startPrice"));
    const minIncrement = Number(fd.get("minIncrement"));
    const durationHours = Number(fd.get("durationHours"));
    const buyNowRaw = String(fd.get("buyNowPrice") ?? "").trim();
    const buyNowPrice = buyNowRaw ? Number(buyNowRaw) : null;

    if (!Number.isInteger(startPrice) || startPrice < 1) {
      return NextResponse.json({ error: "سعر البداية غير صالح" }, { status: 400 });
    }
    if (!Number.isInteger(minIncrement) || minIncrement < 1) {
      return NextResponse.json({ error: "حد الزيادة غير صالح" }, { status: 400 });
    }
    if (![24, 72, 120, 168].includes(durationHours)) {
      return NextResponse.json({ error: "مدة المزاد غير صالحة" }, { status: 400 });
    }
    if (buyNowPrice != null && (!Number.isInteger(buyNowPrice) || buyNowPrice <= startPrice)) {
      return NextResponse.json(
        { error: "سعر الشراء الفوري يجب أن يكون أعلى من سعر البداية" },
        { status: 400 }
      );
    }
    auctionInput = {
      startPrice,
      minIncrement,
      buyNowPrice,
      durationHours,
      terms: String(fd.get("terms") ?? "").trim() || null,
    };
  } else {
    price = Number(fd.get("price"));
    if (!Number.isInteger(price) || price < 1) {
      return NextResponse.json({ error: "السعر غير صالح" }, { status: 400 });
    }
  }

  // image uploads
  const files = fd.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > 10) {
    return NextResponse.json({ error: "الحد الأقصى 10 صور" }, { status: 400 });
  }
  const urls: string[] = [];
  if (files.length > 0) {
    const dir = join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    for (const file of files) {
      const ext = ALLOWED.get(file.type);
      if (!ext) {
        return NextResponse.json(
          { error: "صيغة صورة غير مدعومة — استخدم JPG أو PNG أو WebP" },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE) {
        return NextResponse.json(
          { error: "حجم الصورة يتجاوز 5 ميجابايت — جرّب صورة أصغر" },
          { status: 400 }
        );
      }
      const name = `${randomUUID()}.${ext}`;
      await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));
      urls.push(`/uploads/${name}`);
    }
  } else {
    urls.push(`/images/ph/${FALLBACK[category.icon] ?? "chair1"}.svg`);
  }

  const showPhone = fd.get("showPhone") != null && !!user.phone;
  const deliveryRaw = String(fd.get("deliveryMethod") ?? "PICKUP");
  const deliveryMethod = ["PICKUP", "SHIPPING", "DELIVERY"].includes(deliveryRaw)
    ? deliveryRaw
    : "PICKUP";

  const listing = await db.listing.create({
    data: {
      type: data.type,
      title: data.title,
      description: data.description,
      price,
      condition: data.condition,
      city: data.city,
      neighborhood: data.neighborhood ?? null,
      images: JSON.stringify(urls),
      sellerId: user.id,
      categoryId: category.id,
      phone: showPhone ? user.phone : null,
      whatsapp: showPhone ? user.phone : null,
      showPhone,
      deliveryMethod,
      searchText: buildSearchText(data.title, data.description, data.city),
    },
  });

  let auctionId: string | undefined;
  if (auctionInput) {
    const auction = await db.auction.create({
      data: {
        listingId: listing.id,
        startPrice: auctionInput.startPrice,
        minIncrement: auctionInput.minIncrement,
        buyNowPrice: auctionInput.buyNowPrice,
        terms: auctionInput.terms,
        endsAt: new Date(Date.now() + auctionInput.durationHours * 3_600_000),
      },
    });
    auctionId = auction.id;
  }

  return NextResponse.json({ ok: true, id: listing.id, auctionId });
}
