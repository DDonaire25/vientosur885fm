-- 20250629_full_messaging_system.sql
-- Migración robusta para sistema de mensajería completo y seguro
-- Cubre: conversaciones, participantes, mensajes, bloqueos, reportes, archivado, RLS, triggers, índices

-- Extensiones necesarias
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Tabla de conversaciones
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_message_at timestamptz,
  is_group boolean default false,
  name text,
  avatar_url text,
  archived boolean default false
);

-- Tabla de participantes
create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  is_admin boolean default false,
  unique(conversation_id, user_id)
);

-- Tabla de mensajes
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_deleted boolean default false,
  type text default 'text',
  metadata jsonb
);

-- Tabla de usuarios bloqueados
create table if not exists public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid references public.profiles(id) on delete cascade,
  blocked_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Prevención: agrega columnas si no existen (por si la tabla existe sin columnas)
alter table public.blocked_users add column if not exists blocker_id uuid references public.profiles(id) on delete cascade;
alter table public.blocked_users add column if not exists blocked_id uuid references public.profiles(id) on delete cascade;
alter table public.blocked_users add column if not exists created_at timestamptz not null default now();

-- Prevención: constraint único para bloqueos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'blocked_users_unique'
  ) THEN
    ALTER TABLE public.blocked_users ADD CONSTRAINT blocked_users_unique UNIQUE (blocker_id, blocked_id);
  END IF;
END$$;

-- Tabla de reportes de conversaciones
create table if not exists public.reported_conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);

-- Índices para performance
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_conversation_participants_user_id on public.conversation_participants(user_id);
create index if not exists idx_conversations_last_message_at on public.conversations(last_message_at);
create index if not exists idx_blocked_users_blocker on public.blocked_users(blocker_id);
create index if not exists idx_blocked_users_blocked on public.blocked_users(blocked_id);
create index if not exists idx_reported_conversations_conversation on public.reported_conversations(conversation_id);

-- Políticas de Row Level Security (RLS)
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.blocked_users enable row level security;
alter table public.reported_conversations enable row level security;

-- Solo los participantes pueden ver mensajes y conversaciones
-- Políticas: eliminar si existen y crear de nuevo

drop policy if exists "Participants can select their conversations" on public.conversations;
create policy "Participants can select their conversations" on public.conversations
  for select using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversations.id and cp.user_id = auth.uid()
  ));

drop policy if exists "Participants can select their messages" on public.messages;
create policy "Participants can select their messages" on public.messages
  for select using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
  ));

drop policy if exists "Participants can select their participation" on public.conversation_participants;
create policy "Participants can select their participation" on public.conversation_participants
  for select using (user_id = auth.uid());

drop policy if exists "Participants can insert messages" on public.messages;
create policy "Participants can insert messages" on public.messages
  for insert with check (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
  ));

drop policy if exists "User can insert their own participation" on public.conversation_participants;
create policy "User can insert their own participation" on public.conversation_participants
  for insert with check (user_id = auth.uid());

drop policy if exists "Authenticated can insert conversation" on public.conversations;
create policy "Authenticated can insert conversation" on public.conversations
  for insert with check (auth.uid() is not null);

-- Políticas para bloqueos y reportes
drop policy if exists "Users can manage their own blocks" on public.blocked_users;
create policy "Users can manage their own blocks" on public.blocked_users
  for all using (blocker_id = auth.uid() or blocked_id = auth.uid());

drop policy if exists "Users can report conversaciones" on public.reported_conversations;
create policy "Users can report conversaciones" on public.reported_conversations
  for all using (reporter_id = auth.uid());

-- Trigger para updated_at en conversations
create or replace function public.update_conversation_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_conversation_updated_at on public.conversations;
create trigger set_conversation_updated_at
  before update on public.conversations
  for each row execute procedure public.update_conversation_updated_at();

-- Prevención: agrega columnas si no existen
alter table public.conversations add column if not exists archived boolean default false;

-- Fin de migración robusta de mensajería
