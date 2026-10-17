"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { CONTACT_TOPICS, HELP_EMAIL, type ContactTopic } from "@/lib/contact";
import { track } from "@/lib/client/analytics";
import { toast } from "./Toast";
import { Spinner, cx } from "./ui";

type Field = "name" | "email" | "message";
const MAX = 4000;

export function ContactForm({ initialTopic }: { initialTopic: ContactTopic }) {
  const [topic, setTopic] = useState<ContactTopic>(initialTopic);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const opened = useRef(0);
  const refs = { name: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null), message: useRef<HTMLTextAreaElement>(null) };

  useEffect(() => {
    opened.current = Date.now();
  }, []);

  function validate(): Partial<Record<Field, string>> {
    const e: Partial<Record<Field, string>> = {};
    if (name.trim().length < 2) e.name = "Add your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Use an email address we can reply to.";
    if (message.trim().length < 20) e.message = "Tell us a little more: at least 20 characters.";
    return e;
  }

  async function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setFailure(null);
    const first = (["name", "email", "message"] as Field[]).find((f) => e[f]);
    if (first) return refs[first].current?.focus();
    setSending(true);
    try {
      const website = (new FormData(ev.currentTarget).get("website") as string) || undefined;
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, topic, message, website, openedMs: Date.now() - opened.current }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "We couldn't send your message. Try again in a moment.");
      setSentTo(email.trim());
      toast.success("Message sent", "We usually reply within a working day.");
      track("contact_sent", { topic });
      if (topic === "organisation") track("org_request", { method: "contact_form" });
    } catch (err) {
      const msg = (err as Error).message;
      setFailure(msg);
      toast.error("Message not sent", msg);
    } finally {
      setSending(false);
    }
  }

  if (sentTo) {
    return (
      <div className="card flex flex-col items-start gap-4 p-7" role="status">
        <CheckCircle2 size={28} className="text-green" aria-hidden />
        <h2 className="text-[22px] font-semibold tracking-tight">Thanks, your message is on its way.</h2>
        <p className="text-[15px] leading-relaxed text-muted">
          We&apos;ll reply to <span className="text-fg">{sentTo}</span>, usually within a working day.
          {topic === "organisation" && " Organisation accounts are approved by hand, so every task comes from a real company."}
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link href="/tasks" className="btn btn-red h-11 px-5">
            Browse open tasks
          </Link>
          <button
            type="button"
            className="btn btn-line h-11 px-5"
            onClick={() => {
              setSentTo(null);
              setMessage("");
              opened.current = Date.now();
            }}
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  const fieldCls = (f: Field) => cx("input", errors[f] && "!border-red/70");
  return (
    <form onSubmit={submit} noValidate className="card flex flex-col gap-5 p-6 sm:p-7" aria-describedby={failure ? "contact-failure" : undefined}>
      <fieldset className="flex flex-col gap-2.5">
        <legend className="label mb-2.5">What&apos;s it about?</legend>
        <div className="flex flex-wrap gap-2">
          {CONTACT_TOPICS.map((t) => (
            <label
              key={t.id}
              className={cx(
                "cursor-pointer rounded-full border px-3.5 py-1.5 text-[13.5px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold",
                topic === t.id ? "border-gold/60 bg-gold/[0.08] text-fg" : "border-line text-muted hover:border-line-2 hover:text-fg",
              )}
            >
              <input type="radio" name="topic" value={t.id} checked={topic === t.id} onChange={() => setTopic(t.id)} className="sr-only" />
              {t.label}
            </label>
          ))}
        </div>
        <p className="text-[12.5px] text-faint">
          Found a vulnerability? Please follow the{" "}
          <Link href="/security" className="underline decoration-line-2 underline-offset-4 hover:text-fg">
            security policy
          </Link>{" "}
          instead.
        </p>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="contact-name" className="label">
            Your name
          </label>
          <input
            ref={refs.name}
            id="contact-name"
            name="name"
            autoComplete="name"
            className={fieldCls("name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            maxLength={80}
          />
          {errors.name && (
            <p id="contact-name-error" className="text-[12.5px] text-red-2">
              {errors.name}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="contact-email" className="label">
            Email
          </label>
          <input
            ref={refs.email}
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className={fieldCls("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            maxLength={200}
          />
          {errors.email && (
            <p id="contact-email-error" className="text-[12.5px] text-red-2">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="contact-message" className="label">
            Message
          </label>
          <span className={cx("font-mono text-[11px] tabular-nums", message.length > MAX * 0.9 ? "text-red-2" : "text-faint")} aria-hidden>
            {message.length.toLocaleString("en-US")} / {MAX.toLocaleString("en-US")}
          </span>
        </div>
        <textarea
          ref={refs.message}
          id="contact-message"
          name="message"
          rows={7}
          className={cx(fieldCls("message"), "resize-y leading-relaxed")}
          placeholder={topic === "organisation" ? "Your organisation, its website, and the kind of tasks you plan to post." : "How can we help?"}
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
        />
        {errors.message && (
          <p id="contact-message-error" className="text-[12.5px] text-red-2">
            {errors.message}
          </p>
        )}
      </div>

      {/* Left empty by people; bots tend to fill it. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {failure && (
        <p id="contact-failure" role="alert" className="rounded-xl bg-red/10 px-4 py-3 text-[13.5px] text-red-2">
          {failure}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <p className="max-w-sm text-[12.5px] leading-relaxed text-faint">
          We use your details only to reply. See the{" "}
          <Link href="/privacy" className="underline decoration-line-2 underline-offset-4 hover:text-fg">
            Privacy Policy
          </Link>
          . Prefer email? Write to {HELP_EMAIL}.
        </p>
        <button type="submit" className="btn btn-red h-12 px-6" disabled={sending}>
          {sending ? <Spinner /> : <Send size={16} />}
          {sending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
