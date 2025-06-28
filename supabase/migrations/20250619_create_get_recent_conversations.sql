-- Supabase SQL: get_recent_conversations
-- Devuelve las conversaciones recientes (1 a 1) de un usuario, con el último mensaje de cada una

create or replace function get_recent_conversations(user_id uuid)
returns table (
  other_user_id uuid,
  nombre_usuario text,
  nombre_completo text,
  avatar_url text,
  last_message text,
  last_time timestamptz
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
    m.created_at as last_time
  from (
    select distinct on (
      least(sender_id, receiver_id), greatest(sender_id, receiver_id)
    ) *
    from messages
    where sender_id = user_id or receiver_id = user_id
    order by least(sender_id, receiver_id), greatest(sender_id, receiver_id), created_at desc
  ) m
  join usuarios u on u.id = case
    when m.sender_id = user_id then m.receiver_id
    else m.sender_id
  end
  order by m.created_at desc;
$$ language sql stable;
