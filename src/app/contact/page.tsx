import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { Container, Kicker } from "@/components/ui";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { CONTACT_TOPIC_IDS, HELP_EMAIL, type ContactTopic } from "@/lib/contact";
import { breadcrumbLd, pageMetadata } from "@/lib/seo";
import { SITE, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Contact us",
  description: "Ask about organisation accounts, partnerships, judging for hackathons and grant rounds, or get help with a task or payout. We reply within a working day.",
  path: "/contact",
});

const SHORTCUTS = [
  { href: "/business", title: "Post tasks as an organisation", body: "How organisation accounts and posting tasks work." },
  { href: "/rules", title: "Questions about a score", body: "The rubrics, the caps and how to ask for a human review." },
  { href: "/security", title: "Report a vulnerability", body: "Safe harbour and how to reach us privately." },
];

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  const initialTopic: ContactTopic = CONTACT_TOPIC_IDS.includes(topic as ContactTopic) ? (topic as ContactTopic) : "general";
  const crumbs = [{ name: "Home", path: "/" }, { name: "Contact" }];
  return (
    <Container className="flex flex-col gap-10">
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "ContactPage", url: absoluteUrl("/contact"), name: "Contact Wukong", about: { "@id": `${SITE.url}/#organization` } },
          breadcrumbLd(crumbs),
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col gap-8">
          <header>
            <Kicker>Contact</Kicker>
            <h1 className="display mt-4 text-[clamp(2.8rem,6vw,4.6rem)]">
              Talk to <em className="text-gold-2">a person.</em>
            </h1>
            <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-muted">
              Organisation accounts, partnerships, judging for your hackathon or grant round, or help with a task or payout. Wukong is built in {SITE.location}, and
              we read every message.
            </p>
          </header>
          <dl className="grid gap-4 text-[14.5px] sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <dt className="label">Email</dt>
              <dd className="mt-1.5">
                <a href={`mailto:${HELP_EMAIL}`} className="text-fg underline decoration-line-2 underline-offset-4 hover:decoration-gold">
                  {HELP_EMAIL}
                </a>
              </dd>
            </div>
            <div>
              <dt className="label">Reply time</dt>
              <dd className="mt-1.5 text-muted">Usually within one working day.</dd>
            </div>
          </dl>
          <ul className="flex flex-col gap-2.5">
            {SHORTCUTS.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="group card flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:border-line-2">
                  <span>
                    <span className="block text-[15px] font-semibold">{s.title}</span>
                    <span className="mt-1 block text-[13.5px] text-muted">{s.body}</span>
                  </span>
                  <ArrowUpRight size={16} className="mt-1 shrink-0 text-faint transition-colors group-hover:text-gold-2" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <ContactForm initialTopic={initialTopic} />
      </div>
    </Container>
  );
}
