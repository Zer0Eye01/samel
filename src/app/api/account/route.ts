import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { normalizeSaudiPhone } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2).max(60),
  city: z.string().min(2),
  phone: z.string().max(20).optional().or(z.literal("")),
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  let phone: string | null = null;
  if (parsed.data.phone) {
    phone = normalizeSaudiPhone(parsed.data.phone);
    if (!phone) {
      return NextResponse.json(
        { error: "رقم الجوال غير صالح — مثال: 05XXXXXXXX" },
        { status: 400 }
      );
    }
    const taken = await db.user.findFirst({
      where: { phone, id: { not: user.id } },
    });
    if (taken) {
      return NextResponse.json(
        { error: "رقم الجوال مستخدم في حساب آخر" },
        { status: 409 }
      );
    }
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      city: parsed.data.city,
      phone,
      // changing the number resets verification (future OTP flow)
      phoneVerified: phone === user.phone ? user.phoneVerified : false,
    },
  });

  return NextResponse.json({ ok: true });
}
