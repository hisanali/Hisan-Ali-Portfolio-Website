begin;
create table public.portfolio_activity (
  id uuid primary key,
  received_at timestamptz not null default now(),
  event_name text not null check (event_name in ('page_view','site_click','control_change','form_submit','lead_whatsapp','lead_email','lead_phone','lead_form','cta_contact','file_download')),
  page text not null check (length(page) <= 240),
  label text not null check (length(label) <= 100),
  target text not null check (length(target) <= 240),
  area text not null check (area in ('header','footer','form','content')),
  device text not null check (device in ('mobile','tablet','desktop'))
);
create index portfolio_activity_received_idx on public.portfolio_activity (received_at desc);
alter table public.portfolio_activity enable row level security;
revoke all on public.portfolio_activity from public, anon, authenticated;
grant select, insert, delete on public.portfolio_activity to service_role;
comment on table public.portfolio_activity is 'Owner-only website action telemetry; no visitor identifiers or form values. Rolling 30-day retention.';
create function public.portfolio_record_activity(items jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
begin
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) > 20 then raise exception 'Invalid batch'; end if;
  insert into public.portfolio_activity (id, event_name, page, label, target, area, device)
  select id, event_name, page, label, target, area, device
  from jsonb_to_recordset(items) as x(id uuid, event_name text, page text, label text, target text, area text, device text)
  on conflict (id) do nothing;
  -- Only this newly created activity table is pruned. Existing data is untouched.
  delete from public.portfolio_activity where received_at < now() - interval '30 days';
  return jsonb_build_object('ok', true);
end;
$$;
create function public.portfolio_read_activity() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'generatedAt', now(),
    'source', 'Website activity',
    'window', 'Latest 24 hours',
    'rows', (select coalesce(jsonb_agg(r order by r.received_at desc), '[]'::jsonb) from (select * from public.portfolio_activity where received_at > now() - interval '24 hours' order by received_at desc limit 300) r),
    'counts', (select coalesce(jsonb_agg(c), '[]'::jsonb) from (
      select event_name, count(*) filter (where received_at > now() - interval '30 minutes') as last30,
        count(*) filter (where received_at >= date_trunc('day', now() at time zone 'Asia/Muscat') at time zone 'Asia/Muscat') as today,
        max(received_at) as last_received
      from public.portfolio_activity where received_at > now() - interval '30 days' group by event_name
    ) c)
  );
$$;
revoke all on function public.portfolio_record_activity(jsonb) from public, anon, authenticated;
revoke all on function public.portfolio_read_activity() from public, anon, authenticated;
grant execute on function public.portfolio_record_activity(jsonb) to service_role;
grant execute on function public.portfolio_read_activity() to service_role;
commit;
