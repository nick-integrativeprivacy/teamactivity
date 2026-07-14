create extension if not exists pgcrypto;

create table public.participants (
  id text primary key,
  display_name text not null,
  sort_order int not null unique
);

create table public.fact_options (
  id text primary key,
  label text not null,
  display_order int not null unique
);

create table public.song_options (
  id text primary key,
  label text not null,
  spotify_track_id text not null,
  display_order int not null unique
);

create table public.answer_key (
  participant_id text primary key references public.participants(id) on delete cascade,
  fact_id text not null references public.fact_options(id),
  song_id text not null references public.song_options(id)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  player_user_id uuid references auth.users(id) on delete set null,
  player_name text not null,
  player_email text not null,
  score int not null check (score between 0 and 18),
  created_at timestamptz not null default now()
);

create index submissions_player_user_id_idx
  on public.submissions (player_user_id);

create table public.submission_guesses (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  participant_id text not null references public.participants(id),
  fact_id text not null references public.fact_options(id),
  song_id text not null references public.song_options(id),
  fact_correct boolean not null,
  song_correct boolean not null,
  unique (submission_id, participant_id)
);

create table public.leaderboard_entries (
  id uuid primary key references public.submissions(id) on delete cascade,
  player_name text not null,
  score int not null,
  created_at timestamptz not null
);

alter table public.participants enable row level security;
alter table public.fact_options enable row level security;
alter table public.song_options enable row level security;
alter table public.answer_key enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_guesses enable row level security;
alter table public.leaderboard_entries enable row level security;

create policy "participants are public to signed in players"
  on public.participants
  for select
  to authenticated
  using (true);

create policy "facts are public to signed in players"
  on public.fact_options
  for select
  to authenticated
  using (true);

create policy "songs are public to signed in players"
  on public.song_options
  for select
  to authenticated
  using (true);

create policy "leaderboard is public to signed in players"
  on public.leaderboard_entries
  for select
  to authenticated
  using (true);

revoke usage on schema public from anon;
revoke select on public.participants, public.fact_options, public.song_options, public.leaderboard_entries from anon;
revoke all on public.answer_key, public.submissions, public.submission_guesses from anon, authenticated;

grant usage on schema public to authenticated, service_role;
grant select on public.participants, public.fact_options, public.song_options, public.leaderboard_entries to authenticated;
grant all on public.participants, public.fact_options, public.song_options, public.answer_key, public.submissions, public.submission_guesses, public.leaderboard_entries to service_role;

insert into public.participants (id, display_name, sort_order) values
  ('nick', 'Nick', 1),
  ('casey', 'Casey', 2),
  ('josh', 'Josh', 3),
  ('thenushaa', 'Thenushaa', 4),
  ('yash', 'Yash', 5),
  ('jesse', 'Jesse', 6),
  ('jake', 'Jake', 7),
  ('jess', 'Jess', 8),
  ('riley', 'Riley', 9);

insert into public.fact_options (id, label, display_order) values
  ('fact-josh', 'As a kid, I was in a go kart racing league.', 1),
  ('fact-jess', 'I''ve lived in six states and counting!', 2),
  ('fact-nick', 'I did 2000 bounces on a pogo stick once.', 3),
  ('fact-yash', 'Likes to cook!', 4),
  ('fact-casey', 'I collect loose bricks.', 5),
  ('fact-riley', 'I am 6''7" tall!', 6),
  ('fact-jake', 'I have over 1500 hours on fortnite', 7),
  ('fact-thenushaa', 'I played the flute for 7 years!', 8),
  ('fact-jesse', 'I like to share tacos with friends!', 9);

insert into public.song_options (id, label, spotify_track_id, display_order) values
  ('song-yash', 'Black Out Days - Phantogram', '2IWtloZYQDcP8Ashwx8QEF', 1),
  ('song-thenushaa', 'Ring Ring Ring - Tyler, The Creator', '1lTqq0aC6r2bXLviQ3oaVt', 2),
  ('song-casey', 'Girl from the Mountain - The Ghetto Brothers', '5d0Ga3ZvRUD9hdLv189r1A', 3),
  ('song-josh', 'Sunburn - DROELOE', '7uAgqmyJ8PTRXL9WtZfPNe', 4),
  ('song-nick', 'Better Not - Louis The Child', '7n1940b6kHcaEewFSZXnXa', 5),
  ('song-jess', 'Jess''s song', '3IvTwPCCjfZczCN2k4qPiH', 6),
  ('song-riley', 'Riley''s song', '5QHytyVuaHhIVKwyBdobl1', 7),
  ('song-jake', 'Jake''s song', '12sb7bV0vxOhzZ11nQPORa', 8),
  ('song-jesse', 'Jesse''s song', '6kx7mvzmJKJmYyNGA8wehA', 9);

-- The private answer key is populated manually in Supabase SQL Editor after reset.
