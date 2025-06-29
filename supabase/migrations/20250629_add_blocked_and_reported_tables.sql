-- 20250629_add_blocked_and_reported_tables.sql
-- Crea tablas para gestión de bloqueos y reportes en mensajería

-- Tabla de usuarios bloqueados
create table if not exists blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

-- Tabla de reportes de conversaciones
create table if not exists reported_conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  reporter_id uuid not null references profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);

-- Asegura que la tabla conversations tenga el campo archived
alter table conversations add column if not exists archived boolean default false;

-- Index para búsquedas rápidas
create index if not exists idx_blocked_users_blocker on blocked_users(blocker_id);
create index if not exists idx_blocked_users_blocked on blocked_users(blocked_id);
create index if not exists idx_reported_conversations_conversation on reported_conversations(conversation_id);
