"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { CITIES } from "@/lib/constants";
import { useLang } from "./LangProvider";

export function FiltersBar({ basePath = "/listings" }: { basePath?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  const f = t.filters;

  const [city, setCity] = useState(sp.get("city") ?? "");
  const [condition, setCondition] = useState(sp.get("condition") ?? "");
  const [type, setType] = useState(sp.get("type") ?? "");
  const [min, setMin] = useState(sp.get("min") ?? "");
  const [max, setMax] = useState(sp.get("max") ?? "");
  const [sort, setSort] = useState(sp.get("sort") ?? "newest");

  function apply() {
    const params = new URLSearchParams();
    const q = sp.get("q");
    if (q) params.set("q", q);
    if (city) params.set("city", city);
    if (condition) params.set("condition", condition);
    if (type) params.set("type", type);
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    if (sort !== "newest") params.set("sort", sort);
    router.push(`${basePath}${params.size ? `?${params}` : ""}`);
    setOpen(false);
  }

  function reset() {
    setCity("");
    setCondition("");
    setType("");
    setMin("");
    setMax("");
    setSort("newest");
    router.push(basePath);
    setOpen(false);
  }

  const active = [city, condition, type, min, max].filter(Boolean).length;

  return (
    <div className="card p-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between sm:hidden font-semibold text-sm cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="size-4" />
          {f.label} {active > 0 && <span className="badge bg-primary-500 text-white">{active}</span>}
        </span>
        <span className="text-neutral-400 text-xs">{open ? f.hide : f.show}</span>
      </button>

      <div className={`${open ? "grid" : "hidden"} sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 max-sm:mt-3`}>
        <select className="input" value={city} onChange={(e) => setCity(e.target.value)} aria-label={f.allCities}>
          <option value="">{f.allCities}</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select className="input" value={type} onChange={(e) => setType(e.target.value)} aria-label={f.bothTypes}>
          <option value="">{f.bothTypes}</option>
          <option value="STANDARD">{f.standard}</option>
          <option value="AUCTION">{f.auction}</option>
        </select>

        <select className="input" value={condition} onChange={(e) => setCondition(e.target.value)} aria-label={f.allConditions}>
          <option value="">{f.allConditions}</option>
          {Object.entries(t.card.conditions).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <input
          className="input"
          inputMode="numeric"
          placeholder={f.priceFrom}
          value={min}
          onChange={(e) => setMin(e.target.value.replace(/[^\d]/g, ""))}
        />
        <input
          className="input"
          inputMode="numeric"
          placeholder={f.priceTo}
          value={max}
          onChange={(e) => setMax(e.target.value.replace(/[^\d]/g, ""))}
        />

        <select className="input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="sort">
          <option value="newest">{f.sortNew}</option>
          <option value="price_asc">{f.sortPriceAsc}</option>
          <option value="price_desc">{f.sortPriceDesc}</option>
          <option value="views">{f.sortViews}</option>
        </select>

        <div className="flex gap-2 col-span-2 sm:col-span-1">
          <button onClick={apply} className="btn-primary flex-1">{f.apply}</button>
          {active > 0 && (
            <button onClick={reset} className="btn-ghost px-3" aria-label="reset">
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
