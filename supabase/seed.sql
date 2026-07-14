with seed_users (id, email) as (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'nick@integrativeprivacy.com'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'jesse@integrativeprivacy.com'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'josh@integrativeprivacy.com'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'jake@integrativeprivacy.com'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'jess@integrativeprivacy.com'),
    ('10000000-0000-4000-8000-000000000007'::uuid, 'thenushaa@integrativeprivacy.com'),
    ('10000000-0000-4000-8000-000000000008'::uuid, 'riley@integrativeprivacy.com'),
    ('10000000-0000-4000-8000-000000000009'::uuid, 'yash@integrativeprivacy.com'),
    ('10000000-0000-4000-8000-000000000010'::uuid, 'casey@integrativeprivacy.com')
)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'authenticated',
  'authenticated',
  email,
  extensions.crypt('Fanfare4-Utopia7-Uneaten2-Negligee9', extensions.gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
from seed_users
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

with seed_users (id, email) as (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'nick@integrativeprivacy.com'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'jesse@integrativeprivacy.com'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'josh@integrativeprivacy.com'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'jake@integrativeprivacy.com'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'jess@integrativeprivacy.com'),
    ('10000000-0000-4000-8000-000000000007'::uuid, 'thenushaa@integrativeprivacy.com'),
    ('10000000-0000-4000-8000-000000000008'::uuid, 'riley@integrativeprivacy.com'),
    ('10000000-0000-4000-8000-000000000009'::uuid, 'yash@integrativeprivacy.com'),
    ('10000000-0000-4000-8000-000000000010'::uuid, 'casey@integrativeprivacy.com')
)
insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  id,
  id,
  id::text,
  jsonb_build_object(
    'sub', id::text,
    'email', email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now(),
  now()
from seed_users
on conflict (provider_id, provider) do update set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = now();
