-- Migración: Crear tablas para mensajería (conversaciones y mensajes)
-- Fecha: 2025-06-28

-- Tabla de conversaciones
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  last_message_at timestamp with time zone,
  is_group boolean default false,
  name text,
  avatar_url text
);

-- Tabla de participantes de la conversación
create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamp with time zone default now(),
  is_admin boolean default false,
  unique(conversation_id, user_id)
);

-- Tabla de mensajes
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  content text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  is_deleted boolean default false,
  type text default 'text', -- 'text', 'image', 'file', etc.
  metadata jsonb
);

-- Índices para performance
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_conversation_participants_user_id on public.conversation_participants(user_id);
create index if not exists idx_conversations_last_message_at on public.conversations(last_message_at);

-- Políticas de Row Level Security (RLS)
-- Solo los participantes pueden ver mensajes y conversaciones
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

create policy "Participants can select their conversations" on public.conversations
  for select using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversations.id and cp.user_id = auth.uid()
  ));

create policy "Participants can select their messages" on public.messages
  for select using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
  ));

create policy "Participants can select their participation" on public.conversation_participants
  for select using (user_id = auth.uid());

-- Permitir insertar mensajes solo a participantes
create policy "Participants can insert messages" on public.messages
  for insert with check (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()
  ));

-- Permitir insertar participación solo al propio usuario
create policy "User can insert their own participation" on public.conversation_participants
  for insert with check (user_id = auth.uid());

-- Permitir crear conversación a cualquier usuario autenticado
create policy "Authenticated can insert conversation" on public.conversations
  for insert with check (auth.uid() is not null);

-- Actualizar updated_at automáticamente
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
