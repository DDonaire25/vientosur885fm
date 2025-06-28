import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface RecentConversation {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  isOnline: boolean;
}

export function useRecentConversations(currentUserId: string) {
  const [conversations, setConversations] = useState<RecentConversation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_recent_conversations', { user_id: currentUserId });
    if (!error && data) setConversations(
      data.map((c: any) => ({
        id: c.other_user_id,
        username: c.nombre_usuario,
        displayName: c.nombre_completo || c.nombre_usuario,
        avatar: c.avatar_url,
        lastMessage: c.last_message,
        lastTime: c.last_time,
        unreadCount: c.unread_count || 0,
        isOnline: c.last_active && (new Date().getTime() - new Date(c.last_active).getTime() < 2 * 60 * 1000),
      }))
    );
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) fetchConversations();
  }, [currentUserId, fetchConversations]);

  return { conversations, loading, fetchConversations };
}
