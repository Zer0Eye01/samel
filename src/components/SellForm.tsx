"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Gavel, ImagePlus, Loader2, Tag, X } from "lucide-react";
import { AUCTION_DURATIONS, CITIES, CONDITIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Cat = { id: string; nameAr: string; children: { id: string; nameAr: string }[] };

const MAX_IMAGE = 5 * 1024 * 1024; // 5MB

/** Compress oversized images client-side (canvas → JPEG) before upload. */
async function compressImage(file: File): Promise<File | null> {
  if (file.size <= MAX_IMAGE) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.8)
    );
    if (!blob || blob.size > MAX_IMAGE) return null;
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
      type: "image/jpeg",
    });
  } catch {
    return null;
  }
}

export function SellForm({
  categories,
  canListing,
  canAuction,
}: {
  categories: Cat[];
  canListing: boolean;
  canAuction: boolean;
}) {
  const router = useRouter();
  const [type, setType] = useState<"STANDARD" | "AUCTION">("STANDARD");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [imgNote, setImgNote] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function addFiles(list: FileList | null) {
    if (!list) return;
    setImgNote("");
    const kept: File[] = [];
    let compressed = 0;
    let rejected = 0;
    for (const f of Array.from(list)) {
      const result = await compressImage(f);
      if (!result) {
        rejected++;
        continue;
      }
      if (result !== f) compressed++;
      kept.push(result);
    }
    if (compressed > 0) setImgNote(`تم ضغط ${compressed} صورة تلقائياً لتناسب حد 5MB`);
    if (rejected > 0)
      setImgNote((n) => `${n ? n + " · " : ""}تم استبعاد ${rejected} صورة لتجاوزها الحد حتى بعد الضغط`);
    setFiles((prev) => [...prev, ...kept].slice(0, 10));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("type", type);
    fd.delete("images");
    files.forEach((f) => fd.append("images", f));

    const res = await fetch("/api/listings", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "تعذّر نشر الإعلان");
      setLoading(false);
      return;
    }
    router.push(data.auctionId ? `/auctions/${data.auctionId}` : `/listings/${data.id}`);
  }

  const typeBlocked = type === "STANDARD" ? !canListing : !canAuction;

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* type selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setType("STANDARD")}
          className={cn(
            "card p-4 text-right transition-all cursor-pointer",
            type === "STANDARD"
              ? "ring-2 ring-primary-500 border-primary-300"
              : "hover:border-neutral-300"
          )}
        >
          <Tag className={cn("size-6 mb-2", type === "STANDARD" ? "text-primary-500" : "text-neutral-400")} />
          <p className="font-bold">بيع عادي</p>
          <p className="text-xs text-neutral-500 mt-1">
            حدد سعرك ويتواصل معك المشترون مباشرة
          </p>
        </button>
        <button
          type="button"
          onClick={() => setType("AUCTION")}
          className={cn(
            "card p-4 text-right transition-all cursor-pointer",
            type === "AUCTION"
              ? "ring-2 ring-red-500 border-red-300"
              : "hover:border-neutral-300"
          )}
        >
          <Gavel className={cn("size-6 mb-2", type === "AUCTION" ? "text-red-500" : "text-neutral-400")} />
          <p className="font-bold">مزاد</p>
          <p className="text-xs text-neutral-500 mt-1">
            دع المشترين يتنافسون — والسعر يرتفع تلقائياً
          </p>
        </button>
      </div>

      {typeBlocked && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          وصلت للحد الأقصى من {type === "STANDARD" ? "الإعلانات" : "المزادات"} النشطة.
          رقِّ حسابك إلى برو لرفع الحد.
        </p>
      )}

      {/* basic details */}
      <div className="card p-5 space-y-4">
        <h2 className="font-bold">تفاصيل الإعلان</h2>

        <div>
          <label className="block text-sm font-medium mb-1.5">الفئة</label>
          <select name="categoryId" className="input" required defaultValue="">
            <option value="" disabled>اختر الفئة</option>
            {categories.map((cat) =>
              cat.children.length > 0 ? (
                <optgroup key={cat.id} label={cat.nameAr}>
                  {cat.children.map((child) => (
                    <option key={child.id} value={child.id}>{child.nameAr}</option>
                  ))}
                </optgroup>
              ) : (
                <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
              )
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">العنوان</label>
          <input name="title" className="input" required maxLength={100} placeholder="مثال: آيفون 15 برو ماكس 256 قيقا" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">الوصف</label>
          <textarea
            name="description"
            className="input min-h-32 py-3"
            required
            minLength={20}
            placeholder="اكتب وصفاً دقيقاً: الحالة، العيوب إن وجدت، سبب البيع، ما يشمله البيع..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">الحالة</label>
            <select name="condition" className="input" defaultValue="USED">
              {Object.entries(CONDITIONS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">المدينة</label>
            <select name="city" className="input" defaultValue="الرياض">
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              الحي <span className="text-neutral-400">(اختياري)</span>
            </label>
            <input name="neighborhood" className="input" placeholder="مثال: حي النرجس" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">طريقة التسليم</label>
            <select name="deliveryMethod" className="input" defaultValue="PICKUP">
              <option value="PICKUP">استلام يدوي (مقابلة)</option>
              <option value="SHIPPING">شحن</option>
              <option value="DELIVERY">توصيل</option>
            </select>
          </div>
        </div>
      </div>

      {/* pricing */}
      {type === "STANDARD" ? (
        <div className="card p-5 space-y-4">
          <h2 className="font-bold">السعر</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">السعر (ر.س)</label>
            <input name="price" className="input" required inputMode="numeric" pattern="\d+" placeholder="1500" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="showPhone" defaultChecked className="size-4 accent-primary-500" />
            إظهار رقم جوالي في الإعلان (واتساب واتصال)
          </label>
        </div>
      ) : (
        <div className="card p-5 space-y-4 border-red-100">
          <h2 className="font-bold flex items-center gap-2">
            <Gavel className="size-5 text-red-500" />
            إعدادات المزاد
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">سعر البداية (ر.س)</label>
              <input name="startPrice" className="input" required inputMode="numeric" pattern="\d+" placeholder="1000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">الحد الأدنى للزيادة (ر.س)</label>
              <input name="minIncrement" className="input" required inputMode="numeric" pattern="\d+" defaultValue="50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">مدة المزاد</label>
              <select name="durationHours" className="input" defaultValue="72">
                {AUCTION_DURATIONS.map((d) => (
                  <option key={d.hours} value={d.hours}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                سعر الشراء الفوري <span className="text-neutral-400">(اختياري)</span>
              </label>
              <input name="buyNowPrice" className="input" inputMode="numeric" pattern="\d*" placeholder="اتركه فارغاً لتعطيله" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              شروط المزاد <span className="text-neutral-400">(اختياري)</span>
            </label>
            <textarea name="terms" className="input min-h-20 py-3" placeholder="مثال: المعاينة قبل الاستلام، البيع نهائي..." />
          </div>
          <p className="text-xs text-neutral-500 bg-neutral-50 rounded-lg p-3 leading-relaxed">
            حماية المزاد: هويات المزايدين تُخفى تلقائياً، ولا يمكنك المزايدة على
            مزادك، وأي مزايدة في آخر دقيقتين تمدد المزاد دقيقتين إضافيتين.
          </p>
        </div>
      )}

      {/* images */}
      <div className="card p-5 space-y-3">
        <h2 className="font-bold">الصور <span className="text-sm font-normal text-neutral-400">(حتى 10 صور — الأولى هي الغلاف)</span></h2>
        <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 py-8 cursor-pointer hover:border-primary-400 hover:bg-primary-50/40 transition-colors">
          <ImagePlus className="size-8 text-neutral-400" />
          <span className="text-sm text-neutral-500">
            اضغط لاختيار الصور (JPG / PNG / WebP — حتى 5MB، والأكبر يُضغط تلقائياً)
          </span>
          <input
            type="file"
            name="images"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </label>
        {files.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {files.map((f, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(f)}
                  alt=""
                  className="size-20 rounded-lg object-cover border border-neutral-200"
                />
                {i === 0 && (
                  <span className="absolute bottom-1 right-1 badge bg-primary-500 text-white text-[10px]">غلاف</span>
                )}
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -left-1.5 size-5 rounded-full bg-neutral-900 text-white flex items-center justify-center cursor-pointer"
                  aria-label="حذف الصورة"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {imgNote && <p className="text-xs text-amber-700">{imgNote}</p>}
        <p className="text-xs text-neutral-400">
          بدون صور؟ سنستخدم صورة رمزية حسب الفئة.
        </p>
      </div>

      {/* disclaimer */}
      <div className="card p-4 border-amber-200 bg-amber-50/50 space-y-3">
        <p className="text-xs text-amber-900 leading-relaxed">
          <b>إخلاء مسؤولية:</b> صامل منصة إلكترونية وسيطة بين المستخدمين فقط —
          لا تستلم المنتجات ولا الأموال، وغير مسؤولة عن جودة المنتج أو سلامة
          الصفقة أو أي أضرار أو خسائر تنتج عن عملية البيع أو الشراء. يتحمل
          المستخدم كامل المسؤولية عن صحة محتوى إعلانه والالتزام بأنظمة المملكة.
        </p>
        <label className="flex items-start gap-2.5 text-sm font-medium text-amber-900 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="size-4 accent-primary-500 mt-0.5 shrink-0"
          />
          أقر بأنني قرأت إخلاء المسؤولية وأن إعلاني متوافق مع الأنظمة المحلية
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        className="btn-primary w-full text-base"
        disabled={loading || typeBlocked || !accepted}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {type === "AUCTION" ? "إطلاق المزاد" : "نشر الإعلان"}
      </button>
    </form>
  );
}
