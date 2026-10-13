begin;
alter table public.portfolio_activity drop constraint portfolio_activity_event_name_check;
alter table public.portfolio_activity add constraint portfolio_activity_event_name_check check (event_name in ('page_view','site_click','control_change','form_submit','lead_whatsapp','lead_email','lead_phone','lead_form','cta_contact','file_download','heartbeat','scroll_depth','page_exit','location_shared','location_revoked','rage_click'));
alter table public.portfolio_activity add column session_id uuid;
alter table public.portfolio_activity add column page_id uuid;
alter table public.portfolio_activity add column metadata jsonb not null default '{}'::jsonb check (octet_length(metadata::text) <= 2000);
create index portfolio_activity_session_idx on public.portfolio_activity(session_id, received_at);
comment on table public.portfolio_activity is 'Owner-only actions. Anonymous session journeys require opt-in. No raw IP, keystrokes or form values. Rolling 30 days.';
create or replace function public.portfolio_record_activity(items jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
begin
 if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) > 20 then raise exception 'Invalid batch'; end if;
 insert into public.portfolio_activity(id,event_name,page,label,target,area,device,session_id,page_id,metadata)
 select id,event_name,page,label,target,area,device,session_id,page_id,coalesce(metadata,'{}'::jsonb)
 from jsonb_to_recordset(items) as x(id uuid,event_name text,page text,label text,target text,area text,device text,session_id uuid,page_id uuid,metadata jsonb)
 on conflict(id) do nothing;
 -- Revoking location also removes previously shared coordinates from this anonymous visit.
 update public.portfolio_activity a set metadata = a.metadata - 'latitude' - 'longitude' - 'accuracy'
 where a.session_id in (select x.session_id from jsonb_to_recordset(items) as x(event_name text,session_id uuid) where x.event_name='location_revoked');
 delete from public.portfolio_activity where received_at < now()-interval '30 days';
 return jsonb_build_object('ok',true);
end; $$;
grant update on public.portfolio_activity to service_role;
create or replace function public.portfolio_read_journeys(visit uuid default null) returns jsonb
language sql stable security invoker set search_path = '' as $$
with recent as (select * from public.portfolio_activity where metadata->>'environment' is distinct from 'local-preview' and session_id is not null and received_at>now()-interval '24 hours'),
sessions as (
 select session_id, min(received_at) started_at, max(received_at) last_seen,
 (array_agg(page order by received_at desc))[1] current_page,
 (array_agg(event_name order by received_at desc) filter(where event_name<>'heartbeat'))[1] last_action,
 (array_agg(device order by received_at))[1] device,
 (array_agg(metadata order by received_at desc))[1] context,
 (array_agg(metadata order by received_at desc) filter(where metadata ? 'latitude'))[1] shared_location,
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
 'events',(select coalesce(jsonb_agg(r order by r.received_at),'[]'::jsonb) from (select * from recent where session_id=visit order by received_at desc limit 500) r),
 'popular',(select coalesce(jsonb_agg(p),'[]'::jsonb) from (select page,label,target,count(*) clicks from recent where event_name in ('site_click','cta_contact','lead_whatsapp','lead_email','lead_phone','file_download') group by page,label,target order by count(*) desc limit 30) p));
$$;
revoke all on function public.portfolio_read_journeys(uuid) from public,anon,authenticated;
grant execute on function public.portfolio_read_journeys(uuid) to service_role;
create table public.portfolio_enquiries (
 id uuid primary key, created_at timestamptz not null default now(),
 details jsonb not null check(octet_length(details::text)<=18000),
 session_id uuid, status text not null default 'new' check(status in ('new','read','contacted','qualified','won','lost','spam')),
 notes text not null default '' check(length(notes)<=2000),
 sheet_delivery text not null default 'pending' check(sheet_delivery in ('pending','accepted','unconfirmed')),
 updated_at timestamptz not null default now()
);
create index portfolio_enquiries_created_idx on public.portfolio_enquiries(created_at desc);
alter table public.portfolio_enquiries enable row level security;
revoke all on public.portfolio_enquiries from public,anon,authenticated;
grant select,insert,update on public.portfolio_enquiries to service_role;
comment on table public.portfolio_enquiries is 'Private owner enquiry inbox. Intentional contact details, not behavior telemetry. Original Google Form is retained.';
create or replace function public.portfolio_read_activity() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'generatedAt', now(),
    'source', 'Website activity',
    'window', 'Latest 24 hours',
    'rows', (select coalesce(jsonb_agg(r order by r.received_at desc), '[]'::jsonb) from (select * from public.portfolio_activity where metadata->>'environment' is distinct from 'local-preview' and event_name <> 'heartbeat' and received_at > now() - interval '24 hours' order by received_at desc limit 300) r),
    'counts', (select coalesce(jsonb_agg(c), '[]'::jsonb) from (
      select event_name, count(*) filter (where received_at > now() - interval '30 minutes') as last30,
        count(*) filter (where received_at >= date_trunc('day', now() at time zone 'Asia/Muscat') at time zone 'Asia/Muscat') as today,
        max(received_at) as last_received
      from public.portfolio_activity where metadata->>'environment' is distinct from 'local-preview' and received_at > now() - interval '30 days' group by event_name
    ) c)
  );
$$;

commit;
