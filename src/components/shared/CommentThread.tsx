import React, { useState, useEffect } from 'react';
import { reportContent } from '../../lib/report';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import ReactTimeAgo from 'react-time-ago';
import TimeAgo from 'javascript-time-ago';
import es from 'javascript-time-ago/locale/es.json';

TimeAgo.addDefaultLocale(es);

// Tipos base para comentarios anidados
export interface CommentData {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  replies?: CommentData[];
  canEdit?: boolean;
  canDelete?: boolean;
}

interface CommentThreadProps {
  comments: CommentData[];
  onReply?: (parentId: string, content: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
}

// Mejoras móviles y responsivas en el hilo de comentarios
// - Inputs y botones más grandes y cómodos
// - Espaciado y scroll adecuado
// - Evita desbordes horizontales
// - Mejora visual para pantallas pequeñas
const CommentThread: React.FC<CommentThreadProps> = ({ comments, onReply, onEdit, onDelete }) => {
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<string[]>([]);
  const [recentlyDeletedId, setRecentlyDeletedId] = useState<string | null>(null);
  const user = useAuthStore.getState().user;
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [customReportReason, setCustomReportReason] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Detectar comentarios nuevos para animación
  useEffect(() => {
    if (comments.length === 0) return;
    const ids = comments.map(c => c.id);
    setRecentlyAddedIds(ids.slice(-3)); // Resalta los 3 últimos (ajustable)
  }, [comments]);

  // Función para renderizar comentarios recursivamente
  const renderComments = (comments: CommentData[], parentId: string | null = null, level = 0) => {
    return comments
      .filter(c => (c as any).parent_id === parentId)
      .map(comment => (
        <div
          key={comment.id}
          className={`group flex items-start gap-3 py-3 px-1 sm:px-3 transition-all duration-200 relative
            ${level > 0 ? 'ml-6 border-l-2 border-gray-100 dark:border-gray-800 pl-4' : ''}
            ${recentlyAddedIds.includes(comment.id) ? 'bg-primary-50/40 dark:bg-primary-900/10' : ''}
            ${recentlyDeletedId === comment.id ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}
          style={{
            opacity: recentlyDeletedId === comment.id ? 0 : 1,
            transform: recentlyDeletedId === comment.id ? 'scale(0.98)' : 'scale(1)'
          }}
        >
          <img src={comment.userAvatar || '/default-avatar.png'} alt={comment.userName} className="w-10 h-10 rounded-full object-cover bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{comment.userName}</span>
              <span className="text-xs text-gray-400">
                <ReactTimeAgo date={new Date(comment.createdAt)} locale="es" timeStyle="twitter" />
              </span>
            </div>
            <div className="text-[15px] text-gray-800 dark:text-gray-200 leading-snug break-words">
              {editingId === comment.id ? (
                <div className="flex gap-2 items-center flex-wrap mt-1">
                  <input
                    className="flex-1 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 text-sm min-w-0 max-w-full bg-gray-50 dark:bg-gray-900 focus:ring-1 focus:ring-primary-200 dark:focus:ring-primary-800"
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    maxLength={300}
                    style={{ minWidth: 0 }}
                  />
                  <button className="text-xs text-primary-700 dark:text-primary-300 hover:underline px-2 py-1 rounded" onClick={() => handleEditSave(comment)}>Guardar</button>
                  <button className="text-xs text-gray-400 hover:underline px-2 py-1 rounded" onClick={handleEditCancel}>Cancelar</button>
                </div>
              ) : (
                <span>{comment.content}</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
              {onReply && (
                <button title="Responder" className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 px-1 py-0.5 rounded transition-colors" onClick={() => setReplyingId(comment.id)}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="1.5" d="M7 8.5V6.8A2.8 2.8 0 0 1 9.8 4h7.4A2.8 2.8 0 0 1 20 6.8v10.4a2.8 2.8 0 0 1-2.8 2.8H9.8A2.8 2.8 0 0 1 7 17.2v-1.7"/><path stroke="currentColor" strokeWidth="1.5" d="M7 12h8m0 0-2.5-2.5M15 12l-2.5 2.5"/></svg>
                  Responder
                </button>
              )}
              {comment.canEdit && (
                <button title="Editar" className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 px-1 py-0.5 rounded transition-colors" onClick={() => handleEdit(comment)}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="1.5" d="M16.475 5.408a2.3 2.3 0 1 1 3.253 3.253L8.5 19.889l-4.243.99.99-4.243 11.228-11.228Z"/></svg>
                  Editar
                </button>
              )}
              {comment.canDelete && (
                <button title="Eliminar" className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 px-1 py-0.5 rounded transition-colors" onClick={() => handleDeleteWithAnimation(comment.id)}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="1.5" d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12Z"/></svg>
                  Eliminar
                </button>
              )}
              <button title="Reportar" className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 px-1 py-0.5 rounded transition-colors" onClick={() => setReportingId(comment.id)}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="1.5" d="M12 9v4m0 4h.01M21 19H3a1 1 0 0 1-.894-1.447l9-16a1 1 0 0 1 1.788 0l9 16A1 1 0 0 1 21 19Z"/></svg>
                Reportar
              </button>
            </div>
            {/* Formulario de respuesta */}
            {replyingId === comment.id && (
              <form className="mt-2 flex gap-2 flex-wrap" onSubmit={e => {
                e.preventDefault();
                if (onReply && replyText.trim()) {
                  if (replyText.length < 3) {
                    toast.error('El comentario es demasiado corto.');
                    return;
                  }
                  if (isOffensive(replyText)) {
                    toast.error('El comentario contiene palabras no permitidas.');
                    return;
                  }
                  onReply(comment.id, replyText.trim());
                  setReplyText('');
                  setReplyingId(null);
                }
              }}>
                <input
                  className="flex-1 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 text-sm min-w-0 max-w-full bg-gray-50 dark:bg-gray-900 focus:ring-1 focus:ring-primary-200 dark:focus:ring-primary-800"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  maxLength={300}
                  placeholder="Escribe una respuesta..."
                  style={{ minWidth: 0 }}
                />
                <button type="submit" className="text-xs text-primary-700 dark:text-primary-300 hover:underline px-2 py-1 rounded">Publicar</button>
                <button type="button" className="text-xs text-gray-400 hover:underline px-2 py-1 rounded" onClick={() => setReplyingId(null)}>Cancelar</button>
              </form>
            )}
            {/* Modal de reporte */}
            {reportingId === comment.id && (
              <div className="mt-2 p-2 border border-gray-200 dark:border-gray-800 rounded bg-orange-50/40 dark:bg-orange-900/10">
                <div className="mb-2 text-xs">Motivo del reporte:</div>
                <select
                  className="border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs w-full mb-2 bg-transparent"
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                >
                  <option value="">Selecciona un motivo</option>
                  {REPORT_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {reportReason === 'Otro' && (
                  <input
                    className="border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs w-full mb-2 bg-transparent"
                    value={customReportReason}
                    onChange={e => setCustomReportReason(e.target.value)}
                    placeholder="Describe el motivo (opcional)"
                    maxLength={200}
                  />
                )}
                <div className="flex gap-2">
                  <button className="text-xs text-orange-600 hover:text-orange-800 font-normal py-1 px-2 rounded bg-transparent" onClick={() => handleReport(comment.id)} disabled={!reportReason || (reportReason === 'Otro' && !customReportReason.trim())}>Enviar</button>
                  <button className="text-xs text-gray-400 hover:underline py-1 px-2 rounded" onClick={() => setReportingId(null)}>Cancelar</button>
                </div>
              </div>
            )}
            {/* Renderizar respuestas recursivamente */}
            {renderComments(comments, comment.id, level + 1)}
          </div>
        </div>
      ));
  };

  const handleEdit = (comment: CommentData) => {
    setEditingId(comment.id);
    setEditingText(comment.content);
  };
  const handleEditSave = (comment: CommentData) => {
    if (onEdit && editingText.trim()) {
      if (editingText.length < 3) {
        toast.error('El comentario es demasiado corto.');
        return;
      }
      if (isOffensive(editingText)) {
        toast.error('El comentario contiene palabras no permitidas.');
        return;
      }
      onEdit(comment.id, editingText.trim());
      setEditingId(null);
      setEditingText('');
    }
  };
  const handleEditCancel = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleDeleteWithAnimation = (commentId: string) => {
    setRecentlyDeletedId(commentId);
    setTimeout(() => {
      if (onDelete) onDelete(commentId);
      setRecentlyDeletedId(null);
    }, 350); // Duración de la animación
  };

  const handleReport = async (commentId: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para reportar.');
      return;
    }
    if (!reportReason.trim()) {
      toast.error('Indica el motivo del reporte.');
      return;
    }
    await reportContent({
      type: 'comment',
      contentId: commentId,
      reason: reportReason,
      userId: user.id
    });
    toast.success('Comentario reportado. ¡Gracias por tu ayuda!');
    setReportingId(null);
    setReportReason('');
    setCustomReportReason('');
  };

  // Lista simple de palabras prohibidas (puedes ampliar)
  const BAD_WORDS = ['tonto', 'idiota', 'estúpido', 'imbécil', 'puta', 'mierda', 'spam', 'http://', 'https://'];
  function isOffensive(text: string) {
    const lower = text.toLowerCase();
    return BAD_WORDS.some(w => lower.includes(w));
  }

  const REPORT_REASONS = [
    'Incitación al odio',
    'Mentira o información falsa',
    'Ofensivo',
    'Spam',
    'Otro'
  ];

  return <div className="divide-y divide-gray-100 dark:divide-gray-900">{renderComments(comments)}</div>;
};

export default CommentThread;
