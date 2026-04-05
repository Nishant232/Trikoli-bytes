-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  address text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- User roles
create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  menu_item_id text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;

create policy "Anyone can read reviews" on public.reviews for select to anon, authenticated using (true);
create policy "Authenticated users can create reviews" on public.reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can delete own reviews" on public.reviews for delete to authenticated using (auth.uid() = user_id);

-- Coupons
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_percent integer not null check (discount_percent > 0 and discount_percent <= 100),
  min_order_amount integer default 0,
  max_uses integer,
  used_count integer default 0,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.coupons enable row level security;

create policy "Anyone can read active coupons" on public.coupons for select using (is_active = true);
create policy "Admins can manage coupons" on public.coupons for all to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  total_amount integer not null,
  discount_amount integer default 0,
  coupon_code text,
  delivery_address text,
  phone text,
  payment_method text default 'cod',
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Users can view own orders" on public.orders for select to authenticated using (auth.uid() = user_id);
create policy "Users can create orders" on public.orders for insert to authenticated with check (auth.uid() = user_id);
create policy "Admins can view all orders" on public.orders for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update orders" on public.orders for update to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Order items
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  menu_item_id text not null,
  name text not null,
  price integer not null,
  quantity integer not null,
  image text
);

alter table public.order_items enable row level security;

create policy "Users can view own order items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid()));
create policy "Users can create order items" on public.order_items for insert to authenticated
  with check (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid()));
create policy "Admins can view all order items" on public.order_items for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Seed some coupons
insert into public.coupons (code, discount_percent, min_order_amount, expires_at) values
  ('WELCOME10', 10, 200, '2026-12-31'),
  ('TRILOKI20', 20, 500, '2026-12-31'),
  ('FOODIE15', 15, 300, '2026-12-31');