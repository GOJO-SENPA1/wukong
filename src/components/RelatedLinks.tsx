import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { clsx as cx } from "clsx";
import { isPlainHref, type PageLink } from "@/lib/links";

/** A row of links to related pages, at the end of a page. */
export function RelatedLinks({ title = "Keep exploring", links, className }: { title?: string; links: PageLink[]; className?: string }) {
  return (
    <section aria-labelledby="related-title" className={cx("border-t border-line pt-10", className)}>
      <h2 id="related-title" className="mono-label text-muted">
        {title}
      </h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => {
          const inner = (
            <>
              <span className="flex items-center justify-between gap-3 text-[15px] font-semibold text-fg">
                {l.title}
                <ArrowUpRight size={16} className="shrink-0 text-faint transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold-2" aria-hidden />
              </span>
              <span className="mt-1.5 block text-[13.5px] leading-relaxed text-muted">{l.description}</span>
            </>
          );
          const cls = "group card block h-full px-5 py-4 transition-colors hover:border-line-2";
          return (
            <li key={l.href}>
              {isPlainHref(l.href) ? (
                <a href={l.href} className={cls}>
                  {inner}
                </a>
              ) : (
                <Link href={l.href} className={cls}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
