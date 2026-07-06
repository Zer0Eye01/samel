import {
  Gavel,
  ListChecks,
  Scale,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "لوحة الإدارة" };

export default async function AdminDashboard() {
  await requireStaff(STAFF_ROLES);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);

  const [
    userCount,
    newUsers,
    listingCount,
    newListings,
    liveAuctions,
    openDisputes,
    bannerClicks,
    proCount,
    auditLogs,
    recentUsers,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.listing.count({ where: { status: "ACTIVE" } }),
    db.listing.count({ where: { createdAt: { gte: weekAgo } } }),
    db.auction.count({ where: { status: "LIVE", endsAt: { gt: now } } }),
    db.dispute.count({ where: { status: "OPEN" } }),
    db.banner.aggregate({ _sum: { clicks: true } }),
    db.user.count({ where: { isPro: true } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const stats = [
    { label: "المستخدمون", value: userCount, sub: `+${newUsers} هذا الأسبوع`, icon: Users, cls: "text-info bg-blue-50" },
    { label: "إعلانات نشطة", value: listingCount, sub: `+${newListings} هذا الأسبوع`, icon: ListChecks, cls: "text-primary-600 bg-primary-50" },
    { label: "مزادات مباشرة", value: liveAuctions, sub: "الآن", icon: Gavel, cls: "text-red-600 bg-red-50" },
    { label: "نزاعات مفتوحة", value: openDisputes, sub: "تحتاج مراجعة", icon: Scale, cls: "text-amber-600 bg-amber-50" },
    { label: "اشتراكات برو", value: proCount, sub: "مشترك", icon: Wallet, cls: "text-success bg-green-50" },
    { label: "نقرات البانرات", value: bannerClicks._sum.clicks ?? 0, sub: "إجمالي", icon: TrendingUp, cls: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="section-title">لوحة المعلومات</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map(({ label, value, sub, icon: Icon, cls }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center justify-between">
              <span className={`size-9 rounded-xl flex items-center justify-center ${cls}`}>
                <Icon className="size-4.5" />
              </span>
            </div>
            <p className="font-display font-extrabold text-2xl mt-3">
              {value.toLocaleString("en-US")}
            </p>
            <p className="text-sm text-neutral-500">{label}</p>
            <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 font-bold text-sm">
            سجل النظام (Audit Log)
          </div>
          {auditLogs.length === 0 ? (
            <p className="p-6 text-sm text-neutral-400 text-center">
              لا توجد عمليات مسجلة بعد
            </p>
          ) : (
            <ul className="divide-y divide-neutral-50">
              {auditLogs.map((log) => (
                <li key={log.id} className="px-4 py-2.5 text-sm flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-mono text-xs bg-neutral-100 rounded px-1.5 py-0.5">
                      {log.action}
                    </span>
                    <span className="text-neutral-600 mr-2 text-xs">{log.detail}</span>
                  </div>
                  <span className="text-xs text-neutral-400 shrink-0" suppressHydrationWarning>
                    {timeAgo(log.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 font-bold text-sm">
            أحدث المستخدمين
          </div>
          <ul className="divide-y divide-neutral-50">
            {recentUsers.map((u) => (
              <li key={u.id} className="px-4 py-2.5 text-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="size-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
                    style={{ backgroundColor: u.avatarColor }}
                  >
                    {u.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold line-clamp-1">{u.name}</p>
                    <p className="text-xs text-neutral-400">{u.city}</p>
                  </div>
                </div>
                <span className="text-xs text-neutral-400 shrink-0" suppressHydrationWarning>
                  {timeAgo(u.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
