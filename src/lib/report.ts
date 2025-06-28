import { supabase } from './supabase';

export async function reportContent({
  type,
  contentId,
  reason,
  userId,
  reactionKind
}: {
  type: 'comment' | 'reaction';
  contentId: string;
  reason: string;
  userId: string;
  reactionKind?: 'post' | 'blog' | 'evento' | 'cumpleanos';
}) {
  if (type === 'reaction') {
    // Reportar reacción según el tipo
    let insertObj: any = {
      user_id: userId,
      reason,
      created_at: new Date().toISOString()
    };
    if (reactionKind === 'post') insertObj.reaccion_post_id = contentId;
    else if (reactionKind === 'blog') insertObj.reaccion_blog_id = contentId;
    else if (reactionKind === 'evento') insertObj.reaccion_evento_id = contentId;
    else if (reactionKind === 'cumpleanos') insertObj.reaccion_cumpleanos_id = contentId;
    else throw new Error('reactionKind requerido para reportar reacción');
    return supabase.from('reaction_reports').insert(insertObj);
  }
  // Comentarios: tabla legacy o actual
  return supabase.from('reportes').insert({
    tipo: type,
    contenido_id: contentId,
    motivo: reason,
    usuario_id: userId,
    creado_en: new Date().toISOString()
  });
}

