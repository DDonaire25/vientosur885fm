-- MIGRACIÓN: Crear tabla reacciones_comentario_post para permitir reacciones (likes) en comentarios de posts

create table if not exists public.reacciones_comentario_post (
  id uuid default gen_random_uuid() primary key,
  comentario_id uuid references public.comentarios_post(id) on delete cascade not null,
  usuario_id uuid references public.usuarios(id) on delete cascade not null,
  tipo text not null check (tipo in ('like')),
  creado_en timestamp with time zone default timezone('utc'::text, now()),
  constraint unique_comentario_like unique (comentario_id, usuario_id, tipo)
);

-- Índice para consultas rápidas por comentario y usuario
create index if not exists reacciones_comentario_post_comentario_id_idx on public.reacciones_comentario_post(comentario_id);
create index if not exists reacciones_comentario_post_usuario_id_idx on public.reacciones_comentario_post(usuario_id);

-- Políticas de seguridad para RLS
alter table public.reacciones_comentario_post enable row level security;
drop policy if exists "Ver reacciones comentario post" on public.reacciones_comentario_post;
drop policy if exists "Insertar reacciones propias comentario post" on public.reacciones_comentario_post;
drop policy if exists "Borrar reacciones propias comentario post" on public.reacciones_comentario_post;
create policy "Ver reacciones comentario post" on public.reacciones_comentario_post for select using (true);
create policy "Insertar reacciones propias comentario post" on public.reacciones_comentario_post for insert with check (auth.uid() = usuario_id);
create policy "Borrar reacciones propias comentario post" on public.reacciones_comentario_post for delete using (auth.uid() = usuario_id);
