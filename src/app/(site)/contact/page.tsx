import { Mail, MessageCircle, Phone } from "lucide-react";

export const metadata = { title: "تواصل معنا" };

export default function ContactPage() {
  return (
    <div className="container-page py-12 pb-16 max-w-2xl space-y-8 text-center">
      <div className="space-y-3">
        <h1 className="font-display font-extrabold text-3xl">تواصل معنا</h1>
        <p className="text-neutral-500">
          فريق دعم صامل جاهز لمساعدتك في أي استفسار أو مشكلة
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Mail, label: "البريد الإلكتروني", value: "support@samel.sa" },
          { icon: Phone, label: "الهاتف", value: "920000000" },
          { icon: MessageCircle, label: "واتساب الأعمال", value: "+966 50 000 0000" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="card p-5 space-y-2">
            <Icon className="size-6 text-primary-500 mx-auto" />
            <p className="font-bold text-sm">{label}</p>
            <p className="text-sm text-neutral-500" dir="ltr">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-neutral-400">
        ساعات العمل: الأحد – الخميس، 9 صباحاً – 6 مساءً (توقيت السعودية)
      </p>
    </div>
  );
}
