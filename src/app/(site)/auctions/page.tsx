import { db } from "@/lib/db";
import { cardInclude } from "@/lib/types";
import { getT } from "@/lib/i18n";
import { finalizeExpiredAuctions } from "@/lib/auction";
import { AuctionCard } from "@/components/AuctionCard";
import { EmptyState } from "@/components/EmptyState";
import { SectionHeader } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

export const metadata = { title: "المزادات المباشرة" };

export default async function AuctionsPage() {
  const { t } = await getT();
  await finalizeExpiredAuctions();
  const now = new Date();

  const [live, ended] = await Promise.all([
    db.listing.findMany({
      where: {
        type: "AUCTION",
        status: "ACTIVE",
        auction: { status: "LIVE", endsAt: { gt: now } },
      },
      include: cardInclude,
      orderBy: { auction: { endsAt: "asc" } },
    }),
    db.listing.findMany({
      where: { type: "AUCTION", auction: { status: { in: ["ENDED", "NO_SALE"] } } },
      include: cardInclude,
      orderBy: { auction: { endsAt: "desc" } },
      take: 4,
    }),
  ]);

  return (
    <div className="pb-8">
      <section className="bg-neutral-900 text-white">
        <div className="container-page py-10 text-center space-y-3">
          <span className="badge bg-red-600 text-white mx-auto">
            <span className="size-1.5 rounded-full bg-white animate-live-pulse" />
            {live.length} {t.auctionsPage.liveNow}
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl">
            {t.auctionsPage.title}
          </h1>
          <p className="text-neutral-400 max-w-xl mx-auto text-sm sm:text-base">
            {t.auctionsPage.subtitle}
          </p>
        </div>
      </section>

      <div className="container-page mt-8 space-y-12">
        {live.length === 0 ? (
          <EmptyState
            title={t.auctionsPage.emptyTitle}
            hint={t.auctionsPage.emptyHint}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {live.map((listing) => (
              <AuctionCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {ended.length > 0 && (
          <section>
            <SectionHeader title={t.auctionsPage.endedRecently} />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 opacity-80">
              {ended.map((listing) => (
                <AuctionCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
