// app/insights/security.ts
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
var SESSION_COOKIE = "hisan_admin";
var STATE_COOKIE = "hisan_oauth";
var SESSION_SECONDS = 8 * 60 * 60;
function configuration() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const secret = process.env.ADMIN_SESSION_SECRET || "";
  const origin = process.env.ADMIN_ORIGIN || "http://localhost:4318";
  const email = (process.env.ADMIN_EMAIL || "hisanali73@gmail.com").trim().toLowerCase();
  const validOrigin = /^https:\/\/[^/?#]+$/.test(origin) || process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  return { clientId, clientSecret, secret, origin, email, ready: !!(clientId && clientSecret && secret.length >= 32 && validOrigin), property: process.env.GA4_PROPERTY_ID || "515896463", site: "https://hisanali.com/" };
}
function seal(value, purpose, secret = configuration().secret) {
  if (secret.length < 32) throw new Error("Session secret is not configured.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), iv);
  cipher.setAAD(Buffer.from(purpose));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}
function unseal(value, purpose, secret = configuration().secret) {
  try {
    if (!value || value.length > 6e3 || secret.length < 32) return null;
    const data = Buffer.from(value, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), data.subarray(0, 12));
    decipher.setAAD(Buffer.from(purpose));
    decipher.setAuthTag(data.subarray(12, 28));
    const result = JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8"));
    return Number.isFinite(result.expires) && result.expires > Date.now() ? result : null;
  } catch {
    return null;
  }
}
function cookieValue(request, name) {
  return request.headers.get("cookie")?.split(";").map((value) => value.trim()).find((value) => value.startsWith(name + "="))?.slice(name.length + 1);
}
function getSession(request) {
  const session = unseal(cookieValue(request, SESSION_COOKIE), SESSION_COOKIE);
  return configuration().ready && session?.email === configuration().email && typeof session.accessToken === "string" ? session : null;
}
function cookie(name, value, maxAge) {
  return `${name}=${value}; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${configuration().origin.startsWith("https:") ? "; Secure" : ""}`;
}
function equal(a, b) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
function localPreview(request) {
  return process.env.NODE_ENV === "development" && ["localhost", "127.0.0.1", "[::1]"].includes(new URL(request.url).hostname);
}
function responseHeaders(contentType = "application/json; charset=utf-8") {
  return {
    "Content-Type": contentType,
    "Cache-Control": "private, no-store, max-age=0",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
  };
}

// app/insights/google.ts
import { createHash as createHash2, randomBytes as randomBytes2 } from "node:crypto";
var scopes = ["openid", "email", "https://www.googleapis.com/auth/analytics.readonly", "https://www.googleapis.com/auth/webmasters.readonly"];
function authorization() {
  const config = configuration();
  const state = randomBytes2(32).toString("base64url");
  const verifier = randomBytes2(48).toString("base64url");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.origin + "/admin/callback/", response_type: "code", scope: scopes.join(" "), state, code_challenge: createHash2("sha256").update(verifier).digest("base64url"), code_challenge_method: "S256", access_type: "offline", prompt: "consent", login_hint: config.email }).toString();
  return { url: url.toString(), state, verifier, expires: Date.now() + 10 * 60 * 1e3 };
}
async function tokenRequest(fields) {
  const config = configuration();
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", cache: "no-store", signal: AbortSignal.timeout(15e3), headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, ...fields }) });
  if (!response.ok) throw new Error("Google sign-in expired or could not be completed. Please reconnect.");
  const value = await response.json();
  if (typeof value.access_token !== "string") throw new Error("Google did not return an access token.");
  return value;
}
async function exchange(code, verifier) {
  const token = await tokenRequest({ code, code_verifier: verifier, grant_type: "authorization_code", redirect_uri: configuration().origin + "/admin/callback/" });
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` }, cache: "no-store", signal: AbortSignal.timeout(15e3) });
  if (!response.ok) throw new Error("Unable to verify the Google account.");
  const user = await response.json();
  if (user.email_verified !== true || user.email?.toLowerCase() !== configuration().email) throw new Error("This Google account is not authorized for the admin dashboard.");
  return { email: configuration().email, accessToken: token.access_token, refreshToken: token.refresh_token, tokenExpires: Date.now() + Number(token.expires_in || 3600) * 1e3, expires: Date.now() + 8 * 60 * 60 * 1e3 };
}
async function freshSession(session) {
  if (session.tokenExpires > Date.now() + 6e4) return session;
  if (!session.refreshToken) throw new Error("Your Google session has expired. Please reconnect.");
  const token = await tokenRequest({ refresh_token: session.refreshToken, grant_type: "refresh_token" });
  return { ...session, accessToken: token.access_token, tokenExpires: Date.now() + Number(token.expires_in || 3600) * 1e3 };
}
async function googlePost(url, body, accessToken, deadline) {
  const signal = deadline ? AbortSignal.any([deadline, AbortSignal.timeout(15e3)]) : AbortSignal.timeout(15e3);
  const response = await fetch(url, { method: "POST", cache: "no-store", signal, headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) {
    if (response.status === 403) throw new Error("Access unavailable. Check the enabled API and your property permissions.");
    if (response.status === 401) throw new Error("Google authorization expired. Reconnect your account.");
    if (response.status === 429) throw new Error("Google quota reached. Please try again later.");
    if (response.status === 400) throw new Error("This report is unavailable for the property. Check its dimensions and configuration.");
    throw new Error("Google could not load this report. Please try again later.");
  }
  return response.json();
}

// app/insights/reports.ts
var contacts = ["lead_whatsapp", "lead_email", "lead_phone", "lead_form"];
var trackedEvents = [...contacts, "cta_contact", "file_download"];
var countryCodes = { OM: "omn", AE: "are", SA: "sau", QA: "qat", KW: "kwt", BH: "bhr", IN: "ind" };
function filtersFrom(url) {
  const days = Number(url.searchParams.get("days") || 28), country = url.searchParams.get("country") || "", device = url.searchParams.get("device") || "";
  if (![7, 28, 90].includes(days) || country && !Object.prototype.hasOwnProperty.call(countryCodes, country) || !["", "desktop", "mobile", "tablet"].includes(device)) throw new Error("Invalid report filters.");
  return { days, country, device };
}
function periods(days, delay, now = /* @__PURE__ */ new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Muscat", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const end = /* @__PURE__ */ new Date(today + "T00:00:00Z");
  end.setUTCDate(end.getUTCDate() - delay);
  const shift = (value, amount) => {
    const result = new Date(value);
    result.setUTCDate(result.getUTCDate() + amount);
    return result.toISOString().slice(0, 10);
  };
  return { startDate: shift(end, 1 - days), endDate: shift(end, 0), previousStart: shift(end, 1 - 2 * days), previousEnd: shift(end, -days) };
}
var summaryMetrics = ["activeUsers", "newUsers", "sessions", "engagedSessions", "screenPageViews", "engagementRate", "userEngagementDuration"];
var trafficMetrics = ["sessions", "activeUsers", "engagementRate"];
var definitions = [
  { id: "summary", dimensions: [], metrics: summaryMetrics },
  { id: "previous", dimensions: [], metrics: summaryMetrics, previous: true },
  { id: "daily", dimensions: ["date"], metrics: ["sessions", "activeUsers", "screenPageViews"] },
  { id: "dailyPrevious", dimensions: ["date"], metrics: ["sessions"], previous: true },
  { id: "channels", dimensions: ["sessionDefaultChannelGroup"], metrics: trafficMetrics },
  { id: "sources", dimensions: ["sessionSourceMedium"], metrics: trafficMetrics },
  { id: "countries", dimensions: ["country"], metrics: trafficMetrics },
  { id: "cities", dimensions: ["city", "country"], metrics: trafficMetrics },
  { id: "devices", dimensions: ["deviceCategory"], metrics: trafficMetrics },
  { id: "browsers", dimensions: ["browser"], metrics: trafficMetrics },
  { id: "campaigns", dimensions: ["sessionCampaignName"], metrics: trafficMetrics },
  { id: "pages", dimensions: ["pagePath"], metrics: ["screenPageViews", "activeUsers", "userEngagementDuration"], limit: 250 },
  { id: "landing", dimensions: ["landingPage"], metrics: ["sessions", "engagementRate", "bounceRate"], limit: 250 },
  { id: "events", dimensions: ["eventName"], metrics: ["eventCount", "totalUsers"], eventFilter: trackedEvents },
  { id: "eventsPrevious", dimensions: ["eventName"], metrics: ["eventCount"], eventFilter: trackedEvents, previous: true },
  { id: "leadDaily", dimensions: ["date"], metrics: ["eventCount"], eventFilter: contacts },
  { id: "leadPages", dimensions: ["pagePath", "eventName"], metrics: ["eventCount"], eventFilter: contacts, limit: 250 },
  { id: "leadSources", dimensions: ["sessionSourceMedium", "eventName"], metrics: ["eventCount"], eventFilter: contacts }
];
function gaRequest(definition, filters, period) {
  const expressions = [];
  if (filters.country) expressions.push({ filter: { fieldName: "countryId", stringFilter: { value: filters.country, matchType: "EXACT" } } });
  if (filters.device) expressions.push({ filter: { fieldName: "deviceCategory", stringFilter: { value: filters.device, matchType: "EXACT" } } });
  if (definition.eventFilter) expressions.push({ filter: { fieldName: "eventName", inListFilter: { values: definition.eventFilter } } });
  return {
    dateRanges: [{ startDate: definition.previous ? period.previousStart : period.startDate, endDate: definition.previous ? period.previousEnd : period.endDate }],
    dimensions: definition.dimensions.map((name) => ({ name })),
    metrics: definition.metrics.map((name) => ({ name })),
    ...expressions.length ? { dimensionFilter: { andGroup: { expressions } } } : {},
    orderBys: definition.dimensions.includes("date") ? [{ dimension: { dimensionName: "date" } }] : [{ metric: { metricName: definition.metrics[0] }, desc: true }],
    limit: definition.limit || 100,
    returnPropertyQuota: true
  };
}
function gaRows(result) {
  const dimensions = result.dimensionHeaders || [], metrics = result.metricHeaders || [];
  const rows = (result.rows || []).map((row) => Object.fromEntries([
    ...dimensions.map((header, index) => [header.name, row.dimensionValues[index].value]),
    ...metrics.map((header, index) => [header.name, Number(row.metricValues[index].value)])
  ]));
  return { rows, status: "ok", totalRows: result.rowCount || rows.length, limited: result.rowCount > rows.length, thresholded: result.metadata?.subjectToThresholding || !!result.metadata?.samplingMetadatas?.length || result.metadata?.dataLossFromOtherRow };
}
var realtimeDefinitions = [
  { id: "realtime", dimensions: [], metrics: ["activeUsers", "screenPageViews", "eventCount"] },
  { id: "liveMinutes", dimensions: ["minutesAgo"], metrics: ["activeUsers", "eventCount"] },
  { id: "livePages", dimensions: ["unifiedScreenName"], metrics: ["screenPageViews", "activeUsers"] },
  { id: "liveEvents", dimensions: ["eventName"], metrics: ["eventCount", "activeUsers"] },
  { id: "liveCountries", dimensions: ["country"], metrics: ["activeUsers"] },
  { id: "liveCities", dimensions: ["city", "country"], metrics: ["activeUsers"] },
  { id: "liveDevices", dimensions: ["deviceCategory"], metrics: ["activeUsers"] }
];
async function loadRealtime(accessToken) {
  const deadline = AbortSignal.timeout(18e3);
  const entries = await limited(realtimeDefinitions.map((definition) => async () => [definition.id, await safe(async () => gaRows(await googlePost(
    `https://analyticsdata.googleapis.com/v1beta/properties/${configuration().property}:runRealtimeReport`,
    { dimensions: definition.dimensions.map((name) => ({ name })), metrics: definition.metrics.map((name) => ({ name })), minuteRanges: [{ startMinutesAgo: 29, endMinutesAgo: 0 }], limit: 100, returnPropertyQuota: true },
    accessToken,
    deadline
  )))]));
  return { mode: "live", generatedAt: (/* @__PURE__ */ new Date()).toISOString(), datasets: Object.fromEntries(entries) };
}
function searchRequest(dimensions, filters, period, previous = false) {
  const rules = [];
  if (filters.country) rules.push({ dimension: "country", operator: "equals", expression: countryCodes[filters.country] });
  if (filters.device) rules.push({ dimension: "device", operator: "equals", expression: filters.device.toUpperCase() });
  return { startDate: previous ? period.previousStart : period.startDate, endDate: previous ? period.previousEnd : period.endDate, dimensions, type: "web", dataState: "final", rowLimit: 250, ...rules.length ? { dimensionFilterGroups: [{ filters: rules }] } : {} };
}
async function safe(run) {
  try {
    return await run();
  } catch (error) {
    return { rows: [], status: "error", error: error instanceof Error ? error.message : "Report unavailable." };
  }
}
async function limited(jobs, concurrency = 3) {
  let cursor = 0;
  const results = [];
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
    while (cursor < jobs.length) {
      const index = cursor++;
      results[index] = await jobs[index]();
    }
  }));
  return results;
}
async function loadReports(accessToken, filters) {
  const config = configuration(), gaPeriod = periods(filters.days, 1), searchPeriod = periods(filters.days, 3);
  const deadline = AbortSignal.timeout(42e3);
  const entries = await limited(definitions.map((definition) => async () => [definition.id, await safe(async () => gaRows(await googlePost(`https://analyticsdata.googleapis.com/v1beta/properties/${config.property}:runReport`, gaRequest(definition, filters, gaPeriod), accessToken, deadline)))]));
  const searchDefinitions = [["searchSummary", []], ["searchPrevious", [], true], ["searchDaily", ["date"]], ["queries", ["query"]], ["searchPages", ["page"]], ["searchCountries", ["country"]], ["searchDevices", ["device"]]];
  const searchEntries = await limited(searchDefinitions.map(([id, dimensions, previous]) => async () => [id, await safe(async () => {
    const result = await googlePost(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(config.site)}/searchAnalytics/query`, searchRequest(dimensions, filters, searchPeriod, previous), accessToken, deadline);
    return { status: "ok", rows: (result.rows || []).map((row) => ({ ...Object.fromEntries(dimensions.map((key, index) => [key, row.keys[index]])), clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position })), limited: result.rows?.length === 250 };
  })]));
  return { mode: "live", generatedAt: (/* @__PURE__ */ new Date()).toISOString(), filters, periods: { ga: gaPeriod, search: searchPeriod }, datasets: Object.fromEntries([...entries, ...searchEntries]) };
}

// app/insights/demo.ts
function demoReports(filters) {
  const ga = periods(filters.days, 1), search = periods(filters.days, 3);
  const scale = (filters.country ? 0.57 : 1) * (filters.device ? 0.64 : 1);
  const daily = Array.from({ length: filters.days }, (_, i) => {
    const date = /* @__PURE__ */ new Date(ga.startDate + "T00:00:00Z");
    date.setUTCDate(date.getUTCDate() + i);
    const sessions2 = Math.round((94 + i * 0.9 + 32 * Math.sin(i * 0.8) + (i % 7 === 4 ? 41 : 0)) * scale);
    return { date: date.toISOString().slice(0, 10).replaceAll("-", ""), sessions: sessions2, activeUsers: Math.round(sessions2 * 0.82), screenPageViews: Math.round(sessions2 * 1.83) };
  });
  const sessions = daily.reduce((total, row) => total + row.sessions, 0), views = daily.reduce((total, row) => total + row.screenPageViews, 0);
  const split = (total, shares2) => {
    let used = 0;
    return shares2.map((share, i) => {
      const value = i === shares2.length - 1 ? total - used : Math.round(total * share);
      used += value;
      return value;
    });
  };
  const datasets = {};
  const add = (id, rows) => {
    datasets[id] = { rows, status: "ok" };
  };
  const summary = { activeUsers: Math.round(sessions * 0.76), newUsers: Math.round(sessions * 0.61), sessions, engagedSessions: Math.round(sessions * 0.682), screenPageViews: views, engagementRate: 0.682, userEngagementDuration: sessions * 74 };
  add("summary", [summary]);
  add("previous", [{ ...summary, activeUsers: Math.round(summary.activeUsers / 1.16), sessions: Math.round(sessions / 1.19), screenPageViews: Math.round(views / 1.14), engagementRate: 0.632 }]);
  add("daily", daily);
  add("dailyPrevious", daily.map((row, i) => {
    const date = /* @__PURE__ */ new Date(ga.previousStart + "T00:00:00Z");
    date.setUTCDate(date.getUTCDate() + i);
    return { date: date.toISOString().slice(0, 10).replaceAll("-", ""), sessions: Math.round(Number(row.sessions) / 1.19) };
  }));
  const breakdown = (id, field, labels, shares2) => add(id, split(sessions, shares2).map((count, i) => ({ [field]: labels[i], sessions: count, activeUsers: Math.round(count * 0.83), engagementRate: 0.54 + i * 0.035 })));
  breakdown("channels", "sessionDefaultChannelGroup", ["Organic Search", "Direct", "Organic Social", "Referral", "Paid Search"], [0.48, 0.24, 0.14, 0.09, 0.05]);
  breakdown("sources", "sessionSourceMedium", ["google / organic", "(direct) / (none)", "instagram / social", "linkedin.com / referral", "google / cpc"], [0.48, 0.24, 0.14, 0.09, 0.05]);
  breakdown("countries", "country", filters.country ? [filters.country] : ["Oman", "United Arab Emirates", "Saudi Arabia", "India", "Other"], filters.country ? [1] : [0.57, 0.15, 0.12, 0.1, 0.06]);
  breakdown("cities", "city", ["Muscat", "Seeb", "Dubai", "Riyadh", "Other"], [0.42, 0.15, 0.15, 0.12, 0.16]);
  breakdown("devices", "deviceCategory", filters.device ? [filters.device] : ["mobile", "desktop", "tablet"], filters.device ? [1] : [0.64, 0.32, 0.04]);
  breakdown("browsers", "browser", ["Chrome", "Safari", "Edge", "Firefox"], [0.58, 0.29, 0.08, 0.05]);
  breakdown("campaigns", "sessionCampaignName", ["(organic)", "(direct)", "portfolio-launch", "oman-seo-guide"], [0.48, 0.24, 0.18, 0.1]);
  const paths = ["/", "/seo-expert-oman/", "/gcc/", "/blog/hire-digital-marketer-oman/", "/contact/", "/resources/oman-marketing-calendar-2027/"];
  const shares = [0.29, 0.23, 0.18, 0.14, 0.1, 0.06];
  add("pages", split(views, shares).map((count, i) => ({ pagePath: paths[i], screenPageViews: count, activeUsers: Math.round(count / 1.4), userEngagementDuration: count * (39 + i * 7) })));
  add("landing", split(sessions, shares).map((count, i) => ({ landingPage: paths[i], sessions: count, engagementRate: 0.61 + i * 0.025, bounceRate: 0.39 - i * 0.025 })));
  const counts = [Math.round(sessions * 0.021), Math.round(sessions * 7e-3), Math.round(sessions * 4e-3), Math.round(sessions * 3e-3), Math.round(sessions * 0.024), Math.round(sessions * 0.016)];
  add("events", trackedEvents.map((eventName, i) => ({ eventName, eventCount: counts[i], totalUsers: Math.round(counts[i] * 0.84) })));
  add("eventsPrevious", trackedEvents.map((eventName, i) => ({ eventName, eventCount: Math.round(counts[i] * 0.78) })));
  const leadCount = counts.slice(0, 4).reduce((a, b) => a + b, 0);
  add("leadDaily", split(leadCount, daily.map((row) => row.sessions / sessions)).map((eventCount, i) => ({ date: daily[i].date, eventCount })));
  add("leadPages", contacts.flatMap((eventName, i) => split(counts[i], shares).map((eventCount, j) => ({ pagePath: paths[j], eventName, eventCount }))));
  add("leadSources", contacts.flatMap((eventName, i) => split(counts[i], [0.52, 0.28, 0.2]).map((eventCount, j) => ({ sessionSourceMedium: ["google / organic", "(direct) / (none)", "instagram / social"][j], eventName, eventCount }))));
  const clicks = Math.round(sessions * 0.52), impressions = Math.round(clicks / 0.047);
  add("searchSummary", [{ clicks, impressions, ctr: clicks / impressions, position: 12.4 }]);
  add("searchPrevious", [{ clicks: Math.round(clicks / 1.24), impressions: Math.round(impressions / 1.17), ctr: 0.044, position: 15.1 }]);
  add("searchDaily", split(clicks, daily.map((row) => row.sessions / sessions)).map((count, i) => {
    const date = /* @__PURE__ */ new Date(search.startDate + "T00:00:00Z");
    date.setUTCDate(date.getUTCDate() + i);
    return { date: date.toISOString().slice(0, 10), clicks: count, impressions: Math.round(count / 0.047) };
  }));
  const searchRows = (field, labels) => labels.map((label, i) => {
    const count = Math.round(clicks * (0.23 - i * 0.032));
    return { [field]: label, clicks: count, impressions: count * (13 + i * 8), ctr: 1 / (13 + i * 8), position: 4.2 + i * 4.7 };
  });
  add("queries", searchRows("query", ["digital marketing consultant oman", "seo expert oman", "hisan ali", "digital marketer muscat", "gcc digital marketing"]));
  add("searchPages", searchRows("page", paths.map((path) => "https://hisanali.com" + path)));
  add("searchCountries", searchRows("country", filters.country ? [filters.country] : ["omn", "are", "sau", "ind"]));
  add("searchDevices", searchRows("device", filters.device ? [filters.device] : ["MOBILE", "DESKTOP", "TABLET"]));
  add("realtime", [{ activeUsers: 7 }]);
  return { mode: "demo", generatedAt: (/* @__PURE__ */ new Date()).toISOString(), filters, periods: { ga, search }, datasets };
}
function demoRealtime() {
  const datasets = {};
  const add = (id, rows) => {
    datasets[id] = { status: "ok", rows };
  };
  add("realtime", [{ activeUsers: 7, screenPageViews: 23, eventCount: 64 }]);
  add("liveMinutes", [{ minutesAgo: "02", activeUsers: 2, eventCount: 10 }, { minutesAgo: "06", activeUsers: 3, eventCount: 17 }, { minutesAgo: "12", activeUsers: 2, eventCount: 15 }, { minutesAgo: "18", activeUsers: 2, eventCount: 12 }, { minutesAgo: "26", activeUsers: 1, eventCount: 10 }]);
  add("livePages", [{ unifiedScreenName: "Hisan Ali \u2014 Digital Marketing Consultant", screenPageViews: 12, activeUsers: 5 }, { unifiedScreenName: "SEO Expert Oman", screenPageViews: 8, activeUsers: 3 }, { unifiedScreenName: "GCC Digital Marketing", screenPageViews: 3, activeUsers: 2 }]);
  add("liveEvents", [{ eventName: "page_view", eventCount: 23, activeUsers: 7 }, { eventName: "user_engagement", eventCount: 20, activeUsers: 6 }, { eventName: "scroll", eventCount: 14, activeUsers: 5 }, { eventName: "lead_whatsapp", eventCount: 5, activeUsers: 3 }, { eventName: "lead_email", eventCount: 2, activeUsers: 1 }]);
  add("liveCountries", [{ country: "Oman", activeUsers: 5 }, { country: "United Arab Emirates", activeUsers: 2 }]);
  add("liveCities", [{ city: "Muscat", country: "Oman", activeUsers: 4 }, { city: "Seeb", country: "Oman", activeUsers: 1 }, { city: "Dubai", country: "United Arab Emirates", activeUsers: 2 }]);
  add("liveDevices", [{ deviceCategory: "mobile", activeUsers: 5 }, { deviceCategory: "desktop", activeUsers: 2 }]);
  return { mode: "demo", generatedAt: (/* @__PURE__ */ new Date()).toISOString(), datasets };
}

// app/insights/shell.ts
function escape(value) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}
function shell(options) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Portfolio analytics \xB7 Hisan Ali</title><link rel="icon" href="/favicon.png"><link rel="stylesheet" href="/insights/dashboard.css"></head>
  <body data-mode="${options.mode}"><a class="skip" href="#main">Skip to content</a>${options.mode === "login" ? `<main class="login" id="main"><div class="login-brand">HA<span>HISAN ALI <small>PORTFOLIO ADMIN</small></span></div><div class="login-card"><span class="eyebrow">YOUR WEBSITE, IN FOCUS</span><h1>A clearer picture<br>of your growth.</h1><p>Traffic, enquiries, and search performance.<br>One private space for your portfolio.</p>${options.error ? `<p class="error" role="alert">${escape(options.error)}</p>` : ""}${options.ready ? `<a class="primary" href="/admin/login/">Continue with Google <span>\u2197</span></a><p class="login-note">Access is restricted to your administrator account.</p>` : `<div class="connection-note"><b>Google connection needed</b><p>The dashboard is built. Configure the Google OAuth client and session secret to enable private sign-in.</p></div>`}${options.preview ? `<a class="secondary" href="/admin/?demo=1">Explore the local preview <span>\u2192</span></a><p class="login-note">Preview uses clearly labelled sample data.</p>` : ""}</div><a class="back-site" href="/">\u2190 Back to hisanali.com</a></main>` : `<aside class="sidebar"><a class="brand" href="/admin/${options.mode === "demo" ? "?demo=1" : ""}"><span class="brand-mark">h.</span><span>Hisan Ali<small>PORTFOLIO ANALYTICS</small></span></a><div class="workspace"><span class="site-dot"></span><span>hisanali.com<small>Personal workspace</small></span><span class="lock">\u2311</span></div><p class="nav-label">WORKSPACE</p><nav aria-label="Analytics views" id="nav"></nav><div class="sidebar-bottom"><a class="site-link" href="https://hisanali.com/" target="_blank" rel="noopener noreferrer">View website <span>\u2197</span></a><div class="identity"><span>HA</span><div>Hisan Ali<small>Administrator</small></div>${options.mode === "live" ? `<form action="/admin/logout/" method="post"><button aria-label="Sign out" title="Sign out">\u21AA</button></form>` : ""}</div></div></aside><div class="main-wrap"><header class="topbar"><span>Workspace <span class="slash">/</span> <b id="breadcrumb">Overview</b></span><div class="topbar-right"><span class="status-dot"></span>${options.mode === "demo" ? "LOCAL PREVIEW" : "PRIVATE DASHBOARD"}<a href="/admin/" class="avatar" aria-label="Admin home">HA</a></div></header>${options.mode === "demo" ? `<div class="demo-banner"><span><b>Preview mode</b> \xB7 Sample data to explore the dashboard. These are not your website\u2019s results.</span><a href="/admin/">Connect Google \u2192</a></div>` : ""}<main id="main"><div class="page-head"><div><p class="eyebrow">PORTFOLIO INTELLIGENCE</p><h1 id="view-title">Overview</h1><p id="view-description">Understand what brings people in, and what turns visits into enquiries.</p></div><div class="page-actions"><button id="refresh" class="secondary">\u21BB Refresh</button><button id="export" class="primary">\u2193 Export CSV</button></div></div><section class="filters" aria-label="Report filters"><div class="filter-controls"><label>Period<select id="period"><option value="7">Last 7 days</option><option value="28" selected>Last 28 days</option><option value="90">Last 90 days</option></select></label><label>Country<select id="country"><option value="">All countries</option><option value="OM">Oman</option><option value="AE">United Arab Emirates</option><option value="SA">Saudi Arabia</option><option value="QA">Qatar</option><option value="KW">Kuwait</option><option value="BH">Bahrain</option><option value="IN">India</option></select></label><label>Device<select id="device"><option value="">All devices</option><option value="mobile">Mobile</option><option value="desktop">Desktop</option><option value="tablet">Tablet</option></select></label></div><label class="compare-control"><input type="checkbox" id="compare" checked> Compare previous period</label></section><div id="content" aria-live="polite" aria-busy="true"><div class="loading">Loading your reports\u2026</div></div><footer class="footer"><span id="freshness">Google Analytics 4 + Search Console</span><button class="text-button" data-view="sources">Sources & metric definitions \u2197</button></footer></main></div><script src="/insights/dashboard.js" defer></script>`}</body></html>`;
}

// app/admin/[[...path]]/route.ts
var cache = /* @__PURE__ */ new Map();
var pending = /* @__PURE__ */ new Map();
var liveCache;
var livePending = /* @__PURE__ */ new Map();
function json(data, status = 200) {
  return Response.json(data, { status, headers: responseHeaders() });
}
function redirect(path, cookies = []) {
  const headers = new Headers({ ...responseHeaders(), Location: path });
  cookies.forEach((value) => headers.append("Set-Cookie", value));
  return new Response(null, { status: 303, headers });
}
async function GET(request, { params }) {
  const route = (params.path || []).join("/"), url = new URL(request.url), config = configuration();
  const session = getSession(request), preview = localPreview(request), demo = preview && url.searchParams.get("demo") === "1";
  if (!route) return new Response(shell({ mode: demo ? "demo" : session ? "live" : "login", ready: config.ready, preview, error: url.searchParams.get("error")?.slice(0, 200) }), { headers: responseHeaders("text/html; charset=utf-8") });
  if (route === "login") {
    if (!config.ready) return redirect("/admin/?error=Google+sign-in+is+not+configured+yet.");
    const auth = authorization();
    return redirect(auth.url, [cookie(STATE_COOKIE, seal({ state: auth.state, verifier: auth.verifier, expires: auth.expires }, STATE_COOKIE), 600)]);
  }
  if (route === "callback") {
    const state = unseal(cookieValue(request, STATE_COOKIE), STATE_COOKIE);
    const clear = cookie(STATE_COOKIE, "", 0);
    if (!state || !equal(state.state, url.searchParams.get("state") || "") || !url.searchParams.get("code")) return redirect("/admin/?error=Sign-in+was+cancelled+or+expired.+Please+try+again.", [clear]);
    try {
      const authenticated = await exchange(url.searchParams.get("code"), state.verifier);
      return redirect("/admin/", [clear, cookie(SESSION_COOKIE, seal(authenticated, SESSION_COOKIE), SESSION_SECONDS)]);
    } catch (error) {
      return redirect("/admin/?error=" + encodeURIComponent(error instanceof Error ? error.message : "Unable to sign in."), [clear]);
    }
  }
  if (route !== "data" && route !== "realtime") return json({ error: "Not found." }, 404);
  if (!session && !demo) return json({ error: "Sign in to view analytics." }, 401);
  if (route === "realtime") {
    if (demo) return json(demoRealtime());
    try {
      const refreshed = await freshSession(session);
      const key = JSON.stringify([refreshed.email, config.property]);
      if (!liveCache || liveCache.key !== key || liveCache.expires < Date.now()) {
        let work = livePending.get(key);
        if (!work) {
          work = loadRealtime(refreshed.accessToken);
          livePending.set(key, work);
        }
        try {
          liveCache = { key, value: await work, expires: Date.now() + 25e3 };
        } finally {
          livePending.delete(key);
        }
      }
      const response = json(liveCache.value);
      if (refreshed !== session) response.headers.append("Set-Cookie", cookie(SESSION_COOKIE, seal(refreshed, SESSION_COOKIE), Math.max(0, Math.floor((refreshed.expires - Date.now()) / 1e3))));
      return response;
    } catch {
      return json({ error: "Your Google session could not be refreshed. Please sign in again." }, 401);
    }
  }
  let filters;
  try {
    filters = filtersFrom(url);
  } catch {
    return json({ error: "Invalid report filters." }, 400);
  }
  if (demo) return json(demoReports(filters));
  try {
    const refreshed = await freshSession(session);
    const key = JSON.stringify([refreshed.email, config.property, filters]);
    let report = cache.get(key);
    if (!report || report.expires < Date.now()) {
      let work = pending.get(key);
      if (!work) {
        work = loadReports(refreshed.accessToken, filters);
        pending.set(key, work);
      }
      let value;
      try {
        value = await work;
      } finally {
        pending.delete(key);
      }
      report = { value, expires: Date.now() + 5 * 60 * 1e3 };
      if (cache.size >= 12) cache.delete(cache.keys().next().value);
      cache.set(key, report);
    }
    const response = json(report.value);
    if (refreshed !== session) response.headers.append("Set-Cookie", cookie(SESSION_COOKIE, seal(refreshed, SESSION_COOKIE), Math.max(0, Math.floor((refreshed.expires - Date.now()) / 1e3))));
    return response;
  } catch {
    return json({ error: "Your Google session could not be refreshed. Please sign in again." }, 401);
  }
}
async function POST(request, { params }) {
  if ((params.path || []).join("/") !== "logout") return json({ error: "Not found." }, 404);
  if (request.headers.get("origin") !== configuration().origin) return json({ error: "Invalid request origin." }, 403);
  cache.clear();
  liveCache = void 0;
  return redirect("/admin/", [cookie(SESSION_COOKIE, "", 0), cookie(STATE_COOKIE, "", 0)]);
}

// scripts/portfolio-admin-entry.ts
function context(request) {
  const url = new URL(request.url);
  const route = url.searchParams.get("_admin_path") ?? url.pathname.replace(/^\/admin\/?/, "");
  return { params: { path: route.split("/").filter(Boolean) } };
}
function GET2(request) {
  return GET(request, context(request));
}
function POST2(request) {
  return POST(request, context(request));
}
export {
  GET2 as GET,
  POST2 as POST
};
