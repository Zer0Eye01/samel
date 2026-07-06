import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const fd = await req.formData().catch(() => null);
  const file = fd?.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "اختر صورة" }, { status: 400 });
  }

  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return NextResponse.json(
      { error: "صيغة غير مدعومة — استخدم JPG أو PNG أو WebP" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "حجم الصورة يتجاوز 5MB" }, { status: 400 });
  }

  const dir = join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));

  const url = `/uploads/avatars/${name}`;
  await db.user.update({ where: { id: user.id }, data: { avatarUrl: url } });

  return NextResponse.json({ ok: true, url });
}

/** Remove custom avatar → back to the colored-initial avatar. */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await db.user.update({ where: { id: user.id }, data: { avatarUrl: null } });
  return NextResponse.json({ ok: true });
}
