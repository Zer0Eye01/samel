"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const list = images.length > 0 ? images : ["/images/ph/chair1.svg"];
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-2">
      <div className="card overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={list[active]}
          alt={title}
          className="w-full aspect-4/3 object-cover"
        />
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {list.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              className={cn(
                "w-20 aspect-4/3 rounded-lg overflow-hidden border-2 shrink-0 transition-colors cursor-pointer",
                i === active ? "border-primary-500" : "border-transparent hover:border-neutral-300"
              )}
              aria-label={`صورة ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
