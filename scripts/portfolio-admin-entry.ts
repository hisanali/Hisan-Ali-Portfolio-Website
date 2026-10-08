import { GET as adminGet, POST as adminPost } from '../app/admin/[[...path]]/route';

// Vercel's existing static deployment uses the same authenticated handler as local Next.js.
function context(request: Request) {
  const url = new URL(request.url);
  const route = url.searchParams.get('_admin_path') ?? url.pathname.replace(/^\/admin\/?/, '');
  return { params: { path: route.split('/').filter(Boolean) } };
}
export function GET(request: Request) { return adminGet(request, context(request)); }
export function POST(request: Request) { return adminPost(request, context(request)); }
