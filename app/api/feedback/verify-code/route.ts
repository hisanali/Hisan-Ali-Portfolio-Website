import { NextResponse } from 'next/server';
import { createVerificationToken, isValidEmail, normalizeEmail, verifyCode } from '../_lib/auth';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; code?: string };
    const email = normalizeEmail(body.email || '');
    const code = (body.code || '').trim();

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Verification code must be 6 digits.' }, { status: 400 });
    }

    const ok = await verifyCode(email, code);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 401 });
    }

    const token = createVerificationToken(email);
    return NextResponse.json({
      ok: true,
      token: token.token,
      email,
      expiresAt: token.expiresAt
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
  }
}
