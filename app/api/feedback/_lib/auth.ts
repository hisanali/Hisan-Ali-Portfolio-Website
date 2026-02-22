import { createHash, createHmac, randomInt } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

export type PendingCode = {
  codeHash: string;
  expiresAt: number;
  sentAt: number;
  attempts: number;
};

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 6;
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const DATA_DIR = path.join(process.cwd(), 'data');
const VERIFICATION_FILE = path.join(DATA_DIR, 'blog-feedback-verification.json');

type VerificationStore = {
  pending: Record<string, PendingCode>;
};

let verificationWriteChain: Promise<void> = Promise.resolve();

function secret(): string {
  return process.env.FEEDBACK_AUTH_SECRET || 'local-dev-feedback-secret-change-in-production';
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

async function ensureVerificationFile(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(VERIFICATION_FILE, 'utf8');
  } catch {
    await writeFile(VERIFICATION_FILE, JSON.stringify({ pending: {} }, null, 2), 'utf8');
  }
}

async function readVerificationStore(): Promise<VerificationStore> {
  await ensureVerificationFile();
  try {
    const raw = await readFile(VERIFICATION_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<VerificationStore>;
    if (!parsed || typeof parsed !== 'object' || !parsed.pending || typeof parsed.pending !== 'object') {
      return { pending: {} };
    }
    return { pending: parsed.pending as Record<string, PendingCode> };
  } catch {
    return { pending: {} };
  }
}

async function writeVerificationStore(store: VerificationStore): Promise<void> {
  await ensureVerificationFile();
  await writeFile(VERIFICATION_FILE, JSON.stringify(store, null, 2), 'utf8');
}

export function hashEmail(email: string): string {
  return hash(normalizeEmail(email));
}

export async function createVerificationCode(email: string) {
  const normalized = normalizeEmail(email);
  const now = Date.now();
  const store = await readVerificationStore();
  const existing = store.pending[normalized];
  if (existing && now - existing.sentAt < RESEND_COOLDOWN_MS) {
    const retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.sentAt)) / 1000);
    throw new Error(`wait:${retryAfterSeconds}`);
  }

  const code = String(randomInt(0, 1000000)).padStart(6, '0');
  const pendingCode: PendingCode = {
    codeHash: hash(`${normalized}:${code}`),
    expiresAt: now + CODE_TTL_MS,
    sentAt: now,
    attempts: 0
  };

  verificationWriteChain = verificationWriteChain.then(async () => {
    const latest = await readVerificationStore();
    latest.pending[normalized] = pendingCode;
    await writeVerificationStore(latest);
  });
  await verificationWriteChain;

  return code;
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const store = await readVerificationStore();
  const pending = store.pending[normalized];
  if (!pending) return false;

  const now = Date.now();
  if (now > pending.expiresAt) {
    delete store.pending[normalized];
    verificationWriteChain = verificationWriteChain.then(() => writeVerificationStore(store));
    await verificationWriteChain;
    return false;
  }

  if (pending.attempts >= MAX_VERIFY_ATTEMPTS) {
    delete store.pending[normalized];
    verificationWriteChain = verificationWriteChain.then(() => writeVerificationStore(store));
    await verificationWriteChain;
    return false;
  }

  pending.attempts += 1;
  const isMatch = hash(`${normalized}:${code}`) === pending.codeHash;
  if (isMatch) {
    delete store.pending[normalized];
    verificationWriteChain = verificationWriteChain.then(() => writeVerificationStore(store));
    await verificationWriteChain;
    return true;
  }

  store.pending[normalized] = pending;
  verificationWriteChain = verificationWriteChain.then(() => writeVerificationStore(store));
  await verificationWriteChain;
  return false;
}

export function createVerificationToken(email: string): { token: string; expiresAt: string } {
  const normalized = normalizeEmail(email);
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${normalized}|${exp}`;
  const sig = createHmac('sha256', secret()).update(payload).digest('hex');
  const token = Buffer.from(JSON.stringify({ e: normalized, exp, sig }), 'utf8').toString('base64url');
  return { token, expiresAt: new Date(exp).toISOString() };
}

export function verifyToken(token: string): { ok: true; email: string } | { ok: false } {
  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as {
      e: string;
      exp: number;
      sig: string;
    };
    if (!parsed.e || !parsed.exp || !parsed.sig) return { ok: false };
    if (Date.now() > parsed.exp) return { ok: false };
    const expected = createHmac('sha256', secret()).update(`${parsed.e}|${parsed.exp}`).digest('hex');
    if (expected !== parsed.sig) return { ok: false };
    return { ok: true, email: parsed.e };
  } catch {
    return { ok: false };
  }
}
