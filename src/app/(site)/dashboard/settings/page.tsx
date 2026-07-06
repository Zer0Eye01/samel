import { requireUser } from "@/lib/auth";
import { SettingsForm } from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "إعدادات الحساب" };

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="space-y-5">
      <h1 className="section-title">إعدادات الحساب</h1>
      <SettingsForm
        initial={{
          name: user.name,
          city: user.city,
          phone: user.phone ?? "",
          email: user.email,
          avatarUrl: user.avatarUrl,
          avatarColor: user.avatarColor,
        }}
      />
    </div>
  );
}
