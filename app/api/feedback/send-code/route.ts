import { NextResponse } from 'next/server';
import { createVerificationCode, isValidEmail, normalizeEmail } from '../_lib/auth';
import { sendVerificationCodeEmail } from '../_lib/email';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = normalizeEmail(body.email || '');

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    let code: string;
    try {
      code = await createVerificationCode(email);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.startsWith('wait:')) {
        const seconds = Number(message.split(':')[1] || '60');
        return NextResponse.json(
          { error: `Please wait ${seconds}s before requesting another code.` },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: 'Unable to create verification code.' }, { status: 500 });
    }

    const emailResult = await sendVerificationCodeEmail(email, code);

    return NextResponse.json({
      ok: true,
      message: emailResult.delivered
        ? 'Verification code sent to your email.'
        : 'Verification code generated (development mode).',
      ...(emailResult.devCode ? { devCode: emailResult.devCode } : {})
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
  }
}
