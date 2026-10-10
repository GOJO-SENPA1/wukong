import { Resend } from "resend";
import { resendConfig } from "./config";

let client: Resend | null = null;

function resend(): Resend | null {
  if (client) return client;
  const cfg = resendConfig();
  if (!cfg) return null;
  client = new Resend(cfg.apiKey);
  return client;
}

export async function sendWinEmail(to: string, taskTitle: string, amount: string): Promise<boolean> {
  const r = resend();
  const cfg = resendConfig();
  if (!r || !cfg) return false;

  const { error } = await r.emails.send({
    from: cfg.from,
    to,
    subject: `You won ${amount} USDC on Wukong`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <h2 style="margin: 0 0 8px;">You won!</h2>
        <p style="color: #666; margin: 0 0 24px;">Your submission for <strong>${escapeHtml(taskTitle)}</strong> was selected by the AI judge.</p>
        <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px; font-weight: 700;">${escapeHtml(amount)} USDC</span>
          <br/><span style="color: #888; font-size: 14px;">has been sent to your wallet</span>
        </div>
        <a href="https://wukonghq.xyz/tasks" style="display: inline-block; background: #E6A817; color: #000; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View on Wukong</a>
        <p style="color: #aaa; font-size: 12px; margin-top: 32px;">wukonghq.xyz</p>
      </div>
    `,
  });

  if (error) console.error("resend:", error);
  return !error;
}

export async function sendTaskCreatedEmail(to: string, taskTitle: string, bounty: string): Promise<boolean> {
  const r = resend();
  const cfg = resendConfig();
  if (!r || !cfg) return false;

  const { error } = await r.emails.send({
    from: cfg.from,
    to,
    subject: `Task posted: ${taskTitle}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <h2 style="margin: 0 0 8px;">Task live</h2>
        <p style="color: #666; margin: 0 0 24px;"><strong>${escapeHtml(taskTitle)}</strong> is now accepting submissions.</p>
        <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 24px; font-weight: 700;">${escapeHtml(bounty)} USDC bounty</span>
        </div>
        <a href="https://wukonghq.xyz/tasks" style="display: inline-block; background: #E6A817; color: #000; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View task</a>
        <p style="color: #aaa; font-size: 12px; margin-top: 32px;">wukonghq.xyz</p>
      </div>
    `,
  });

  if (error) console.error("resend:", error);
  return !error;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
