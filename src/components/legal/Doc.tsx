import Link from "next/link";
import type { ReactNode } from "react";
import { clsx as cx } from "clsx";
import { Kicker } from "@/components/ui";
import { RelatedLinks } from "@/components/RelatedLinks";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { LEGAL, LEGAL_PAGES } from "@/lib/legal";
import { pages, type PageKey } from "@/lib/links";
import { breadcrumbLd, type Crumb } from "@/lib/seo";

/** A legal or policy document: heading, date, a contents list built from its sections, then the sections. */
export function Doc({
  kicker,
  title,
  lede,
  current,
  sections,
  updated = LEGAL.updated,
}: {
  kicker: string;
  title: ReactNode;
  lede: ReactNode;
  current: string;
  sections: { id: string; title: string; body: ReactNode }[];
  /** When this page last changed, if later than the shared date. */
  updated?: string;
}) {
  const name = LEGAL_PAGES.find((p) => p.href === current)?.label ?? kicker;
  const crumbs: Crumb[] = [{ name: "Home", path: "/" }, { name }];
  const related = (["terms", "privacy", "rules", "security", "contact", "benchmarks"] as PageKey[]).filter((k) => `/${k}` !== current).slice(0, 3);
  return (
    <div className="flex flex-col gap-12">
      <JsonLd data={breadcrumbLd(crumbs)} />
      <Breadcrumbs items={crumbs} className="-mb-6" />
      <nav aria-label="Policies" className="flex flex-wrap gap-2">
        {LEGAL_PAGES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            aria-current={p.href === current ? "page" : undefined}
            className={cx(
              "rounded-full border px-3.5 py-1.5 text-[13px] transition-colors",
              p.href === current ? "border-gold/50 bg-gold/[0.06] text-fg" : "border-line text-muted hover:border-line-2 hover:text-fg",
            )}
          >
            {p.label}
          </Link>
        ))}
      </nav>
      <header className="max-w-3xl">
        <Kicker>{kicker}</Kicker>
        <h1 className="display mt-4 text-[clamp(2.6rem,6vw,4.4rem)]">{title}</h1>
        <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-muted">{lede}</p>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Last updated {updated}</p>
      </header>
      <div className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ol className="sticky top-28 flex flex-col gap-1.5 text-[13px]">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex gap-2 text-muted transition-colors hover:text-fg">
                  <span className="w-5 shrink-0 font-mono text-faint">{i + 1}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex min-w-0 max-w-3xl flex-col gap-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className="flex items-baseline gap-3 text-[21px] font-semibold tracking-tight">
                <span className="font-mono text-[13px] text-gold">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              <div className="prose-legal mt-4 flex flex-col gap-3.5 text-[15px] leading-[1.7] text-fg/80">{s.body}</div>
            </section>
          ))}
          <p className="border-t border-line pt-6 text-[14px] text-muted">
            Questions about this page? Email{" "}
            <a className="text-fg underline decoration-line-2 underline-offset-4 hover:decoration-gold" href={`mailto:${LEGAL.contact}`}>
              {LEGAL.contact}
            </a>{" "}
            or use the{" "}
            <Link className="text-fg underline decoration-line-2 underline-offset-4 hover:decoration-gold" href="/contact">
              contact form
            </Link>
            .
          </p>
        </div>
      </div>
      <RelatedLinks title="Related pages" links={pages(...related)} />
    </div>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-faint">{children}</ul>;
}

export function Mail() {
  return (
    <a className="text-fg underline decoration-line-2 underline-offset-4 hover:decoration-gold" href={`mailto:${LEGAL.contact}`}>
      {LEGAL.contact}
    </a>
  );
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-fg underline decoration-line-2 underline-offset-4 hover:decoration-gold">
      {children}
    </Link>
  );
}
