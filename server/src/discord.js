import { one } from "./db.js";

export async function getWebhookUrl() {
  const row = await one("SELECT value FROM app_settings WHERE key = 'discord_webhook_url'");
  return row?.value || null;
}

export async function postToDiscord(content, { mentionEveryone = false } = {}) {
  const url = await getWebhookUrl();
  if (!url) {
    const err = new Error("Discord-webhookia ei ole asetettu hallintapaneelissa.");
    err.statusCode = 400;
    throw err;
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content,
      allowed_mentions: { parse: mentionEveryone ? ["everyone"] : [] },
    }),
  });
  if (!res.ok) {
    const err = new Error(`Discord vastasi: HTTP ${res.status}`);
    err.statusCode = 502;
    throw err;
  }
}
