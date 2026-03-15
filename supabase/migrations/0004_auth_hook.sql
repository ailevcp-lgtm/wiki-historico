create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  app_role text;
begin
  claims := coalesce(event->'claims', '{}'::jsonb);
  app_role := claims->'app_metadata'->>'app_role';

  if app_role in ('editor', 'admin') then
    claims := jsonb_set(claims, '{app_role}', to_jsonb(app_role), true);
  else
    claims := jsonb_set(claims, '{app_role}', 'null'::jsonb, true);
  end if;

  event := jsonb_set(event, '{claims}', claims, true);

  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;

grant execute
  on function public.custom_access_token_hook(jsonb)
  to supabase_auth_admin;

revoke execute
  on function public.custom_access_token_hook(jsonb)
  from authenticated, anon, public;
