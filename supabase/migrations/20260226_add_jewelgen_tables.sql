-- JewelGen: Static ad generator for jewelry
-- Tables, RLS policies, storage buckets, and app seed

-- ============================================================
-- 1. Reference library categories (hierarchical: type → style)
-- ============================================================
create table jewelgen_ref_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references jewelgen_ref_categories(id) on delete cascade,
  display_order int default 0,
  created_at timestamptz default now()
);

alter table jewelgen_ref_categories enable row level security;

create policy "Authenticated users can view categories"
  on jewelgen_ref_categories for select
  to authenticated
  using (true);

create policy "Authenticated users can manage categories"
  on jewelgen_ref_categories for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- 2. Reference library images
-- ============================================================
create table jewelgen_ref_images (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references jewelgen_ref_categories(id) on delete cascade,
  storage_path text not null,
  label text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table jewelgen_ref_images enable row level security;

create policy "Authenticated users can view ref images"
  on jewelgen_ref_images for select
  to authenticated
  using (true);

create policy "Authenticated users can manage ref images"
  on jewelgen_ref_images for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- 3. Generation history
-- ============================================================
create table jewelgen_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  product_image_path text not null,
  reference_image_path text not null,
  output_paths text[] not null default '{}',
  prompt text,
  settings jsonb default '{}',
  status text default 'pending',
  error text,
  created_at timestamptz default now()
);

alter table jewelgen_generations enable row level security;

create policy "Users can view own generations"
  on jewelgen_generations for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create own generations"
  on jewelgen_generations for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own generations"
  on jewelgen_generations for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own generations"
  on jewelgen_generations for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- 4. Storage buckets
-- ============================================================
insert into storage.buckets (id, name, public)
values
  ('jewelgen-products', 'jewelgen-products', false),
  ('jewelgen-references', 'jewelgen-references', false),
  ('jewelgen-outputs', 'jewelgen-outputs', false)
on conflict (id) do nothing;

-- Product images: authenticated read all, write own prefix
create policy "Auth users can read product images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'jewelgen-products');

create policy "Auth users can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'jewelgen-products' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Auth users can delete own product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'jewelgen-products' and (storage.foldername(name))[1] = auth.uid()::text);

-- Reference images: authenticated read all, write all (shared library)
create policy "Auth users can read reference images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'jewelgen-references');

create policy "Auth users can upload reference images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'jewelgen-references');

create policy "Auth users can delete reference images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'jewelgen-references');

-- Output images: authenticated read all, write own prefix
create policy "Auth users can read output images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'jewelgen-outputs');

create policy "Auth users can upload output images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'jewelgen-outputs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Auth users can delete own output images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'jewelgen-outputs' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- 5. Seed JewelGen app in the App Hub
-- ============================================================
insert into apps (name, slug, description, url, status, display_order, open_in_new_tab)
values ('JewelGen', 'jewelgen', 'Static ad generator for jewelry', '/jewelgen', 'active', 4, false);

-- ============================================================
-- 6. Seed default reference categories
-- ============================================================
do $$
declare
  ring_id uuid;
  necklace_id uuid;
  wristband_id uuid;
  earring_id uuid;
begin
  insert into jewelgen_ref_categories (name, display_order) values ('Ring', 1) returning id into ring_id;
  insert into jewelgen_ref_categories (name, display_order) values ('Necklace', 2) returning id into necklace_id;
  insert into jewelgen_ref_categories (name, display_order) values ('Wristband', 3) returning id into wristband_id;
  insert into jewelgen_ref_categories (name, display_order) values ('Earring', 4) returning id into earring_id;

  -- Ring sub-categories
  insert into jewelgen_ref_categories (name, parent_id, display_order) values ('Close Up', ring_id, 1);
  insert into jewelgen_ref_categories (name, parent_id, display_order) values ('Hand Shot', ring_id, 2);
  insert into jewelgen_ref_categories (name, parent_id, display_order) values ('Lifestyle', ring_id, 3);

  -- Necklace sub-categories
  insert into jewelgen_ref_categories (name, parent_id, display_order) values ('Close Up', necklace_id, 1);
  insert into jewelgen_ref_categories (name, parent_id, display_order) values ('Neck Shot', necklace_id, 2);
  insert into jewelgen_ref_categories (name, parent_id, display_order) values ('Lifestyle', necklace_id, 3);

  -- Wristband sub-categories
  insert into jewelgen_ref_categories (name, parent_id, display_order) values ('Close Up', wristband_id, 1);
  insert into jewelgen_ref_categories (name, parent_id, display_order) values ('Wrist Shot', wristband_id, 2);
  insert into jewelgen_ref_categories (name, parent_id, display_order) values ('Lifestyle', wristband_id, 3);

  -- Earring sub-categories
  insert into jewelgen_ref_categories (name, parent_id, display_order) values ('Close Up', earring_id, 1);
  insert into jewelgen_ref_categories (name, parent_id, display_order) values ('Ear Shot', earring_id, 2);
  insert into jewelgen_ref_categories (name, parent_id, display_order) values ('Lifestyle', earring_id, 3);
end $$;
