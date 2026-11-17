-- Minimal stand-in for Supabase's auth schema so migrations can be tested on plain Postgres.
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, phone text, email text);
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
grant usage on schema public, auth to anon, authenticated;
