import Link from "next/link";
import {
  Coins,
  Gavel,
  ListChecks,
  ShieldCheck,
  Star,
  TrendingUp,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { finalizeExpiredAuctions } from "@/lib/auction";
import { expirePendingTransactions } from "@/lib/credibility";
import { formatSAR, timeAgo, trustLevel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "لوحة التحكم" };

export default async function DashboardPage() {
  const user = await requireUser();
  await finalizeExpiredAuctions();
  await expirePendingTransactions();

  // daily activity points (+10 once per day)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  let dailyAwarded = false;
  if (!user.lastDailyAt || user.lastDailyAt < startOfToday) {
    await db.user.update({
      where: { id: user.id },
      data: { points: { increment: 10 }, lastDailyAt: new Date() },
    });
    user.points += 10;
    dailyAwarded = true;
  }

  const [activeListings, activeAuctions, participated, pendingTx, credLogs] =
    await Promise.all([
      db.listing.count({
        where: { sellerId: user.id, status: "ACTIVE", type: "STANDARD" },
      }),
      db.listing.count({
        where: { sellerId: user.id, status: "ACTIVE", type: "AUCTION" },
      }),
      db.bid.groupBy({ by: ["auctionId"], where: { bidderId: user.id } }),
      db.transaction.findMany({
        where: {
          status: { in: ["PENDING", "DISPUTED"] },
          OR: [{ sellerId: user.id }, { buyerId: user.id }],
        },
        include: { listing: true },
        orderBy: { deadline: "asc" },
      }),
      db.credibilityLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const level = trustLevel(user.credibility);

  const stats = [
    { label: "إعلاناتي النشطة", value: activeListings, icon: ListChecks, color: "text-neutral-600 bg-neutral-100" },
    { label: "مزاداتي النشطة", value: activeAuctions, icon: Gavel, color: "text-neutral-600 bg-neutral-100" },
    { label: "مزادات شاركت فيها", value: participated.length, icon: TrendingUp, color: "text-neutral-600 bg-neutral-100" },
    { label: "معاملات ناجحة", value: user.successfulTx, icon: ShieldCheck, color: "text-neutral-600 bg-neutral-100" },
    { label: "نقاطي", value: user.points, icon: Coins, color: "text-primary-600 bg-primary-50" },
  ];

  return (
    <div className="space-y-6">
      {dailyAwarded && (
        <p className="card border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 flex items-center gap-2">
          <Coins className="size-4.5 shrink-0" />
          حصلت على +10 نقاط لنشاطك اليوم! اجمع النقاط وميّز إعلاناتك مجاناً (100
          نقطة = تمييز 7 أيام).
        </p>
      )}

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <span className={`size-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="size-5" />
            </span>
            <div>
              <p className="font-display font-extrabold text-2xl leading-none">{value}</p>
              <p className="text-xs text-neutral-500 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* pending confirmations callout */}
      {pendingTx.length > 0 && (
        <Link
          href="/dashboard/verifications"
          className="card border-amber-200 bg-amber-50 p-4 flex items-center gap-3 hover:shadow-card-hover transition-shadow"
        >
          <ShieldCheck className="size-6 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-amber-900">
              لديك {pendingTx.length} معاملة بانتظار التأكيد
            </p>
            <p className="text-sm text-amber-800 mt-0.5">
              أكد التسليم/الاستلام خلال المهلة للحفاظ على نقاط مصداقيتك
            </p>
          </div>
          <span className="btn-primary max-sm:hidden">التحققات</span>
        </Link>
      )}

      {/* credibility */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <Star className="size-5 text-amber-500 fill-current" />
            نقاط المصداقية
          </h2>
          <span className="font-display font-extrabold text-2xl" style={{ color: level.color }}>
            {user.credibility}/100
          </span>
        </div>
        <div className="h-3 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${user.credibility}%`, backgroundColor: level.color }}
          />
        </div>
        <p className="text-sm text-neutral-500">
          مستواك: <span className="font-bold" style={{ color: level.color }}>{level.label}</span>
          {" — "}تزيد النقاط بالمعاملات المؤكدة من الطرفين (+5) وتنقص بتجاهل
          التأكيد (-3) أو النزاعات الخاسرة (-15).
        </p>

        {credLogs.length > 0 && (
          <ul className="divide-y divide-neutral-50 text-sm">
            {credLogs.map((log) => (
              <li key={log.id} className="py-2 flex items-center justify-between gap-3">
                <span className="text-neutral-600">{log.reason}</span>
                <span className="flex items-center gap-3 shrink-0">
                  <span className={log.delta >= 0 ? "text-success font-bold" : "text-danger font-bold"}>
                    {log.delta > 0 ? `+${log.delta}` : log.delta}
                  </span>
                  <span className="text-xs text-neutral-400" suppressHydrationWarning>
                    {timeAgo(log.createdAt)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* pending list preview */}
      {pendingTx.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 font-bold text-sm">
            معاملات قيد التحقق
          </div>
          <ul className="divide-y divide-neutral-50">
            {pendingTx.map((t) => (
              <li key={t.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold line-clamp-1">{t.listing.title}</p>
                  <p className="text-xs text-neutral-500">
                    {t.sellerId === user.id ? "أنت البائع" : "أنت المشتري"} · {formatSAR(t.amount)}
                  </p>
                </div>
                <span
                  className={`badge shrink-0 ${
                    t.status === "DISPUTED"
                      ? "bg-red-50 text-red-600"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {t.status === "DISPUTED" ? "متنازع عليها" : "بانتظار التأكيد"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
