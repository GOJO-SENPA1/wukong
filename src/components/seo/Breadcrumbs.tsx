import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { clsx as cx } from "clsx";
import type { Crumb } from "@/lib/seo";

/**
 * Where this page sits, as links back up the site. The matching BreadcrumbList
 * structured data comes from the route's server layout (see breadcrumbLd).
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cx("text-[14px]", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.name}-${i}`} className="flex min-w-0 items-center gap-2">
              {c.path && !last ? (
                <Link href={c.path} className="link-underline text-muted transition-colors hover:text-fg">
                  {c.name}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="max-w-[60vw] truncate text-fg/80 sm:max-w-md">
                  {c.name}
                </span>
              )}
              {!last && <ChevronRight size={14} className="shrink-0 text-faint" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
