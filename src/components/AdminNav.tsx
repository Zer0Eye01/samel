"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flag,
  Gavel,
  Image as ImageIcon,
  LayoutDashboard,
  ListChecks,
  Scale,
  ShieldBan,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "لوحة المعلومات", icon: LayoutDashboard, roles: ["ADMIN", "MODERATOR", "SUPPORT", "ACCOUNTANT"] },
  { href: "/admin/users", label: "إدارة المستخدمين", icon: Users, roles: ["ADMIN", "MODERATOR", "SUPPORT"] },
  { href: "/admin/listings", label: "إدارة الإعلانات", icon: ListChecks, roles: ["ADMIN", "MODERATOR"] },
  { href: "/admin/bids", label: "سجل المزايدات", icon: Gavel, roles: ["ADMIN", "MODERATOR"] },
  { href: "/admin/disputes", label: "إدارة النزاعات", icon: Scale, roles: ["ADMIN", "SUPPORT"] },
  { href: "/admin/reports", label: "البلاغات", icon: Flag, roles: ["ADMIN", "MODERATOR", "SUPPORT"] },
  { href: "/admin/banners", label: "إدارة البانرات", icon: ImageIcon, roles: ["ADMIN"] },
  { href: "/admin/plans", label: "الباقات والأسعار", icon: Wallet, roles: ["ADMIN"] },
  { href: "/admin/moderation", label: "الإشراف والإشعارات", icon: ShieldBan, roles: ["ADMIN"] },
];

export function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <nav className="card p-2 flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
      {items
        .filter((item) => item.roles.includes(role))
        .map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-50"
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              {label}
            </Link>
          );
        })}
    </nav>
  );
}
