-- B42 Bistro back office. One restaurant. No tenant id.
-- Run once in the Supabase SQL editor on a new project.
--
-- Pages this covers
--   Login                         auth.users + public.profiles
--   Dashboard                     orders, purchases, expenses, journal, payroll_runs, accounts
--   Zones, Tables                 zones, restaurant_tables
--   Categories, Units             menu_categories, measurement_units
--   Ingredients, Menu items       ingredients, menu_items, menu_item_ingredients
--   Inventory, Balance inventory  inventory_items, inventory_transactions
--   Customers, Orders             customers, orders, order_items
--   Purchases, Expenses, Assets   purchases, expenses, fixed_assets + their lines
--   Chart, Journal, Ledger,       accounts, journal_entries, journal_lines
--   Cashbook, Reports
--   Employees, Leave, Attendance, employees, leave_requests, attendance_records
--   Payslips, Pay and file,       payslips, payroll_runs, payroll_policy, public_holidays
--   Policies
--   Settings                      company
--   My pay (staff)                own employee, payslips, leave
--   AI Analytics                  no table; it reads the books above and is locked in the app
--
-- After this script:
--   1. Authentication → Providers → Email. Turn off public sign-ups.
--   2. Authentication → Users → Add user. That first account becomes administrator.
--   3. Staff: add a user with the employee email, then set employees.user_id to that user.
--      Passwords live in Supabase Auth, not on the employee row.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.account_type as enum ('asset', 'liability', 'equity', 'income', 'expense');
create type public.payment_method as enum ('cash', 'bank', 'credit');
create type public.asset_funding as enum ('cash', 'bank', 'credit', 'capital');
create type public.asset_category as enum ('vehicle', 'kitchen', 'furniture', 'it', 'building', 'land', 'other');
create type public.journal_source as enum ('manual', 'purchase', 'inventory', 'expense', 'asset', 'depreciation', 'payroll');
create type public.order_status as enum ('open', 'preparing', 'served', 'completed', 'cancelled');
create type public.stock_movement as enum ('IN', 'OUT', 'ADJUSTMENT');
create type public.app_role as enum ('administrator', 'staff');
create type public.job_type as enum ('full_time', 'part_time', 'casual', 'atypical');
create type public.leave_type as enum ('annual', 'sick', 'urgent', 'special', 'vacation', 'maternity', 'paternity', 'unpaid');
create type public.leave_status as enum ('pending', 'approved', 'rejected');
create type public.attendance_status as enum ('present', 'absent', 'leave', 'holiday', 'off');
create type public.payslip_status as enum ('draft', 'final');
create type public.gender as enum ('female', 'male', 'other');
create type public.marital_status as enum ('single', 'married', 'other');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Login
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'staff',
  employee_id uuid,
  preferred_locale text not null default 'en' check (preferred_locale in ('en', 'fr', 'mfe')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'administrator'
  );
$$;

create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select employee_id from public.profiles where id = auth.uid();
$$;

-- The first person added in Authentication becomes the owner.
-- Later accounts are staff. Role is not taken from the signup form.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned public.app_role;
begin
  perform pg_advisory_xact_lock(42042);
  if not exists (select 1 from public.profiles) then
    assigned := 'administrator';
  else
    assigned := 'staff';
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Owner'),
    assigned
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Settings and payroll rules (one row each)
-- ---------------------------------------------------------------------------

create table public.company (
  id int primary key default 1 check (id = 1),
  name text not null,
  legal_name text not null default '',
  brn text not null default '',
  vat_number text not null default '',
  tan text not null default '',
  address text not null default '',
  city text not null default '',
  phone text not null default '',
  email text not null default '',
  website text not null default '',
  logo text,
  updated_at timestamptz not null default now()
);

create table public.payroll_policy (
  id int primary key default 1 check (id = 1),
  annual_leave_days numeric(6,2) not null default 20,
  extra_leave_days numeric(6,2) not null default 2,
  sick_leave_days numeric(6,2) not null default 15,
  sick_leave_max_accum numeric(6,2) not null default 90,
  urgent_leave_days numeric(6,2) not null default 3,
  special_marriage_days numeric(6,2) not null default 6,
  vacation_leave_days numeric(6,2) not null default 30,
  vacation_after_years int not null default 5,
  maternity_weeks int not null default 14,
  paternity_days int not null default 5,
  csg_threshold numeric(14,2) not null default 50000,
  csg_employee_low numeric(8,4) not null default 0.015,
  csg_employer_low numeric(8,4) not null default 0.03,
  csg_employee_high numeric(8,4) not null default 0.03,
  csg_employer_high numeric(8,4) not null default 0.06,
  nsf_employee numeric(8,4) not null default 0.01,
  nsf_employer numeric(8,4) not null default 0.025,
  nsf_ceiling numeric(14,2) not null default 29710,
  hrdc_levy numeric(8,4) not null default 0.015,
  prgf_rate numeric(8,4) not null default 0.045,
  paye_exempt_monthly numeric(14,2) not null default 38462,
  overtime_weekday numeric(6,2) not null default 1.5,
  overtime_public_holiday numeric(6,2) not null default 2,
  standard_hours_week numeric(6,2) not null default 45,
  notes text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Floor and menu
-- ---------------------------------------------------------------------------

create table public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  zone_id uuid not null references public.zones (id) on delete restrict,
  capacity int not null check (capacity > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  image text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index menu_categories_name_unique on public.menu_categories (lower(btrim(name)));

create table public.measurement_units (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  abbreviation text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index measurement_units_name_unique on public.measurement_units (lower(btrim(name)));

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  unit_id uuid not null references public.measurement_units (id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text not null default '',
  description text not null default '',
  category_id uuid not null references public.menu_categories (id) on delete restrict,
  price numeric(14,2) not null check (price >= 0),
  manufactured_price numeric(14,2) not null default 0 check (manufactured_price >= 0),
  image text,
  preparation_time int check (preparation_time is null or preparation_time >= 0),
  is_available boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index menu_items_name_unique on public.menu_items (lower(btrim(name)));
create unique index menu_items_name_en_unique on public.menu_items (lower(btrim(name_en))) where btrim(name_en) <> '';

create table public.menu_item_ingredients (
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  quantity numeric(14,3) not null check (quantity > 0),
  primary key (menu_item_id, ingredient_id)
);

-- ---------------------------------------------------------------------------
-- Stock
-- ---------------------------------------------------------------------------

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null unique references public.ingredients (id) on delete restrict,
  current_stock numeric(14,3) not null default 0,
  minimum_stock numeric(14,3) not null default 0 check (minimum_stock >= 0),
  cost_per_unit numeric(14,4) not null default 0 check (cost_per_unit >= 0),
  last_updated timestamptz not null default now()
);

create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items (id) on delete restrict,
  type public.stock_movement not null,
  quantity_change numeric(14,3) not null,
  previous_stock numeric(14,3) not null,
  new_stock numeric(14,3) not null,
  reason text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Customers and orders
-- name on an order is the French dish name already stored on order_items.
-- customer_name and customer_phone are the guest on that ticket.
-- customers.phone is unique for the restaurant, so the same number is one person.
-- ---------------------------------------------------------------------------

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index customers_phone_unique
  on public.customers (regexp_replace(lower(btrim(phone)), '[[:space:]().-]', '', 'g'));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  table_id uuid not null references public.restaurant_tables (id) on delete restrict,
  zone_id uuid not null references public.zones (id) on delete restrict,
  customer_id uuid references public.customers (id) on delete set null,
  customer_name text not null default '',
  customer_phone text not null default '',
  status public.order_status not null default 'open',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid not null references public.menu_items (id) on delete restrict,
  category_id uuid not null references public.menu_categories (id) on delete restrict,
  name text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0)
);

-- ---------------------------------------------------------------------------
-- Books
-- ---------------------------------------------------------------------------

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  type public.account_type not null,
  is_cash boolean not null default false,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  entry_date date not null,
  description text not null default '',
  source public.journal_source not null default 'manual',
  source_id uuid,
  created_at timestamptz not null default now()
);

create table public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references public.journal_entries (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete restrict,
  description text not null default '',
  debit numeric(14,2) not null default 0 check (debit >= 0),
  credit numeric(14,2) not null default 0 check (credit >= 0),
  check (debit = 0 or credit = 0)
);

create index journal_lines_entry_idx on public.journal_lines (journal_entry_id);
create index journal_lines_account_idx on public.journal_lines (account_id);
create index journal_entries_date_idx on public.journal_entries (entry_date);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  supplier text not null,
  invoice_number text not null default '',
  purchase_date date not null,
  payment public.payment_method not null,
  notes text not null default '',
  journal_entry_id uuid references public.journal_entries (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchase_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  description text not null default '',
  ingredient_id uuid references public.ingredients (id) on delete restrict,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_cost numeric(14,4) not null check (unit_cost >= 0),
  posted_to_inventory boolean not null default false
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  payee text not null,
  reference text not null default '',
  expense_date date not null,
  payment public.payment_method not null,
  notes text not null default '',
  journal_entry_id uuid references public.journal_entries (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expense_lines (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses (id) on delete cascade,
  description text not null default '',
  account_id uuid not null references public.accounts (id) on delete restrict,
  amount numeric(14,2) not null check (amount >= 0)
);

create table public.fixed_assets (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  name text not null,
  category public.asset_category not null,
  acquired_on date not null,
  cost numeric(14,2) not null check (cost >= 0),
  funding public.asset_funding not null,
  depreciates boolean not null default true,
  useful_life_months int not null default 0 check (useful_life_months >= 0),
  residual_value numeric(14,2) not null default 0 check (residual_value >= 0),
  accumulated_depreciation numeric(14,2) not null default 0 check (accumulated_depreciation >= 0),
  last_depreciation_date date,
  notes text not null default '',
  journal_entry_id uuid references public.journal_entries (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Payroll
-- ---------------------------------------------------------------------------

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  employee_number text not null unique,
  first_name text not null,
  last_name text not null,
  nid text not null default '',
  gender public.gender not null,
  date_of_birth date not null,
  nationality text not null default 'Mauritian',
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  marital_status public.marital_status not null default 'single',
  bank_name text not null default '',
  bank_code text not null default '',
  bank_account text not null default '',
  job_title text not null,
  department text not null default '',
  job_type public.job_type not null default 'full_time',
  start_date date not null,
  end_date date,
  is_active boolean not null default true,
  basic_salary numeric(14,2) not null check (basic_salary >= 0),
  pay_frequency text not null default 'monthly' check (pay_frequency = 'monthly'),
  work_days_per_week smallint not null default 5 check (work_days_per_week in (5, 6)),
  hours_per_week numeric(6,2) not null default 45 check (hours_per_week > 0),
  edf_relief_annual numeric(14,2) not null default 0 check (edf_relief_annual >= 0),
  prgf_eligible boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index employees_email_unique
  on public.employees (lower(btrim(email)))
  where btrim(email) <> '';

alter table public.profiles
  add constraint profiles_employee_id_fkey
  foreign key (employee_id) references public.employees (id) on delete set null;

create or replace function public.sync_employee_login()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.user_id is distinct from new.user_id and old.user_id is not null then
    update public.profiles
    set employee_id = null
    where id = old.user_id and employee_id = old.id and role <> 'administrator';
  end if;

  if new.user_id is not null then
    update public.profiles
    set employee_id = new.id
    where id = new.user_id and role <> 'administrator';
  end if;

  return new;
end;
$$;

create trigger employees_sync_login
  after insert or update of user_id on public.employees
  for each row execute function public.sync_employee_login();

create table public.public_holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  name text not null
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  type public.leave_type not null,
  starts_on date not null,
  ends_on date not null,
  days numeric(6,2) not null check (days > 0),
  reason text not null default '',
  status public.leave_status not null default 'pending',
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  work_date date not null,
  status public.attendance_status not null,
  clock_in time,
  clock_out time,
  hours_worked numeric(6,2) not null default 0 check (hours_worked >= 0),
  overtime_hours numeric(6,2) not null default 0 check (overtime_hours >= 0),
  public_holiday_hours numeric(6,2) not null default 0 check (public_holiday_hours >= 0),
  notes text not null default '',
  unique (employee_id, work_date)
);

create table public.payslips (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  employee_id uuid not null references public.employees (id) on delete restrict,
  period text not null check (period ~ '^[0-9]{4}-[0-9]{2}$'),
  basic numeric(14,2) not null default 0,
  overtime_pay numeric(14,2) not null default 0,
  public_holiday_pay numeric(14,2) not null default 0,
  unpaid_deduction numeric(14,2) not null default 0,
  gross numeric(14,2) not null default 0,
  csg_employee numeric(14,2) not null default 0,
  nsf_employee numeric(14,2) not null default 0,
  paye numeric(14,2) not null default 0,
  other_deductions numeric(14,2) not null default 0,
  net numeric(14,2) not null default 0,
  csg_employer numeric(14,2) not null default 0,
  nsf_employer numeric(14,2) not null default 0,
  hrdc_levy numeric(14,2) not null default 0,
  prgf numeric(14,2) not null default 0,
  days_present numeric(6,2) not null default 0,
  days_leave numeric(6,2) not null default 0,
  days_unpaid numeric(6,2) not null default 0,
  overtime_hours numeric(6,2) not null default 0,
  status public.payslip_status not null default 'draft',
  created_at timestamptz not null default now(),
  unique (employee_id, period)
);

create table public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  period text not null unique check (period ~ '^[0-9]{4}-[0-9]{2}$'),
  journal_entry_id uuid references public.journal_entries (id) on delete set null,
  payment_journal_id uuid references public.journal_entries (id) on delete set null,
  remittance_journal_id uuid references public.journal_entries (id) on delete set null,
  paid_on date,
  filed_on date,
  payment_reference text not null default '',
  filing_reference text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'zones', 'restaurant_tables', 'menu_categories', 'measurement_units', 'ingredients',
    'menu_items', 'customers', 'orders', 'accounts', 'purchases', 'expenses', 'fixed_assets',
    'employees', 'payroll_runs', 'company', 'payroll_policy'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_updated_at',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Opening rows the app expects
-- ---------------------------------------------------------------------------

insert into public.company (id, name, legal_name, brn, vat_number, tan, address, city, phone, email, website)
values (
  1, 'B42 Bistro', 'B42 Bistro Ltd', 'C18123456', 'VAT20345678', '12345678',
  'Royal Road', 'Grand Baie', '+230 263 4200', 'hello@b42bistro.mu', 'https://b42bistro.mu'
);

insert into public.payroll_policy (id, notes)
values (
  1,
  'Rates follow MRA CSG, NSF, HRDC and PRGF guidance and the Workers'' Rights Act 2019. PAYE is the cumulative July–June method. Confirm the return in MRA e-services before you submit it.'
);

insert into public.accounts (code, name, type, is_cash, is_system) values
  ('1000', 'Cash on hand', 'asset', true, true),
  ('1010', 'Bank', 'asset', true, true),
  ('1100', 'Inventory', 'asset', false, true),
  ('1200', 'Fixed assets', 'asset', false, true),
  ('1205', 'Accumulated depreciation', 'asset', false, true),
  ('2000', 'Accounts payable', 'liability', false, true),
  ('2100', 'Net wages payable', 'liability', false, true),
  ('2110', 'PAYE payable', 'liability', false, true),
  ('2120', 'CSG payable', 'liability', false, true),
  ('2130', 'NSF payable', 'liability', false, true),
  ('2140', 'HRDC levy payable', 'liability', false, true),
  ('2150', 'PRGF payable', 'liability', false, true),
  ('3000', 'Owner''s capital', 'equity', false, true),
  ('4000', 'Food sales', 'income', false, true),
  ('5000', 'Food purchases', 'expense', false, true),
  ('5100', 'Operating expenses', 'expense', false, true),
  ('5200', 'Depreciation', 'expense', false, true),
  ('5300', 'Wages and salaries', 'expense', false, true),
  ('5310', 'Employer CSG', 'expense', false, true),
  ('5320', 'Employer NSF', 'expense', false, true),
  ('5330', 'HRDC training levy', 'expense', false, true),
  ('5340', 'PRGF', 'expense', false, true);

insert into public.public_holidays (holiday_date, name) values
  ('2026-01-01', 'New Year'),
  ('2026-01-02', 'New Year'),
  ('2026-02-01', 'Abolition of Slavery / Thaipoosam Cavadee'),
  ('2026-02-15', 'Maha Shivaratree'),
  ('2026-02-17', 'Chinese Spring Festival'),
  ('2026-03-12', 'Independence and Republic Day'),
  ('2026-03-19', 'Ugaadi'),
  ('2026-03-21', 'Eid-Ul-Fitr'),
  ('2026-05-01', 'Labour Day'),
  ('2026-08-15', 'Assumption'),
  ('2026-09-15', 'Ganesh Chaturthi'),
  ('2026-11-02', 'Arrival of Indentured Labourers'),
  ('2026-11-08', 'Divali'),
  ('2026-12-25', 'Christmas');

-- ---------------------------------------------------------------------------
-- Access. Administrators see the whole office. Staff see only their own pay.
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'company', 'payroll_policy', 'zones', 'restaurant_tables', 'menu_categories',
    'measurement_units', 'ingredients', 'menu_items', 'menu_item_ingredients', 'inventory_items',
    'inventory_transactions', 'customers', 'orders', 'order_items', 'accounts', 'journal_entries', 'journal_lines',
    'purchases', 'purchase_lines', 'expenses', 'expense_lines', 'fixed_assets', 'employees',
    'public_holidays', 'leave_requests', 'attendance_records', 'payslips', 'payroll_runs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_all',
      t
    );
  end loop;
end $$;

create policy company_read on public.company
  for select to authenticated using (true);

create policy holidays_read on public.public_holidays
  for select to authenticated using (true);

create policy payroll_policy_read on public.payroll_policy
  for select to authenticated using (true);

create policy profiles_read_own on public.profiles
  for select to authenticated using (id = auth.uid());

create policy employees_read_own on public.employees
  for select to authenticated using (id = public.current_employee_id());

create policy payslips_read_own on public.payslips
  for select to authenticated using (employee_id = public.current_employee_id());

create policy attendance_read_own on public.attendance_records
  for select to authenticated using (employee_id = public.current_employee_id());

create policy leave_read_own on public.leave_requests
  for select to authenticated using (employee_id = public.current_employee_id());

create policy leave_request_own on public.leave_requests
  for insert to authenticated
  with check (
    employee_id = public.current_employee_id()
    and status = 'pending'
  );

grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_employee_id() to authenticated;
