import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { findBannedWord } from "@/lib/moderation";
import { notify } from "@/lib/notify";

async function getConvForUser(id: string, userId: string) {
  const conv = await db.conversation.findUnique({
    where: { id },
    include: { listing: true, buyer: true, seller: true },
  });
  if (!conv || (conv.buyerId !== userId && conv.sellerId !== userId)) return null;
  return conv;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const conv = await getConvForUser(id, session.sub);
  if (!conv) return NextResponse.json({ error: "not found" }, { status: 404 });

  const messages = await db.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  // mark counterpart messages as read
  await db.message.updateMany({
    where: { conversationId: id, senderId: { not: session.sub }, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      mine: m.senderId === session.sub,
      at: m.createdAt.toISOString(),
      readAt: m.readAt?.toISOString() ?? null,
    })),
  });
}

const postSchema = z.object({ body: z.string().min(1).max(2000) });

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const conv = await getConvForUser(id, session.sub);
  if (!conv) return NextResponse.json({ error: "not found" }, { status: 404 });

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "رسالة غير صالحة" }, { status: 400 });
  }

  const banned = await findBannedWord(parsed.data.body);
  if (banned) {
    return NextResponse.json(
      { error: "رسالتك تحتوي محتوى مخالفاً لسياسات المنصة" },
      { status: 422 }
    );
  }

  const message = await db.message.create({
    data: { conversationId: id, senderId: session.sub, body: parsed.data.body },
  });

  // notify the counterpart (throttled: skip if an unread chat notification exists)
  const recipientId = conv.buyerId === session.sub ? conv.sellerId : conv.buyerId;
  const link = `/dashboard/messages/${id}`;
  const existing = await db.notification.findFirst({
    where: { userId: recipientId, type: "MESSAGE", link, readAt: null },
  });
  if (!existing) {
    await notify(
      recipientId,
      "MESSAGE",
      "رسالة جديدة",
      `رسالة من ${session.name} حول "${conv.listing.title}"`,
      link
    );
  }

  return NextResponse.json({ ok: true, id: message.id });
}
