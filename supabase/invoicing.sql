-- Invoicing for an office that already ran schema.sql.
-- Run this once in the Supabase SQL editor, then reload the app.
-- Adds customer invoices, VAT payable (2200) and accounts receivable (1300).

alter type public.journal_source add value if not exists 'invoice';

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  customer_id uuid references public.customers (id) on delete set null,
  customer_name text not null default '',
  customer_phone text not null default '',
  bill_to text not null default '',
  invoice_date date not null,
  due_date date not null,
  status text not null default 'draft' check (status in ('draft', 'issued', 'partial', 'paid', 'void')),
  notes text not null default '',
  journal_entry_id uuid references public.journal_entries (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  description text not null default '',
  menu_item_id uuid references public.menu_items (id) on delete set null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  vat_rate numeric(5,2) not null default 15 check (vat_rate >= 0)
);

create table if not exists public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  paid_on date not null,
  amount numeric(14,2) not null check (amount > 0),
  method text not null check (method in ('cash', 'bank')),
  reference text not null default '',
  journal_entry_id uuid references public.journal_entries (id) on delete set null
);

create index if not exists invoices_date_idx on public.invoices (invoice_date);
create index if not exists invoice_lines_invoice_idx on public.invoice_lines (invoice_id);
create index if not exists invoice_payments_invoice_idx on public.invoice_payments (invoice_id);

insert into public.accounts (code, name, type, is_cash, is_system)
values
  ('1300', 'Accounts receivable', 'asset', false, true),
  ('2200', 'VAT payable', 'liability', false, true)
on conflict (code) do nothing;

do $$
begin
  create trigger invoices_updated_at
    before update on public.invoices
    for each row execute function public.set_updated_at();
exception
  when duplicate_object then null;
end $$;

grant select, insert, update, delete on public.invoices to authenticated;
grant select, insert, update, delete on public.invoice_lines to authenticated;
grant select, insert, update, delete on public.invoice_payments to authenticated;

alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.invoice_payments enable row level security;

do $$
begin
  create policy invoices_admin_all on public.invoices
    for all to authenticated using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy invoice_lines_admin_all on public.invoice_lines
    for all to authenticated using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy invoice_payments_admin_all on public.invoice_payments
    for all to authenticated using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null;
end $$;
