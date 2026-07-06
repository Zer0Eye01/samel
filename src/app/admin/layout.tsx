import Link from "next/link";
import { Gavel } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { ROLE_LABELS, STAFF_ROLES } from "@/lib/constants";
import { Avatar } from "@/components/Avatar";
import { AdminNav } from "@/components/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff(STAFF_ROLES);

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="bg-neutral-900 text-white sticky top-0 z-40">
        <div className="container-page h-14 flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2 font-display font-bold text-lg">
            <span className="size-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <Gavel className="size-4.5" />
            </span>
            لوحة إدارة صامل
          </Link>
          <div className="mr-auto flex items-center gap-3">
            <Link href="/" className="text-sm text-neutral-300 hover:text-white transition-colors">
              عرض الموقع
            </Link>
            <div className="flex items-center gap-2">
              <Avatar name={staff.name} color={staff.avatarColor} src={staff.avatarUrl} className="size-8 text-sm" />
              <div className="max-sm:hidden">
                <p className="text-sm font-semibold leading-none">{staff.name}</p>
                <p className="text-[11px] text-primary-400 mt-0.5">
                  {ROLE_LABELS[staff.role] ?? staff.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container-page py-6 grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-6 items-start">
        <AdminNav role={staff.role} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
