type EmailResult = {
  delivered: boolean;
  devCode?: string;
};

export async function sendVerificationCodeEmail(email: string, code: string): Promise<EmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.FEEDBACK_FROM_EMAIL;

  if (!resendApiKey || !from) {
    // Local fallback for development when email provider is not configured.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[feedback] verification code for ${email}: ${code}`);
      return { delivered: false, devCode: code };
    }
    throw new Error('email_not_configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Your blog comment verification code',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Email Verification Code</h2>
          <p>Your code is:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${code}</p>
          <p>This code expires in 10 minutes.</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    throw new Error(`email_provider_error:${response.status}`);
  }

  return { delivered: true };
}

