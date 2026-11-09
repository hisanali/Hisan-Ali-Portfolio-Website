import realtime from './realtime-public.json';
import { GET, POST } from '../scripts/portfolio-admin-entry';
import { collectActivity } from '../app/insights/activity';
import { collectEnquiry } from '../app/insights/enquiries';

// Production uses the existing backend, preserving data continuity and rollback.
export default {
 async fetch(request:Request) {
  const url=new URL(request.url);
  if(url.hostname==='www.hisanali.com'){
   url.hostname='hisanali.com';return Response.redirect(url.toString(),308);
  }
  const headers=new Headers(request.headers);
  headers.set('x-forwarded-for',request.headers.get('cf-connecting-ip')||'unknown');
  request=new Request(request,{headers});
  let response:Response;
  if(/^\/api\/multiplayer\/config\/?$/.test(url.pathname))response=Response.json(realtime,{headers:{'Cache-Control':'no-store'}});
  else if(/^\/api\/site-activity\/?$/.test(url.pathname))response=request.method==='POST'?await collectActivity(request):new Response('Method not allowed',{status:405});
  else if(/^\/api\/contact-enquiry\/?$/.test(url.pathname))response=request.method==='POST'?await collectEnquiry(request):new Response('Method not allowed',{status:405});
  else if(/^\/admin(?:\/|$)/.test(url.pathname))response=request.method==='GET'?await GET(request):request.method==='POST'?await POST(request):new Response('Method not allowed',{status:405});
  else response=new Response('Not found',{status:404});
  const result=new Response(response.body,response);
  result.headers.set('X-Robots-Tag','noindex, nofollow');
  return result;
 }
};
