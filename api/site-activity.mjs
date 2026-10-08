// app/insights/activity.ts
import { createHash } from "node:crypto";
var kinds = /* @__PURE__ */ new Set(["page_view", "site_click", "control_change", "form_submit", "lead_whatsapp", "lead_email", "lead_phone", "lead_form", "cta_contact", "file_download"]);
var headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
var limits = /* @__PURE__ */ new Map();
function cleanText(value, max = 100) {
  return String(value || "").replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email]").replace(/\+?\d[\d ().-]{6,}\d/g, "[number]").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}
function cleanPath(value) {
  try {
    const url = new URL(String(value || ""), "https://hisanali.com");
    if (!["https:", "http:"].includes(url.protocol)) return "";
    return cleanText(decodeURIComponent(url.pathname), 240);
  } catch {
    return "";
  }
}
function sanitizeEvent(value) {
  if (!value || typeof value !== "object") return null;
  const v = value, pathname = cleanPath(v.page);
  if (!kinds.has(String(v.event)) || !/^\/[\s\S]*$/.test(pathname) || /^\/(admin|api)(\/|$)/i.test(pathname) || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v.id))) return null;
  return { id: v.id, event_name: v.event, page: pathname, label: cleanText(v.label), target: cleanText(v.target, 240).split(/[?#]/)[0], area: ["header", "footer", "form", "content"].includes(String(v.area)) ? v.area : "content", device: ["mobile", "tablet", "desktop"].includes(String(v.device)) ? v.device : "desktop" };
}
async function database(rpc, body) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Activity storage is not configured.");
  const response = await fetch(`${url}/rest/v1/rpc/${rpc}`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(8e3), cache: "no-store" });
  if (!response.ok) throw new Error("Activity storage is temporarily unavailable.");
  return response.json();
}
async function collectActivity(request) {
  const origin = request.headers.get("origin"), ownOrigin = new URL(request.url).origin;
  const allowed = origin === "https://hisanali.com" || origin === "https://www.hisanali.com" || process.env.NODE_ENV !== "production" && origin === ownOrigin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "");
  const response = (data, status) => Response.json(data, { status, headers });
  if (!allowed) return response({ error: "Invalid origin." }, 403);
  const now = Date.now(), key = createHash("sha256").update(request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown").digest("hex");
  for (const [id, limit2] of limits) if (limit2.expires <= now) limits.delete(id);
  const limit = limits.get(key) || { count: 0, expires: now + 6e4 };
  if (++limit.count > 120 || limits.size > 1e4) return response({ error: "Too many requests." }, 429);
  limits.set(key, limit);
  try {
    const reader = request.body?.getReader();
    if (!reader) return response({ error: "Missing body." }, 400);
    let size = 0, text = "";
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 12e3) {
        await reader.cancel();
        return response({ error: "Payload too large." }, 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const data = JSON.parse(text);
    if (!Array.isArray(data.events) || !data.events.length || data.events.length > 20) return response({ error: "Invalid events." }, 400);
    const events = data.events.map(sanitizeEvent).filter(Boolean);
    if (!events.length) return response({ error: "No valid events." }, 400);
    await database("portfolio_record_activity", { items: events });
    return response({ received: events.length }, 202);
  } catch (error) {
    return response({ error: error instanceof SyntaxError ? "Invalid JSON." : "Activity collection is temporarily unavailable." }, error instanceof SyntaxError ? 400 : 503);
  }
}
export {
  collectActivity as POST
};
