-- Supabase SQL: función para obtener conversaciones recientes de un usuario
-- Devuelve: id del otro usuario, nombre, avatar, último mensaje, fecha, cantidad no leídos, estado online
create or replace function public.get_recent_conversations(user_id uuid)
returns table (
  other_user_id uuid,
  nombre_usuario text,
  nombre_completo text,
  avatar_url text,
  last_message text,
  last_time timestamp with time zone,
  unread_count integer,
  last_active timestamp with time zone
) as $$
begin
  return query
  select
    case when m.sender_id = user_id then m.receiver_id else m.sender_id end as other_user_id,
    u.nombre_usuario,
    u.nombre_completo,
    u.avatar_url,
    m.content as last_message,
    m.created_at as last_time,
    (
      select count(*) from public.messages m2
      where m2.sender_id = case when m.sender_id = user_id then m.receiver_id else m.sender_id end
        and m2.receiver_id = user_id
        and coalesce(m2.read, false) = false
    ) as unread_count,
    u.last_active
  from (
    select distinct on (least(sender_id, receiver_id), greatest(sender_id, receiver_id)) *
    from public.messages
    where sender_id = user_id or receiver_id = user_id
    order by least(sender_id, receiver_id), greatest(sender_id, receiver_id), created_at desc
  ) m
  join public.usuarios u on u.id = case when m.sender_id = user_id then m.receiver_id else m.sender_id end
  order by m.created_at desc;
end;
$$ language plpgsql stable;
