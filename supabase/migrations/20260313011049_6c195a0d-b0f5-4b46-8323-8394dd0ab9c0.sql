-- Storage bucket for avatars
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text default '',
  bio text default '',
  avatar_url text default '',
  favorite_genres text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view any profile" on public.profiles for select to authenticated using (true);
create policy "Users can update own profile" on public.profiles for update to authenticated using (id = auth.uid());
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Favorites table
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  image text default '',
  link text not null,
  extra text default '',
  media_type text not null check (media_type in ('movie', 'series', 'song')),
  created_at timestamptz default now(),
  unique(user_id, link)
);

alter table public.favorites enable row level security;

create policy "Users can view own favorites" on public.favorites for select to authenticated using (user_id = auth.uid());
create policy "Users can insert own favorites" on public.favorites for insert to authenticated with check (user_id = auth.uid());
create policy "Users can delete own favorites" on public.favorites for delete to authenticated using (user_id = auth.uid());

-- Playlists table
create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '',
  is_public boolean default false,
  share_id text unique default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.playlists enable row level security;

create policy "Users can view own playlists" on public.playlists for select to authenticated using (user_id = auth.uid());
create policy "Public playlists viewable by all" on public.playlists for select using (is_public = true);
create policy "Users can insert own playlists" on public.playlists for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update own playlists" on public.playlists for update to authenticated using (user_id = auth.uid());
create policy "Users can delete own playlists" on public.playlists for delete to authenticated using (user_id = auth.uid());

-- Playlist items table
create table public.playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid references public.playlists(id) on delete cascade not null,
  title text not null,
  image text default '',
  link text not null,
  extra text default '',
  media_type text not null check (media_type in ('movie', 'series', 'song')),
  position integer default 0,
  created_at timestamptz default now()
);

alter table public.playlist_items enable row level security;

-- Security definer function to check playlist ownership
create or replace function public.owns_playlist(_user_id uuid, _playlist_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.playlists where id = _playlist_id and user_id = _user_id
  )
$$;

create or replace function public.is_playlist_public(_playlist_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.playlists where id = _playlist_id and is_public = true
  )
$$;

create policy "Users can view own playlist items" on public.playlist_items for select to authenticated using (public.owns_playlist(auth.uid(), playlist_id));
create policy "Public playlist items viewable" on public.playlist_items for select using (public.is_playlist_public(playlist_id));
create policy "Users can insert own playlist items" on public.playlist_items for insert to authenticated with check (public.owns_playlist(auth.uid(), playlist_id));
create policy "Users can delete own playlist items" on public.playlist_items for delete to authenticated using (public.owns_playlist(auth.uid(), playlist_id));

-- Storage RLS for avatars
create policy "Anyone can view avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "Authenticated users can upload avatars" on storage.objects for insert to authenticated with check (bucket_id = 'avatars');
create policy "Users can update own avatars" on storage.objects for update to authenticated using (bucket_id = 'avatars');
create policy "Users can delete own avatars" on storage.objects for delete to authenticated using (bucket_id = 'avatars');