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
var periodOptions = [7, 28, 90, 180, 365];
function filtersFrom(url) {
  const days = Number(url.searchParams.get("days") || 28), country = url.searchParams.get("country") || "", device = url.searchParams.get("device") || "";
  if (!periodOptions.includes(days) || country && !Object.prototype.hasOwnProperty.call(countryCodes, country) || !["", "desktop", "mobile", "tablet"].includes(device)) throw new Error("Invalid report filters.");
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
var summaryMetrics = ["activeUsers", "newUsers", "sessions", "engagedSessions", "screenPageViews", "engagementRate", "userEngagementDuration", "averageSessionDuration", "screenPageViewsPerSession", "bounceRate"];
var trafficMetrics = ["sessions", "activeUsers", "engagementRate"];
var definitions = [
  { id: "summary", dimensions: [], metrics: summaryMetrics },
  { id: "previous", dimensions: [], metrics: summaryMetrics, previous: true },
  { id: "daily", dimensions: ["date"], metrics: ["sessions", "activeUsers", "screenPageViews"] },
  { id: "dailyPrevious", dimensions: ["date"], metrics: ["sessions"], previous: true },
  { id: "channels", dimensions: ["sessionDefaultChannelGroup"], metrics: trafficMetrics },
  { id: "channelsPrevious", dimensions: ["sessionDefaultChannelGroup"], metrics: ["sessions"], previous: true },
  { id: "sources", dimensions: ["sessionSourceMedium"], metrics: trafficMetrics },
  { id: "sourcesPrevious", dimensions: ["sessionSourceMedium"], metrics: ["sessions"], previous: true },
  { id: "countries", dimensions: ["country", "countryId"], metrics: trafficMetrics, limit: 250 },
  { id: "countriesPrevious", dimensions: ["country", "countryId"], metrics: ["sessions"], previous: true, limit: 250 },
  { id: "regions", dimensions: ["region", "country"], metrics: trafficMetrics },
  { id: "cities", dimensions: ["city", "country", "countryId"], metrics: trafficMetrics, limit: 250 },
  { id: "devices", dimensions: ["deviceCategory"], metrics: trafficMetrics },
  { id: "browsers", dimensions: ["browser"], metrics: trafficMetrics },
  { id: "os", dimensions: ["operatingSystem"], metrics: trafficMetrics },
  { id: "languages", dimensions: ["language"], metrics: ["activeUsers", "sessions"] },
  { id: "newReturning", dimensions: ["newVsReturning"], metrics: ["activeUsers", "sessions", "engagementRate"] },
  { id: "hourly", dimensions: ["dayOfWeek", "hour"], metrics: ["sessions"], limit: 200 },
  // Demographics need Google signals in GA4; each report fails independently when unavailable or thresholded.
  { id: "ageGroups", dimensions: ["userAgeBracket"], metrics: ["activeUsers"] },
  { id: "genders", dimensions: ["userGender"], metrics: ["activeUsers"] },
  { id: "interests", dimensions: ["brandingInterest"], metrics: ["activeUsers"], limit: 20 },
  { id: "brands", dimensions: ["mobileDeviceBranding"], metrics: ["sessions", "activeUsers"] },
  { id: "screens", dimensions: ["screenResolution"], metrics: ["sessions"], limit: 20 },
  { id: "firstSources", dimensions: ["firstUserSourceMedium"], metrics: ["newUsers", "activeUsers"] },
  { id: "referrers", dimensions: ["pageReferrer"], metrics: ["screenPageViews", "activeUsers"], limit: 150 },
  { id: "journeys", dimensions: ["sessionSourceMedium", "landingPage"], metrics: ["sessions", "engagementRate"], limit: 150 },
  { id: "campaigns", dimensions: ["sessionCampaignName"], metrics: trafficMetrics },
  { id: "pages", dimensions: ["pagePath"], metrics: ["screenPageViews", "activeUsers", "userEngagementDuration"], limit: 250 },
  { id: "pagesPrevious", dimensions: ["pagePath"], metrics: ["screenPageViews"], previous: true, limit: 250 },
  { id: "landing", dimensions: ["landingPage"], metrics: ["sessions", "engagementRate", "bounceRate"], limit: 250 },
  { id: "events", dimensions: ["eventName"], metrics: ["eventCount", "totalUsers"], eventFilter: trackedEvents },
  { id: "eventsPrevious", dimensions: ["eventName"], metrics: ["eventCount"], eventFilter: trackedEvents, previous: true },
  { id: "allEvents", dimensions: ["eventName"], metrics: ["eventCount", "totalUsers"], limit: 60 },
  { id: "eventsToday", dimensions: ["eventName"], metrics: ["eventCount"], eventFilter: trackedEvents, range: "today", unfiltered: true },
  { id: "eventsLastSeen", dimensions: ["eventName", "date"], metrics: ["eventCount"], eventFilter: trackedEvents, range: "year", unfiltered: true, limit: 500 },
  { id: "leadDaily", dimensions: ["date"], metrics: ["eventCount"], eventFilter: contacts },
  { id: "leadPages", dimensions: ["pagePath", "eventName"], metrics: ["eventCount"], eventFilter: contacts, limit: 250 },
  { id: "leadSources", dimensions: ["sessionSourceMedium", "eventName"], metrics: ["eventCount"], eventFilter: contacts }
];
function gaRequest(definition, filters, period) {
  const expressions = [];
  if (filters.country && !definition.unfiltered) expressions.push({ filter: { fieldName: "countryId", stringFilter: { value: filters.country, matchType: "EXACT" } } });
  if (filters.device && !definition.unfiltered) expressions.push({ filter: { fieldName: "deviceCategory", stringFilter: { value: filters.device, matchType: "EXACT" } } });
  if (definition.eventFilter) expressions.push({ filter: { fieldName: "eventName", inListFilter: { values: definition.eventFilter } } });
  return {
    dateRanges: [definition.range === "today" ? { startDate: "today", endDate: "today" } : definition.range === "year" ? { startDate: "365daysAgo", endDate: "today" } : { startDate: definition.previous ? period.previousStart : period.startDate, endDate: definition.previous ? period.previousEnd : period.endDate }],
    dimensions: definition.dimensions.map((name) => ({ name })),
    metrics: definition.metrics.map((name) => ({ name })),
    ...expressions.length ? { dimensionFilter: { andGroup: { expressions } } } : {},
    orderBys: definition.dimensions.includes("date") ? [{ dimension: { dimensionName: "date" }, desc: definition.range === "year" }] : [{ metric: { metricName: definition.metrics[0] }, desc: true }],
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
  { id: "liveEvents", dimensions: ["eventName"], metrics: ["eventCount"] },
  { id: "liveCountries", dimensions: ["country", "countryId"], metrics: ["activeUsers"] },
  { id: "liveCities", dimensions: ["city", "country", "countryId"], metrics: ["activeUsers"] },
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
  const gaWork = limited(definitions.map((definition) => async () => [definition.id, await safe(async () => gaRows(await googlePost(`https://analyticsdata.googleapis.com/v1beta/properties/${config.property}:runReport`, gaRequest(definition, filters, gaPeriod), accessToken, deadline)))]), 4);
  const searchDefinitions = [["searchSummary", []], ["searchPrevious", [], true], ["searchDaily", ["date"]], ["queries", ["query"]], ["queriesPrevious", ["query"], true], ["searchPages", ["page"]], ["searchPagesPrevious", ["page"], true], ["searchCountries", ["country"]], ["searchDevices", ["device"]]];
  const searchWork = limited(searchDefinitions.map(([id, dimensions, previous]) => async () => [id, await safe(async () => {
    const result = await googlePost(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(config.site)}/searchAnalytics/query`, searchRequest(dimensions, filters, searchPeriod, previous), accessToken, deadline);
    return { status: "ok", rows: (result.rows || []).map((row) => ({ ...Object.fromEntries(dimensions.map((key, index) => [key, row.keys[index]])), clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position })), limited: result.rows?.length === 250 };
  })]));
  const [entries, searchEntries] = await Promise.all([gaWork, searchWork]);
  return { mode: "live", generatedAt: (/* @__PURE__ */ new Date()).toISOString(), filters, periods: { ga: gaPeriod, search: searchPeriod }, datasets: Object.fromEntries([...entries, ...searchEntries]) };
}

// app/insights/demo.ts
var countryNames = { OM: "Oman", AE: "United Arab Emirates", SA: "Saudi Arabia", QA: "Qatar", KW: "Kuwait", BH: "Bahrain", IN: "India" };
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
  const growth = [1.19, 1.42, 0.86, 1.05, 2.1, 0.74, 1.3, 0.95, 1.6];
  const summary = { activeUsers: Math.round(sessions * 0.76), newUsers: Math.round(sessions * 0.61), sessions, engagedSessions: Math.round(sessions * 0.682), screenPageViews: views, engagementRate: 0.682, userEngagementDuration: sessions * 74, averageSessionDuration: 118.4, screenPageViewsPerSession: views / sessions, bounceRate: 0.318 };
  add("summary", [summary]);
  add("previous", [{ ...summary, activeUsers: Math.round(summary.activeUsers / 1.16), newUsers: Math.round(summary.newUsers / 1.22), sessions: Math.round(sessions / 1.19), screenPageViews: Math.round(views / 1.14), engagementRate: 0.632, averageSessionDuration: 104.2, screenPageViewsPerSession: 1.76, bounceRate: 0.368 }]);
  add("daily", daily);
  add("dailyPrevious", daily.map((row, i) => {
    const date = /* @__PURE__ */ new Date(ga.previousStart + "T00:00:00Z");
    date.setUTCDate(date.getUTCDate() + i);
    return { date: date.toISOString().slice(0, 10).replaceAll("-", ""), sessions: Math.round(Number(row.sessions) / 1.19) };
  }));
  const breakdown = (id, field, labels, shares2, extra = () => ({})) => {
    const counts2 = split(sessions, shares2);
    add(id, counts2.map((count, i) => ({ [field]: labels[i], ...extra(i), sessions: count, activeUsers: Math.round(count * 0.83), engagementRate: 0.54 + i * 0.035 })));
    return counts2;
  };
  const previousOf = (id, field, labels, counts2, extra = () => ({})) => add(id, counts2.map((count, i) => ({ [field]: labels[i], ...extra(i), sessions: Math.round(count / growth[i % growth.length]) })));
  const channelLabels = ["Organic Search", "Direct", "Organic Social", "Referral", "Paid Search"];
  previousOf("channelsPrevious", "sessionDefaultChannelGroup", channelLabels, breakdown("channels", "sessionDefaultChannelGroup", channelLabels, [0.48, 0.24, 0.14, 0.09, 0.05]));
  const sourceLabels = ["google / organic", "(direct) / (none)", "instagram / social", "linkedin.com / referral", "google / cpc", "chatgpt.com / referral"];
  previousOf("sourcesPrevious", "sessionSourceMedium", sourceLabels, breakdown("sources", "sessionSourceMedium", sourceLabels, [0.46, 0.24, 0.14, 0.08, 0.05, 0.03]));
  const countryIds = filters.country ? [filters.country] : ["OM", "AE", "SA", "IN", "QA", "GB", "US", "KW", "BH", "DE"];
  const countryLabels = countryIds.map((id) => countryNames[id] || { GB: "United Kingdom", US: "United States", DE: "Germany" }[id]);
  const countryShares = filters.country ? [1] : [0.5, 0.14, 0.1, 0.09, 0.04, 0.04, 0.03, 0.02, 0.02, 0.02];
  previousOf("countriesPrevious", "country", countryLabels, breakdown("countries", "country", countryLabels, countryShares, (i) => ({ countryId: countryIds[i] })), (i) => ({ countryId: countryIds[i] }));
  breakdown("regions", "region", ["Muscat", "Dubai", "Riyadh Region", "Kerala", "Al Batinah North", "Doha"], [0.36, 0.14, 0.1, 0.09, 0.18, 0.13], (i) => ({ country: ["Oman", "United Arab Emirates", "Saudi Arabia", "India", "Oman", "Qatar"][i] }));
  const cities = [["Muscat", "Oman", "OM"], ["Seeb", "Oman", "OM"], ["Dubai", "United Arab Emirates", "AE"], ["Riyadh", "Saudi Arabia", "SA"], ["Sohar", "Oman", "OM"], ["Kozhikode", "India", "IN"], ["Doha", "Qatar", "QA"], ["London", "United Kingdom", "GB"], ["Abu Dhabi", "United Arab Emirates", "AE"], ["Bengaluru", "India", "IN"]];
  breakdown("cities", "city", cities.map((c) => c[0]), [0.3, 0.12, 0.11, 0.09, 0.08, 0.07, 0.06, 0.06, 0.06, 0.05], (i) => ({ country: cities[i][1], countryId: cities[i][2] }));
  breakdown("devices", "deviceCategory", filters.device ? [filters.device] : ["mobile", "desktop", "tablet"], filters.device ? [1] : [0.64, 0.32, 0.04]);
  breakdown("browsers", "browser", ["Chrome", "Safari", "Edge", "Firefox", "Samsung Internet"], [0.55, 0.29, 0.08, 0.04, 0.04]);
  breakdown("os", "operatingSystem", ["Android", "iOS", "Windows", "Macintosh", "Linux"], [0.41, 0.3, 0.19, 0.08, 0.02]);
  breakdown("campaigns", "sessionCampaignName", ["(organic)", "(direct)", "portfolio-launch", "oman-seo-guide"], [0.48, 0.24, 0.18, 0.1]);
  add("languages", split(sessions, [0.74, 0.15, 0.04, 0.04, 0.03]).map((count, i) => ({ language: ["English", "Arabic", "Hindi", "Malayalam", "French"][i], sessions: count, activeUsers: Math.round(count * 0.82) })));
  add("newReturning", split(sessions, [0.63, 0.37]).map((count, i) => ({ newVsReturning: ["new", "returning"][i], sessions: count, activeUsers: Math.round(count * (i ? 0.55 : 0.9)), engagementRate: i ? 0.78 : 0.62 })));
  add("hourly", Array.from({ length: 7 * 24 }, (_, i) => {
    const day = Math.floor(i / 24), hour = i % 24;
    const curve = Math.max(0.05, Math.exp(-((hour - 10) ** 2) / 8) + 0.8 * Math.exp(-((hour - 21) ** 2) / 6) + 0.12);
    return { dayOfWeek: String(day), hour: String(hour).padStart(2, "0"), sessions: Math.round(sessions / 168 * curve * (day === 5 ? 0.55 : day === 6 ? 0.75 : 1.12) * 1.6) };
  }));
  add("ageGroups", split(summary.activeUsers, [0.09, 0.38, 0.29, 0.14, 0.07, 0.03]).map((activeUsers, i) => ({ userAgeBracket: ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"][i], activeUsers })));
  add("genders", split(summary.activeUsers, [0.66, 0.34]).map((activeUsers, i) => ({ userGender: ["male", "female"][i], activeUsers })));
  add("interests", ["Technology/Technophiles", "Business Professionals", "Shoppers/Value Shoppers", "Media & Entertainment/Movie Lovers", "Travel/Business Travelers", "Food & Dining/Coffee Shop Regulars", "Sports & Fitness/Health & Fitness Buffs", "Lifestyles & Hobbies/Business Professionals"].map((brandingInterest, i) => ({ brandingInterest, activeUsers: Math.round(summary.activeUsers * (0.34 - i * 0.035)) })));
  breakdown("brands", "mobileDeviceBranding", ["Apple", "Samsung", "Xiaomi", "Huawei", "Google", "OnePlus"], [0.42, 0.27, 0.12, 0.08, 0.06, 0.05]);
  breakdown("screens", "screenResolution", ["390x844", "1920x1080", "393x873", "1536x864", "412x915", "1440x900"], [0.24, 0.2, 0.17, 0.15, 0.13, 0.11]);
  add("firstSources", split(summary.activeUsers, [0.47, 0.26, 0.13, 0.09, 0.05]).map((activeUsers, i) => ({ firstUserSourceMedium: ["google / organic", "(direct) / (none)", "instagram / social", "linkedin.com / referral", "chatgpt.com / referral"][i], newUsers: Math.round(activeUsers * 0.8), activeUsers })));
  add("referrers", ["https://www.google.com/", "https://www.linkedin.com/", "https://l.instagram.com/", "https://chatgpt.com/", "https://www.bing.com/", "https://hisanali.com/", "https://www.facebook.com/", "https://duckduckgo.com/"].map((pageReferrer, i) => ({ pageReferrer, screenPageViews: Math.round(views * [0.3, 0.07, 0.06, 0.04, 0.03, 0.25, 0.02, 0.01][i]), activeUsers: Math.round(summary.activeUsers * [0.32, 0.06, 0.06, 0.04, 0.02, 0.2, 0.02, 0.01][i]) })));
  add("journeys", ["google / organic", "(direct) / (none)", "instagram / social", "linkedin.com / referral"].flatMap((source, i) => ["/", "/seo-expert-oman/", "/gcc/", "/blog/hire-digital-marketer-oman/"].map((landingPage, j) => ({ sessionSourceMedium: source, landingPage, sessions: Math.round(sessions * [0.46, 0.24, 0.14, 0.08][i] * [0.3, 0.35, 0.2, 0.15][(i + j) % 4]), engagementRate: 0.55 + (i * 3 + j) % 7 * 0.04 }))).sort((a, b) => b.sessions - a.sessions));
  const paths = ["/", "/seo-expert-oman/", "/gcc/", "/blog/hire-digital-marketer-oman/", "/contact/", "/resources/oman-marketing-calendar-2027/"];
  const shares = [0.29, 0.23, 0.18, 0.14, 0.1, 0.06];
  const pageViews = split(views, shares);
  add("pages", pageViews.map((count, i) => ({ pagePath: paths[i], screenPageViews: count, activeUsers: Math.round(count / 1.4), userEngagementDuration: count * (39 + i * 7) })));
  add("pagesPrevious", pageViews.map((count, i) => ({ pagePath: paths[i], screenPageViews: Math.round(count / growth[(i + 2) % growth.length]) })));
  add("landing", split(sessions, shares).map((count, i) => ({ landingPage: paths[i], sessions: count, engagementRate: 0.61 + i * 0.025, bounceRate: 0.39 - i * 0.025 })));
  const counts = [Math.round(sessions * 0.021), Math.round(sessions * 7e-3), Math.round(sessions * 4e-3), Math.round(sessions * 3e-3), Math.round(sessions * 0.024), Math.round(sessions * 0.016)];
  add("events", trackedEvents.map((eventName, i) => ({ eventName, eventCount: counts[i], totalUsers: Math.round(counts[i] * 0.84) })));
  add("eventsPrevious", trackedEvents.map((eventName, i) => ({ eventName, eventCount: Math.round(counts[i] * 0.78) })));
  add("allEvents", [["page_view", views], ["user_engagement", Math.round(sessions * 1.4)], ["session_start", sessions], ["scroll", Math.round(views * 0.46)], ["first_visit", summary.newUsers], ["click", Math.round(sessions * 0.21)], ...trackedEvents.map((name, i) => [name, counts[i]])].map(([eventName, eventCount]) => ({ eventName, eventCount, totalUsers: Math.round(Number(eventCount) * 0.7) })).sort((a, b) => Number(b.eventCount) - Number(a.eventCount)));
  add("eventsToday", [{ eventName: "lead_whatsapp", eventCount: 2 }, { eventName: "cta_contact", eventCount: 3 }, { eventName: "file_download", eventCount: 1 }]);
  add("eventsLastSeen", trackedEvents.filter((name) => name !== "lead_phone").map((eventName, i) => ({ eventName, date: ga.endDate.replaceAll("-", ""), eventCount: 1 + i })));
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
  const searchRows = (field, labels, previous = false) => labels.map((label, i) => {
    const position = [3.1, 6.8, 1.2, 9.4, 14.2, 7.6, 18.5, 11.3, 4.4, 22.8][i % 10], ctr = [0.12, 0.028, 0.41, 0.018, 9e-3, 0.022, 6e-3, 0.011, 0.07, 4e-3][i % 10];
    const shown = Math.round(impressions * [0.08, 0.14, 0.02, 0.12, 0.09, 0.07, 0.1, 0.06, 0.04, 0.05][i % 10]), count = Math.round(shown * ctr);
    const factor = previous ? growth[(i + 4) % growth.length] : 1;
    return { [field]: label, clicks: Math.round(count / factor), impressions: Math.round(shown / factor), ctr, position: previous ? position + 2.4 - i % 3 : position };
  });
  const queries = ["digital marketing consultant oman", "seo expert oman", "hisan ali", "digital marketer muscat", "gcc digital marketing", "google ads agency oman", "social media marketing oman", "freelance marketer muscat", "oman marketing calendar 2027", "website design oman"];
  add("queries", searchRows("query", queries));
  add("queriesPrevious", searchRows("query", queries, true));
  add("searchPages", searchRows("page", paths.map((path) => "https://hisanali.com" + path)));
  add("searchPagesPrevious", searchRows("page", paths.map((path) => "https://hisanali.com" + path), true));
  add("searchCountries", searchRows("country", filters.country ? [filters.country] : ["omn", "are", "sau", "ind"]));
  add("searchDevices", searchRows("device", filters.device ? [filters.device] : ["MOBILE", "DESKTOP", "TABLET"]));
  return { mode: "demo", generatedAt: (/* @__PURE__ */ new Date()).toISOString(), filters, periods: { ga, search }, datasets };
}
function demoRealtime() {
  const datasets = {};
  const add = (id, rows) => {
    datasets[id] = { status: "ok", rows };
  };
  add("realtime", [{ activeUsers: 9, screenPageViews: 27, eventCount: 74 }]);
  add("liveMinutes", [{ minutesAgo: "01", activeUsers: 3, eventCount: 12 }, { minutesAgo: "02", activeUsers: 2, eventCount: 10 }, { minutesAgo: "06", activeUsers: 3, eventCount: 17 }, { minutesAgo: "09", activeUsers: 1, eventCount: 4 }, { minutesAgo: "12", activeUsers: 2, eventCount: 15 }, { minutesAgo: "18", activeUsers: 2, eventCount: 12 }, { minutesAgo: "23", activeUsers: 1, eventCount: 6 }, { minutesAgo: "26", activeUsers: 1, eventCount: 10 }]);
  add("livePages", [{ unifiedScreenName: "Hisan Ali \u2014 Digital Marketing Consultant", screenPageViews: 12, activeUsers: 5 }, { unifiedScreenName: "SEO Expert Oman", screenPageViews: 8, activeUsers: 3 }, { unifiedScreenName: "GCC Digital Marketing", screenPageViews: 4, activeUsers: 2 }, { unifiedScreenName: "Contact", screenPageViews: 3, activeUsers: 1 }]);
  add("liveEvents", [{ eventName: "page_view", eventCount: 27 }, { eventName: "user_engagement", eventCount: 22 }, { eventName: "scroll", eventCount: 15 }, { eventName: "lead_whatsapp", eventCount: 5 }, { eventName: "lead_email", eventCount: 2 }]);
  add("liveCountries", [{ country: "Oman", countryId: "OM", activeUsers: 5 }, { country: "United Arab Emirates", countryId: "AE", activeUsers: 2 }, { country: "India", countryId: "IN", activeUsers: 1 }, { country: "United Kingdom", countryId: "GB", activeUsers: 1 }]);
  add("liveCities", [{ city: "Muscat", country: "Oman", countryId: "OM", activeUsers: 3 }, { city: "Seeb", country: "Oman", countryId: "OM", activeUsers: 1 }, { city: "Sohar", country: "Oman", countryId: "OM", activeUsers: 1 }, { city: "Dubai", country: "United Arab Emirates", countryId: "AE", activeUsers: 2 }, { city: "Kozhikode", country: "India", countryId: "IN", activeUsers: 1 }, { city: "London", country: "United Kingdom", countryId: "GB", activeUsers: 1 }]);
  add("liveDevices", [{ deviceCategory: "mobile", activeUsers: 6 }, { deviceCategory: "desktop", activeUsers: 3 }]);
  return { mode: "demo", generatedAt: (/* @__PURE__ */ new Date()).toISOString(), datasets };
}

// app/insights/shell.ts
function escape(value) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}
var svg = (path, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
var icons = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  out: '<path d="M7 17 17 7M8 7h9v9"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  device: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>'
};
var google = '<svg class="g-logo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
function login(options) {
  return `<main class="login" id="main">
  <section class="login-art" aria-hidden="true">
    <div class="art-glow"></div>
    <a class="login-logo" href="/" tabindex="-1"><span class="mark">h.</span><span>Hisan Ali<small>Portfolio admin</small></span></a>
    <div class="art-copy"><span class="pill">${svg(icons.sparkle)}Private analytics workspace</span><p class="art-title">Your growth,<br><em>in focus.</em></p><p>Traffic, enquiries and search visibility for hisanali.com \u2014 gathered into one calm, private place.</p></div>
    <svg class="art-chart" viewBox="0 0 600 220" preserveAspectRatio="none"><defs><linearGradient id="art-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfff63" stop-opacity=".35"/><stop offset="1" stop-color="#dfff63" stop-opacity="0"/></linearGradient></defs><path d="M0 180 C60 170 90 120 150 130 S250 160 300 110 S400 60 450 80 S540 40 600 20 V220 H0Z" fill="url(#art-fill)"/><path class="art-line" d="M0 180 C60 170 90 120 150 130 S250 160 300 110 S400 60 450 80 S540 40 600 20" fill="none" stroke="#dfff63" stroke-width="3" stroke-linecap="round"/><path d="M0 200 C80 195 120 170 190 175 S300 190 360 160 S470 130 600 110" fill="none" stroke="#9dd4ff" stroke-opacity=".5" stroke-width="2" stroke-dasharray="6 8"/></svg>
    <ul class="art-tags"><li><i class="dot c-sky"></i>Traffic</li><li><i class="dot c-peach"></i>Leads</li><li><i class="dot c-pink"></i>Search</li><li><i class="dot c-mint"></i>Realtime</li></ul>
  </section>
  <section class="login-panel">
    <div class="login-card">
      <span class="mark mark-lg" aria-hidden="true">h.</span>
      <p class="eyebrow">Welcome back</p>
      <h1>Sign in to your dashboard</h1>
      <p class="lead">Only the verified owner account can open these reports.</p>
      ${options.error ? `<div class="alert" role="alert">${svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>')}<span>${escape(options.error)}</span></div>` : ""}
      ${options.ready ? `<a class="btn btn-google" href="/admin/login/">${google}<span>Continue with Google</span>${svg(icons.arrow)}</a>` : `<div class="callout">${svg(icons.lock)}<div><b>Google connection needed</b><p>The dashboard is ready. Add the Google OAuth client and session secret to enable private sign-in.</p></div></div>`}
      ${options.preview ? `<a class="btn btn-ghost" href="/admin/?demo=1">${svg(icons.eye)}<span>Explore the local preview</span>${svg(icons.arrow)}</a><p class="fine">The preview uses clearly labelled sample data.</p>` : ""}
      <ul class="trust"><li>${svg(icons.shield)}Owner-only</li><li>${svg(icons.lock)}Encrypted session</li><li>${svg(icons.eye)}Read-only access</li></ul>
    </div>
    <a class="back-site" href="/">${svg(icons.back)}Back to hisanali.com</a>
  </section>
</main>`;
}
function app(options) {
  const demo = options.mode === "demo";
  return `<div class="app">
<aside class="sidebar" aria-label="Admin navigation">
  <a class="brand" href="/admin/${demo ? "?demo=1" : ""}"><span class="mark">h.</span><span>Hisan Ali<small>Portfolio analytics</small></span></a>
  <a class="workspace" href="https://hisanali.com/" target="_blank" rel="noopener noreferrer"><span class="favicon"><img src="/favicon.png" alt="" width="20" height="20"></span><span>hisanali.com<small>${demo ? "Preview workspace" : "Connected workspace"}</small></span>${svg(icons.out)}</a>
  <p class="nav-label">Reports</p>
  <nav id="nav" aria-label="Analytics views"></nav>
  <div class="side-foot">
    <div class="side-live" id="side-live"><span class="pulse"></span><span><b id="side-live-count">\u2014</b> on site now</span></div>
    <p class="shortcut">Press <kbd>1</kbd>\u2013<kbd>9</kbd> to switch views</p>
  </div>
</aside>
<div class="main-wrap">
  <header class="topbar">
    <a class="brand brand-mobile" href="/admin/${demo ? "?demo=1" : ""}" aria-label="Admin home"><span class="mark">h.</span></a>
    <nav class="crumbs" aria-label="Breadcrumb"><span>Workspace</span>${svg('<path d="m9 6 6 6-6 6"/>')}<b id="breadcrumb">Overview</b></nav>
    <div class="top-actions">
      <button class="live-chip" id="live-chip" data-view="live" title="Visitors in the last 30 minutes"><span class="pulse"></span><b id="live-chip-count">\u2014</b><span class="live-label">live</span></button>
      <span class="mode-chip ${demo ? "is-demo" : ""}">${demo ? "Sample data" : `${svg(icons.lock)}Private`}</span>
      <button class="icon-btn" id="theme" aria-label="Toggle dark mode" title="Toggle theme">${svg(icons.moon, "i i-moon")}${svg(icons.sun, "i i-sun")}</button>
      <span class="avatar" title="Hisan Ali \xB7 Administrator">HA</span>
      ${options.mode === "live" ? `<form action="/admin/logout/" method="post"><button class="icon-btn" aria-label="Sign out" title="Sign out">${svg(icons.logout)}</button></form>` : ""}
    </div>
  </header>
  ${demo ? `<div class="demo-banner" role="note">${svg(icons.eye)}<span><b>Preview mode.</b> You're exploring sample data \u2014 these are not your website's results.</span><a href="/admin/">Connect Google ${svg(icons.arrow)}</a></div>` : ""}
  <main id="main">
    <div class="page-head">
      <div><p class="eyebrow" id="view-eyebrow">Portfolio intelligence</p><h1 id="view-title">Overview</h1><p id="view-description" class="lead">Understand what brings people in, and what turns visits into enquiries.</p></div>
      <div class="page-actions"><button id="refresh" class="btn btn-soft">${svg(icons.refresh)}<span>Refresh</span></button><button id="export" class="btn btn-primary">${svg(icons.download)}<span>Export CSV</span></button></div>
    </div>
    <section class="toolbar" id="toolbar" aria-label="Report filters">
      <div class="segmented" role="radiogroup" aria-label="Reporting period" id="period-group">
        <button role="radio" data-days="7" aria-checked="false" title="Last 7 days">7D</button><button role="radio" data-days="28" aria-checked="true" title="Last 28 days">28D</button><button role="radio" data-days="90" aria-checked="false" title="Last 90 days">90D</button><button role="radio" data-days="180" aria-checked="false" title="Last 6 months">6M</button><button role="radio" data-days="365" aria-checked="false" title="Last 12 months">12M</button>
      </div>
      <input type="hidden" id="period" value="28">
      <label class="select">${svg(icons.globe)}<span class="sr">Country</span><select id="country"><option value="">All countries</option><option value="OM">Oman</option><option value="AE">United Arab Emirates</option><option value="SA">Saudi Arabia</option><option value="QA">Qatar</option><option value="KW">Kuwait</option><option value="BH">Bahrain</option><option value="IN">India</option></select></label>
      <label class="select">${svg(icons.device)}<span class="sr">Device</span><select id="device"><option value="">All devices</option><option value="mobile">Mobile</option><option value="desktop">Desktop</option><option value="tablet">Tablet</option></select></label>
      <button class="text-btn" id="reset" hidden>Clear filters</button>
      <label class="switch"><input type="checkbox" id="compare" checked><span class="track"><span class="thumb"></span></span>Compare with previous period</label>
    </section>
    <div id="content" aria-live="polite" aria-busy="true"></div>
    <footer class="footer"><span id="freshness">Google Analytics 4 + Search Console</span><button class="text-btn" data-view="sources">Sources &amp; metric definitions ${svg(icons.arrow)}</button></footer>
  </main>
</div>
<nav class="tabbar" id="tabbar" aria-label="Analytics views"></nav>
<div class="tooltip" id="tooltip" role="presentation" hidden></div>
<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
</div>`;
}
function shell(options) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><meta name="color-scheme" content="light dark"><title>${options.mode === "login" ? "Sign in" : "Analytics"} \xB7 Hisan Ali admin</title><link rel="icon" href="/favicon.png"><link rel="preload" href="/insights/fonts/manrope.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/insights/dashboard.css"><script src="/insights/theme.js"></script></head>
<body data-mode="${options.mode}"><a class="skip" href="#main">Skip to content</a>${options.mode === "login" ? login(options) : `${app({ mode: options.mode })}<script src="/insights/dashboard.js" defer></script>`}</body></html>`;
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
