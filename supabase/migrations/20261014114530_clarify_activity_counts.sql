-- Clarify counts without rewriting or deleting existing receipts.
begin;
create or replace function public.portfolio_read_journeys(visit uuid default null) returns jsonb
language sql stable security invoker set search_path = '' as $$
with recent as (select *, coalesce((metadata->>'occurred_at')::timestamptz,received_at) event_at from public.portfolio_activity where metadata->>'environment' is distinct from 'local-preview' and session_id is not null and received_at>now()-interval '24 hours'),
sessions as (
 select session_id, min(event_at) started_at, max(event_at) last_seen,
 (array_agg(page order by event_at desc, received_at desc))[1] current_page,
 (array_agg(event_name order by event_at desc, received_at desc) filter(where event_name<>'heartbeat'))[1] last_action,
 (array_agg(device order by event_at, received_at))[1] device,
 (array_agg(metadata order by event_at desc, received_at desc))[1] context,
 (array_agg(metadata order by event_at desc, received_at desc) filter(where metadata ? 'latitude'))[1] shared_location,
 count(*) filter(where event_name='page_view') page_views,
 count(*) filter(where event_name in ('site_click','cta_contact','lead_whatsapp','lead_email','lead_phone','file_download')) clicks,
 count(*) filter(where event_name in ('lead_whatsapp','lead_email','lead_phone','lead_form')) leads,
 count(*) filter(where event_name='rage_click') frustration,
 coalesce(sum((metadata->>'active_seconds')::numeric),0) active_seconds,
 max(coalesce((metadata->>'scroll')::numeric,0)) max_scroll
 from recent group by session_id order by max(received_at) desc limit 200
)
select jsonb_build_object('generatedAt',now(),'source','Consented website journeys','window','Latest 24 hours','limit',200,
 'sessions',(select coalesce(jsonb_agg(s),'[]'::jsonb) from sessions s),
 'visit',visit, 'events',(select coalesce(jsonb_agg(r order by r.event_at, r.received_at),'[]'::jsonb) from (select * from recent where session_id=visit order by event_at desc, received_at desc limit 500) r),
 'popular',(select coalesce(jsonb_agg(p),'[]'::jsonb) from (select page,label,target,count(*) clicks from recent where event_name in ('site_click','cta_contact','lead_whatsapp','lead_email','lead_phone','file_download') group by page,label,target order by count(*) desc limit 30) p));
$$;
revoke all on function public.portfolio_read_journeys(uuid) from public,anon,authenticated;
grant execute on function public.portfolio_read_journeys(uuid) to service_role;
create or replace function public.portfolio_read_activity() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'generatedAt', now(),
    'source', 'Direct website receipts', 'retentionDays',30,
    'window', 'Latest 24 hours',
    'rows', (select coalesce(jsonb_agg(r order by r.received_at desc), '[]'::jsonb) from (select * from public.portfolio_activity where metadata->>'environment' is distinct from 'local-preview' and event_name not in ('heartbeat','location_shared','location_revoked') and received_at > now() - interval '24 hours' order by received_at desc limit 300) r),
    'counts', (select coalesce(jsonb_agg(c), '[]'::jsonb) from (
      select event_name, count(*) filter (where received_at > now() - interval '30 minutes') as last30,
        count(*) filter (where received_at > now() - interval '24 hours') as last24,
        count(*) as last30days,
        count(*) filter (where received_at >= date_trunc('day', now() at time zone 'Asia/Muscat') at time zone 'Asia/Muscat') as today,
        max(received_at) as last_received
      from public.portfolio_activity where metadata->>'environment' is distinct from 'local-preview' and received_at > now() - interval '30 days' group by event_name
    ) c)
  );
$$;

commit;
