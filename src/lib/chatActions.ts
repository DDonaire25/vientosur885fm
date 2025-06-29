import { supabase } from './supabase';

// Tabla: blocked_users
// Campos: id, blocker_id, blocked_id, created_at

export async function blockUser(blockerId: string, blockedId: string) {
  const { data, error } = await supabase
    .from('blocked_users')
    .insert([{ blocker_id: blockerId, blocked_id: blockedId }]);
  if (error) throw error;
  return data;
}

// Tabla: reported_conversations
// Campos: id, conversation_id, reporter_id, reason, created_at

export async function reportConversation(conversationId: string, reporterId: string, reason: string) {
  const { data, error } = await supabase
    .from('reported_conversations')
    .insert([{ conversation_id: conversationId, reporter_id: reporterId, reason }]);
  if (error) throw error;
  return data;
}
