import { createHash, randomBytes } from 'node:crypto';
import { configuration, type AdminSession } from './security.ts';

export const scopes = ['openid', 'email', 'https://www.googleapis.com/auth/analytics.readonly', 'https://www.googleapis.com/auth/webmasters.readonly'];
export function authorization() {
  const config = configuration();
  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(48).toString('base64url');
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.origin + '/admin/callback/', response_type: 'code', scope: scopes.join(' '), state, code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256', access_type: 'offline', prompt: 'consent', login_hint: config.email }).toString();
  return { url: url.toString(), state, verifier, expires: Date.now() + 10 * 60 * 1000 };
}
export async function tokenRequest(fields: Record<string, string>) {
  const config = configuration();
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, ...fields }) });
  if (!response.ok) throw new Error('Google sign-in expired or could not be completed. Please reconnect.');
  const value = await response.json();
  if (typeof value.access_token !== 'string') throw new Error('Google did not return an access token.');
  return value;
}
export async function exchange(code: string, verifier: string): Promise<AdminSession> {
  const token = await tokenRequest({ code, code_verifier: verifier, grant_type: 'authorization_code', redirect_uri: configuration().origin + '/admin/callback/' });
  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${token.access_token}` }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Unable to verify the Google account.');
  const user = await response.json();
  if (user.email_verified !== true || user.email?.toLowerCase() !== configuration().email) throw new Error('This Google account is not authorized for the admin dashboard.');
  return { email: configuration().email, accessToken: token.access_token, refreshToken: token.refresh_token, tokenExpires: Date.now() + Number(token.expires_in || 3600) * 1000, expires: Date.now() + 8 * 60 * 60 * 1000 };
}
export async function freshSession(session: AdminSession): Promise<AdminSession> {
  if (session.tokenExpires > Date.now() + 60000) return session;
  if (!session.refreshToken) throw new Error('Your Google session has expired. Please reconnect.');
  const token = await tokenRequest({ refresh_token: session.refreshToken, grant_type: 'refresh_token' });
  return { ...session, accessToken: token.access_token, tokenExpires: Date.now() + Number(token.expires_in || 3600) * 1000 };
}

export async function googlePost(url: string, body: object, accessToken: string, deadline?: AbortSignal) {
  const signal = deadline ? AbortSignal.any([deadline, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000);
  const response = await fetch(url, { method: 'POST', cache: 'no-store', signal, headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) {
    if (response.status === 403) throw new Error('Access unavailable. Check the enabled API and your property permissions.');
    if (response.status === 401) throw new Error('Google authorization expired. Reconnect your account.');
    if (response.status === 429) throw new Error('Google quota reached. Please try again later.');
    if (response.status === 400) throw new Error('This report is unavailable for the property. Check its dimensions and configuration.');
    throw new Error('Google could not load this report. Please try again later.');
  }
  return response.json();
}
