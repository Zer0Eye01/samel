import { db } from "./db";

export async function notify(
  userId: string,
  type: string,
  title: string,
  body: string,
  link?: string
) {
  await db.notification.create({ data: { userId, type, title, body, link } });
}
