import { Resend } from "resend";
import { appUrl, resendConfig } from "./config";

let client: Resend | null = null;

function resend(): Resend | null {
  if (client) return client;
  const cfg = resendConfig();
  if (!cfg) return null;
  client = new Resend(cfg.apiKey);
  return client;
}

export function emailEnabled(): boolean {
  return !!resendConfig();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export interface EmailContent {
  /** Short line above the headline, e.g. "Results are in" */
  kicker: string;
  headline: string;
  /** Plain-text paragraphs; escaped before rendering */
  paragraphs: string[];
  /** A big number or phrase in the middle, e.g. "+22.50 USDC" */
  highlight?: { value: string; caption: string };
  cta: { label: string; path: string };
}

/** One layout for every email: navy header, the highlight in a card, one red button. */
function render(c: EmailContent): { html: string; text: string } {
  const url = `${appUrl()}${c.cta.path}`;
  const p = c.paragraphs.map((t) => `<p style="margin:0 0 14px;color:#3b4459;font-size:15px;line-height:1.6;">${escapeHtml(t)}</p>`).join("");
  const highlight = c.highlight
    ? `<div style="background:#F3F6FA;border-radius:14px;padding:22px;text-align:center;margin:8px 0 22px;">
        <div style="font-family:Impact,'Arial Narrow',sans-serif;font-size:40px;line-height:1;color:#0C1424;letter-spacing:0.5px;">${escapeHtml(c.highlight.value)}</div>
        <div style="margin-top:6px;color:#5B6680;font-size:13px;">${escapeHtml(c.highlight.caption)}</div>
      </div>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#F3F6FA;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:28px 16px;">
    <div style="background:#0C1424;border-radius:18px 18px 0 0;padding:22px 26px;">
      <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:#E4261C;margin-right:8px;"></span>
      <span style="font-family:Impact,'Arial Narrow',sans-serif;font-size:20px;letter-spacing:1px;color:#ffffff;">WUKONG</span>
    </div>
    <div style="background:#ffffff;border-radius:0 0 18px 18px;padding:26px;">
      <div style="font-family:Menlo,monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#E4261C;margin-bottom:10px;">${escapeHtml(c.kicker)}</div>
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#0C1424;">${escapeHtml(c.headline)}</h1>
      ${p}${highlight}
      <a href="${escapeHtml(url)}" style="display:inline-block;background:#E4261C;color:#ffffff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">${escapeHtml(c.cta.label)}</a>
    </div>
    <p style="color:#8A94AB;font-size:12px;line-height:1.5;margin:16px 6px 0;">You get this because you have a Wukong account. Turn result emails off in your dashboard. · wukonghq.xyz</p>
  </div></body></html>`;
  const text = [c.kicker.toUpperCase(), c.headline, "", ...c.paragraphs, c.highlight ? `\n${c.highlight.value} (${c.highlight.caption})` : "", "", `${c.cta.label}: ${url}`].join("\n");
  return { html, text };
}

export async function sendEmail(to: string, subject: string, content: EmailContent): Promise<boolean> {
  const r = resend();
  const cfg = resendConfig();
  if (!r || !cfg) return false;
  const { html, text } = render(content);
  const { error } = await r.emails.send({ from: cfg.from, to, subject: subject.slice(0, 140), html, text });
  if (error) console.error("resend:", error.name ?? "error");
  return !error;
}

export interface ContactMessage {
  name: string;
  email: string;
  topic: string;
  message: string;
}

/** A contact-form message, to the team's inbox, with Reply-To set to the sender. */
export async function sendContactMessage(m: ContactMessage, to: string): Promise<boolean> {
  const r = resend();
  const cfg = resendConfig();
  if (!r || !cfg) return false;
  const rows = [
    ["From", `${m.name} <${m.email}>`],
    ["About", m.topic],
  ];
  const html = `<!doctype html><html><body style="margin:0;background:#F3F6FA;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:28px 16px;">
    <div style="background:#ffffff;border-radius:18px;padding:26px;">
      <div style="font-family:Menlo,monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#E4261C;margin-bottom:14px;">Contact form · wukonghq.xyz</div>
      <table style="border-collapse:collapse;font-size:14px;color:#3b4459;margin-bottom:18px;">${rows
        .map(([k, v]) => `<tr><td style="padding:3px 14px 3px 0;color:#8A94AB;">${k}</td><td style="padding:3px 0;">${escapeHtml(v)}</td></tr>`)
        .join("")}</table>
      <div style="white-space:pre-wrap;font-size:15px;line-height:1.6;color:#0C1424;border-top:1px solid #E6EAF0;padding-top:16px;">${escapeHtml(m.message)}</div>
    </div>
    <p style="color:#8A94AB;font-size:12px;margin:14px 6px 0;">Reply to this email to answer ${escapeHtml(m.name)} directly.</p>
  </div></body></html>`;
  const text = `Contact form · wukonghq.xyz\n\nFrom: ${m.name} <${m.email}>\nAbout: ${m.topic}\n\n${m.message}\n`;
  const { error } = await r.emails.send({
    from: cfg.from,
    to,
    replyTo: `${m.name.replace(/[<>"]/g, "")} <${m.email}>`,
    subject: `[Contact] ${m.topic}: ${m.name}`.slice(0, 140),
    html,
    text,
  });
  if (error) console.error("resend:", error.name ?? "error");
  return !error;
}
