import { NextResponse } from 'next/server';
import { addComment, getPostFeedback, setRating } from '../_lib/store';
import { hashEmail, verifyToken } from '../_lib/auth';

const BLOCKED_TERMS = ['http://', 'https://', 'viagra', 'casino', 'crypto giveaway'];

function hasBlockedTerm(text: string): boolean {
  const normalized = text.toLowerCase();
  return BLOCKED_TERMS.some((term) => normalized.includes(term));
}

type Context = {
  params: {
    slug: string;
  };
};

export async function GET(request: Request, { params }: Context) {
  const url = new URL(request.url);
  const visitorId = (url.searchParams.get('visitorId') || '').trim();
  const feedback = await getPostFeedback(params.slug, visitorId || undefined);
  return NextResponse.json(feedback);
}

export async function POST(request: Request, { params }: Context) {
  try {
    const body = (await request.json()) as
      | {
          type: 'rate';
          visitorId?: string;
          rating?: number;
        }
      | {
          type: 'comment';
          token?: string;
          name?: string;
          text?: string;
        };

    if (body.type === 'rate') {
      const visitorId = (body.visitorId || '').trim();
      const rating = Number(body.rating);
      if (!visitorId || visitorId.length > 120) {
        return NextResponse.json({ error: 'Invalid visitor id.' }, { status: 400 });
      }
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
      }
      const feedback = await setRating(params.slug, visitorId, rating);
      return NextResponse.json({ ok: true, feedback });
    }

    if (body.type === 'comment') {
      const token = (body.token || '').trim();
      const tokenResult = verifyToken(token);
      if (!tokenResult.ok) {
        return NextResponse.json({ error: 'Email verification is required before commenting.' }, { status: 401 });
      }

      const name = ((body.name || '').trim() || 'Anonymous').slice(0, 50);
      const text = (body.text || '').trim();
      if (!text) {
        return NextResponse.json({ error: 'Comment text is required.' }, { status: 400 });
      }
      if (text.length > 500) {
        return NextResponse.json({ error: 'Comment must be 500 characters or fewer.' }, { status: 400 });
      }
      if (hasBlockedTerm(text)) {
        return NextResponse.json({ error: 'Comment blocked by spam filter.' }, { status: 400 });
      }

      await addComment(params.slug, name, text, hashEmail(tokenResult.email));
      const feedback = await getPostFeedback(params.slug);
      return NextResponse.json({ ok: true, feedback });
    }

    return NextResponse.json({ error: 'Unsupported feedback action.' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
  }
}

