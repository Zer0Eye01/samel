import Link from "next/link";
import { AtSign, Gavel, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { getT } from "@/lib/i18n";

export async function Footer() {
  const { t } = await getT();
  const f = t.footer;

  const columns: { title: string; links: [string, string][] }[] = [
    {
      title: f.market,
      links: [
        [f.liveAuctions, "/auctions"],
        [f.latestAds, "/listings"],
        [f.allCategories, "/categories"],
        [f.postYourAd, "/sell"],
      ],
    },
    {
      title: f.trending,
      links: [
        [f.vehicles, "/category/cars"],
        [f.realestate, "/category/realestate"],
        [f.electronics, "/category/electronics"],
        [f.animals, "/category/animals"],
      ],
    },
    {
      title: f.samel,
      links: [
        [f.pro, "/pro"],
        [f.trust, "/trust"],
        [f.terms, "/terms"],
        [f.contact, "/contact"],
      ],
    },
  ];

  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-16 pb-28 md:pb-0">
      <div className="container-page py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <span className="size-10 rounded-xl bg-primary-500 text-white flex items-center justify-center">
              <Gavel className="size-5.5" />
            </span>
            <span className="font-display font-extrabold text-2xl text-white">صامل</span>
          </div>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-xs">{f.tagline}</p>
          <div className="flex items-center gap-2">
            {[
              { icon: AtSign, label: "X" },
              { icon: MessageCircle, label: "WhatsApp" },
              { icon: Mail, label: "Email" },
            ].map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="size-9 rounded-full bg-neutral-800 hover:bg-primary-500 flex items-center justify-center transition-colors"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="font-bold text-white mb-3">{col.title}</h4>
            <ul className="space-y-2.5 text-sm">
              {col.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-neutral-400 hover:text-primary-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* trust strip */}
      <div className="border-t border-neutral-800">
        <div className="container-page py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-xs text-neutral-400">
            <ShieldCheck className="size-4 text-primary-400" />
            {f.safety}
          </p>
          <div className="flex items-center gap-2">
            {["مدى", "Apple Pay", "STC Pay", "Visa"].map((m) => (
              <span key={m} className="rounded-md bg-neutral-800 px-2.5 py-1 text-[11px] text-neutral-300">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-800">
        <div className="container-page py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} صامل — {f.rights}</p>
          <p>{f.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
