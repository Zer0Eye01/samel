import { ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { finalizeExpiredAuctions } from "@/lib/auction";
import { expirePendingTransactions } from "@/lib/credibility";
import { formatSAR, timeAgo } from "@/lib/utils";
import { ConfirmCard, type ConfirmTx } from "@/components/ConfirmCard";
import { EmptyState } from "@/components/EmptyState";
import { RateForm } from "@/components/RateForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "التحققات" };

const STATUS_LABEL: Record<string, [string, string]> = {
  CONFIRMED: ["مؤكدة", "bg-green-50 text-green-700"],
  CANCELLED: ["ملغاة", "bg-neutral-100 text-neutral-600"],
  DISPUTED: ["متنازع عليها", "bg-red-50 text-red-600"],
  EXPIRED: ["منتهية المهلة", "bg-amber-50 text-amber-700"],
};

export default async function VerificationsPage() {
  const user = await requireUser();
  await finalizeExpiredAuctions();
  await expirePendingTransactions();

  const txs = await db.transaction.findMany({
    where: { OR: [{ sellerId: user.id }, { buyerId: user.id }] },
    include: {
      listing: true,
      seller: true,
      buyer: true,
      dispute: { include: { evidences: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const myReviews = await db.review.findMany({
    where: { authorId: user.id, transactionId: { in: txs.map((t) => t.id) } },
    select: { transactionId: true },
  });
  const reviewed = new Set(myReviews.map((r) => r.transactionId));

  const open = txs.filter((t) => t.status === "PENDING" || t.status === "DISPUTED");
  const history = txs.filter((t) => t.status !== "PENDING" && t.status !== "DISPUTED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title flex items-center gap-2">
          <ShieldCheck className="size-6 text-primary-500" />
          التحققات
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          نظام التحقق المتبادل: بعد كل معاملة، يؤكد الطرفان إتمامها خلال 48 ساعة.
          التأكيد المتبادل يمنح الطرفين +5 نقاط مصداقية.
        </p>
      </div>

      {open.length === 0 ? (
        <EmptyState
          title="لا توجد معاملات بانتظار التحقق"
          hint="عند فوزك بمزاد أو بيع منتجك، ستظهر هنا مطالبة التأكيد"
        />
      ) : (
        <div className="grid gap-4">
          {open.map((t) => {
            const role = t.sellerId === user.id ? "SELLER" : "BUYER";
            const counterpart = role === "SELLER" ? t.buyer : t.seller;
            const tx: ConfirmTx = {
              id: t.id,
              role,
              title: t.listing.title,
              amount: t.amount,
              deadline: t.deadline.toISOString(),
              status: t.status,
              myAnswer: role === "SELLER" ? t.sellerAnswer : t.buyerAnswer,
              otherAnswered: !!(role === "SELLER" ? t.buyerAnswer : t.sellerAnswer),
              counterpart: {
                id: counterpart.id,
                name: counterpart.name,
                phone: counterpart.phone,
              },
              listingId: t.listingId,
              evidenceSubmitted:
                t.dispute?.evidences.some((ev) => ev.userId === user.id) ?? false,
            };
            return <ConfirmCard key={t.id} tx={tx} />;
          })}
        </div>
      )}

      {history.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 font-bold text-sm">
            سجل المعاملات
          </div>
          <ul className="divide-y divide-neutral-50">
            {history.map((t) => {
              const [label, cls] = STATUS_LABEL[t.status] ?? [t.status, "bg-neutral-100"];
              const other = t.sellerId === user.id ? t.buyer : t.seller;
              return (
                <li key={t.id} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold line-clamp-1">{t.listing.title}</p>
                      <p className="text-xs text-neutral-500" suppressHydrationWarning>
                        {t.sellerId === user.id ? "بعت إلى" : "اشتريت من"} {other.name} ·{" "}
                        {formatSAR(t.amount)} · {timeAgo(t.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {t.status === "CONFIRMED" && !reviewed.has(t.id) && (
                        <RateForm transactionId={t.id} targetName={other.name} />
                      )}
                      <span className={`badge ${cls}`}>{label}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
