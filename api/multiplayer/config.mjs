export function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    return Response.json(
      { error: 'Realtime multiplayer is not configured.' },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }

  return Response.json(
    { url, publishableKey },
    { headers: { 'cache-control': 'no-store' } }
  );
}
