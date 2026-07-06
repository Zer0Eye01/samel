import { cn } from "@/lib/utils";

export function Avatar({
  name,
  color,
  src,
  className,
}: {
  name: string;
  color: string;
  src?: string | null;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full object-cover shrink-0 border border-neutral-200",
          className ?? "size-9"
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full text-white font-bold select-none shrink-0",
        className ?? "size-9 text-sm"
      )}
      style={{ backgroundColor: color }}
    >
      {name.trim().charAt(0)}
    </span>
  );
}
