/**
 * Feature-flagged Resend wrapper for transactional lead email.
 *
 * When RESEND_API_KEY is unset, the lead is logged to console and a synthetic
 * id is returned — the contact route stays green in local dev. The HTML
 * template is warm and brand-consistent: Fraunces serif headline, Inter body,
 * minimal inline styles so it renders well across mail clients.
 */

import type { ContactLead } from "./schemas";

const RESEND_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "The Tile <leads@notifications.the-tile.com>";
const DEFAULT_INBOX = "hello@the-tile.com";

export interface SendLeadResult {
  ok: boolean;
  id?: string;
  error?: string;
}

interface ResendResponse {
  id?: string;
  message?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderHtml(lead: ContactLead): string {
  const rows: string[] = [];
  rows.push(
    `<p><strong>Email:</strong> <a href="mailto:${escapeHtml(lead.email)}" style="color:#8a5a2b;">${escapeHtml(lead.email)}</a></p>`,
  );
  if (lead.phone) {
    rows.push(`<p><strong>Phone:</strong> ${escapeHtml(lead.phone)}</p>`);
  }
  if (lead.preferredContactMethod) {
    rows.push(
      `<p><strong>Preferred contact:</strong> ${escapeHtml(lead.preferredContactMethod)}</p>`,
    );
  }

  const saveIds = lead.saveListIds ?? [];
  const savedBlock = saveIds.length
    ? `<p><strong>Saved tiles (${saveIds.length}):</strong></p>
       <ul style="margin:0 0 16px 20px; padding:0; color:#2b241c;">
         ${saveIds.map((id) => `<li style="margin-bottom:4px;">${escapeHtml(id)}</li>`).join("")}
       </ul>`
    : "";

  return `<!doctype html>
<html lang="en">
  <body style="margin:0; padding:0; background:#fbfaf7; font-family:'Inter', system-ui, sans-serif; color:#2b241c; line-height:1.55;">
    <div style="max-width:560px; margin:0 auto; padding:32px 24px;">
      <h1 style="font-family:'Fraunces', Georgia, serif; font-weight:300; font-size:28px; margin:0 0 4px; color:#14110e;">
        New enquiry
      </h1>
      <p style="margin:0 0 24px; color:#7a6f62; font-size:14px;">
        via the-tile.com · ${escapeHtml(new Date().toISOString())}
      </p>

      <h2 style="font-family:'Fraunces', Georgia, serif; font-weight:400; font-size:20px; margin:0 0 8px;">
        ${escapeHtml(lead.name)}
      </h2>
      ${rows.join("\n")}

      <h3 style="font-family:'Fraunces', Georgia, serif; font-weight:400; font-size:16px; margin:24px 0 8px;">
        Their message
      </h3>
      <p style="white-space:pre-wrap; margin:0 0 16px; background:#f5f1ea; padding:16px; border-radius:4px;">
        ${escapeHtml(lead.message)}
      </p>

      ${savedBlock}

      <hr style="border:none; border-top:1px solid #e8e1d3; margin:24px 0;" />
      <p style="font-size:12px; color:#7a6f62; margin:0;">
        Reply directly to this email to contact ${escapeHtml(lead.name)}.
      </p>
    </div>
  </body>
</html>`;
}

function renderText(lead: ContactLead): string {
  const lines: string[] = [];
  lines.push(`New enquiry from ${lead.name}`);
  lines.push("");
  lines.push(`Email: ${lead.email}`);
  if (lead.phone) lines.push(`Phone: ${lead.phone}`);
  if (lead.preferredContactMethod)
    lines.push(`Preferred contact: ${lead.preferredContactMethod}`);
  lines.push("");
  lines.push("Message:");
  lines.push(lead.message);
  const saveIds = lead.saveListIds ?? [];
  if (saveIds.length) {
    lines.push("");
    lines.push(`Saved tiles (${saveIds.length}):`);
    for (const id of saveIds) lines.push(`  - ${id}`);
  }
  lines.push("");
  lines.push("Reply to this email to contact them directly.");
  return lines.join("\n");
}

export async function sendLeadEmail(
  lead: ContactLead,
): Promise<SendLeadResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.log("[resend] RESEND_API_KEY unset — logging lead instead:", lead);
    return { ok: true, id: `console-${Date.now()}` };
  }

  const to = process.env.LEAD_INBOX ?? DEFAULT_INBOX;
  const payload = {
    from: DEFAULT_FROM,
    to: [to],
    reply_to: lead.email,
    subject: `New enquiry — ${lead.name}`,
    html: renderHtml(lead),
    text: renderText(lead),
  };

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as ResendResponse;
    if (!res.ok) {
      return {
        ok: false,
        error: data.message ?? `resend_http_${res.status}`,
      };
    }
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
