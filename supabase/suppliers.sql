-- Suppliers for an office that already ran schema.sql.
-- Run this once in the Supabase SQL editor, then reload the app.

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists suppliers_name_unique on public.suppliers (lower(btrim(name)));

alter table public.purchases
  add column if not exists supplier_id uuid references public.suppliers (id) on delete restrict;

do $$
begin
  create trigger suppliers_updated_at
    before update on public.suppliers
    for each row execute function public.set_updated_at();
exception
  when duplicate_object then null;
end $$;

grant select, insert, update, delete on public.suppliers to authenticated;
alter table public.suppliers enable row level security;

do $$
begin
  create policy suppliers_admin_all on public.suppliers
    for all to authenticated using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null;
end $$;
