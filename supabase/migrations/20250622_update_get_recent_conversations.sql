-- Supabase SQL: get_recent_conversations con unread_count y last_active
-- Devuelve las conversaciones recientes (1 a 1) de un usuario, con el último mensaje, cantidad de mensajes no leídos y estado de actividad

drop function if exists get_recent_conversations(uuid);

-- Asegura que la columna last_active exista antes de crear la función
alter table usuarios add column if not exists last_active timestamptz;

create or replace function get_recent_conversations(user_id uuid)
returns table (
  other_user_id uuid,
  nombre_usuario text,
  nombre_completo text,
  avatar_url text,
  last_message text,
  last_time timestamptz,
  unread_count integer,
  last_active timestamptz
) as $$
  select
    case
      when m.sender_id = user_id then m.receiver_id
      else m.sender_id
    end as other_user_id,
    u.nombre_usuario,
    u.nombre_completo,
    u.avatar_url,
    m.content as last_message,
    m.created_at as last_time,
    (
      select count(*) from messages
      where sender_id = case when m.sender_id = user_id then m.receiver_id else m.sender_id end
        and receiver_id = user_id
        and read = false
    ) as unread_count,
    u.last_active
  from (
    select distinct on (
      least(sender_id, receiver_id), greatest(sender_id, receiver_id)
    ) *
    from messages
    where sender_id = user_id or receiver_id = user_id
    order by least(sender_id, receiver_id), greatest(sender_id, receiver_id), created_at desc
  ) m
  join usuarios u on u.id = case when m.sender_id = user_id then m.receiver_id else m.sender_id end
  order by m.created_at desc;
$$ language sql stable;
