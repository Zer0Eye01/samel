import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { findBannedWord } from "@/lib/moderation";

const schema = z.object({
  name: z.string().min(3).max(50),
  slug: z
    .string()
    .regex(/^[a-z0-9-]{3,30}$/, "معرف المتجر: أحرف إنجليزية صغيرة وأرقام وشرطات فقط"),
  description: z.string().max(500).optional().or(z.literal("")),
});

/** Create or update the current user's store. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 }
    );
  }

  const banned = await findBannedWord(
    `${parsed.data.name} ${parsed.data.description ?? ""}`
  );
  if (banned) {
    return NextResponse.json(
      { error: "محتوى المتجر يخالف سياسات المنصة" },
      { status: 422 }
    );
  }

  const slugTaken = await db.store.findFirst({
    where: { slug: parsed.data.slug, userId: { not: user.id } },
  });
  if (slugTaken) {
    return NextResponse.json({ error: "معرف المتجر محجوز" }, { status: 409 });
  }

  const store = await db.store.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || "",
    },
    update: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || "",
    },
  });

  return NextResponse.json({ ok: true, slug: store.slug });
}
