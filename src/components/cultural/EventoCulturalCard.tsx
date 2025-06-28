import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  MessageCircle, 
  Send,
  MoreHorizontal
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { getUserById } from '../../store/postStore';
import { Link } from 'react-router-dom';
import CommentThread, { CommentData } from '../shared/CommentThread';
import ReactionsBar, { ReactionData } from '../shared/ReactionsBar';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useDebounce } from 'use-debounce';
import BottomSheetModal from '../shared/BottomSheetModal';

interface EventoCulturalCardProps {
  event: {
    id: string;
    titulo: string;
    descripcion: string;
    fecha_inicio: string;
    ubicacion: string;
    imagen_url?: string;
    categoria: string;
    tipo: string;
    userId?: string; // <-- Añadido para control de edición
    metadata: {
      target_audience: string;
      responsible_person: {
        name: string;
        phone: string;
        social_media?: string;
      };
      technical_requirements: string[];
      tags: string[];
    };
  };
  onEdit?: () => void;
  disableCardNavigation?: boolean;
  onDeleted?: () => void;
}

const EventoCulturalCard: React.FC<EventoCulturalCardProps> = ({ event, onEdit, disableCardNavigation, onDeleted }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [commentUsers, setCommentUsers] = useState<Record<string, any>>({});
  const [likes, setLikes] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [debouncedMentionQuery] = useDebounce(mentionQuery, 200);
  const commentInputRef = React.useRef<HTMLTextAreaElement>(null);
  const { user } = useAuthStore();
  const isCreator = user && event.userId && user.id === event.userId;
  const isLiked = user ? likes.includes(user.id) : false;
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  React.useEffect(() => {
    // Cargar comentarios y usuarios
    const fetchComments = async () => {
      const { data } = await supabase
        .from('comentarios_evento')
        .select('*')
        .eq('evento_id', event.id)
        .order('creado_en', { ascending: true });
      setComments(data || []);
      // Cargar usuarios de los comentarios
      if (data && data.length > 0) {
        const userMap: Record<string, any> = {};
        await Promise.all(
          Array.from(new Set(data.map((c: any) => c.autor_id))).map(async (userId: string) => {
            const userData = await getUserById(userId);
            if (userData) userMap[userId] = userData;
          })
        );
        setCommentUsers(userMap);
      }
    };
    const fetchLikes = async () => {
      const { data } = await supabase
        .from('reacciones_evento')
        .select('usuario_id')
        .eq('evento_id', event.id);
      setLikes(data ? data.map((r: any) => r.usuario_id) : []);
    };
    fetchComments();
    fetchLikes();
  }, [event.id]);

  // Optimización: carga de usuarios de comentarios con cache y fallback
  React.useEffect(() => {
    if (!comments || comments.length === 0) return;
    let isMounted = true;
    const users: Record<string, any> = {};
    const ids = Array.from(new Set(comments
      .map((c: any) => c.autor_id)
      .filter(id => typeof id === 'string' && id && id !== 'undefined' && /^[0-9a-fA-F-]{36}$/.test(id))
    ));
    (async () => {
      await Promise.all(ids.map(async (id) => {
        if (!id || id === 'undefined') return;
        if (users[id]) return; // cache local
        if (user && id === user.id) {
          users[id] = user;
        } else {
          try {
            const userData = await getUserById(id);
            users[id] = userData || { name: 'Usuario', avatar_url: '/default-avatar.png' };
          } catch {
            users[id] = { name: 'Usuario', avatar_url: '/default-avatar.png' };
          }
        }
      }));
      if (isMounted) setCommentUsers(users);
    })();
    return () => { isMounted = false; };
  }, [comments, user]);

  const handleLike = async () => {
    if (!user) return;
    if (isLiked) {
      await supabase
        .from('reacciones_evento')
        .delete()
        .eq('evento_id', event.id)
        .eq('usuario_id', user.id);
      setLikes(likes.filter(id => id !== user.id));
    } else {
      await supabase
        .from('reacciones_evento')
        .insert({ evento_id: event.id, usuario_id: user.id });
      setLikes([...likes, user.id]);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    try {
      // Insertar en comentarios_evento
      const { data, error } = await supabase
        .from('comentarios_evento')
        .insert({ evento_id: event.id, autor_id: user.id, contenido: newComment.trim() })
        .select()
        .single();
      if (error) throw error;
      // Obtener datos de usuario para el nuevo comentario
      let userData = commentUsers[user.id];
      if (!userData) {
        userData = await getUserById(user.id);
        setCommentUsers(prev => ({ ...prev, [user.id]: userData }));
      }
      setComments([...comments, data]);
      setNewComment('');
    } catch (error) {
      toast.error('Error al agregar el comentario');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar este evento?')) return;
    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', event.id);
      if (error) throw error;
      toast.success('Evento eliminado exitosamente');
      if (typeof onDeleted === 'function') onDeleted();
    } catch (error) {
      toast.error('Error al eliminar el evento');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.titulo,
        text: event.descripcion,
        url: window.location.origin + '/eventos/' + event.id
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.origin + '/eventos/' + event.id);
      toast.success('¡Enlace copiado!');
    }
  };

  // Funciones para edición y borrado de comentarios
  const handleEditComment = async (commentId: string, newContent: string) => {
    try {
      await supabase.from('comentarios_evento').update({ contenido: newContent }).eq('id', commentId);
      setComments(comments.map(c => c.id === commentId ? { ...c, contenido: newContent } : c));
      toast.success('Comentario editado');
    } catch {
      toast.error('Error al editar comentario');
    }
  };
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('¿Eliminar este comentario?')) return;
    try {
      await supabase.from('comentarios_evento').delete().eq('id', commentId);
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comentario eliminado');
    } catch {
      toast.error('Error al eliminar comentario');
    }
  };

  // Permitir respuestas anidadas en comentarios de eventos
  const handleReplyComment = async (parentId: string, content: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('comentarios_evento')
        .insert({ evento_id: event.id, autor_id: user.id, contenido: content, parent_id: parentId })
        .select()
        .single();
      if (error) throw error;
      setComments([...comments, data]);
    } catch {
      toast.error('Error al responder comentario.');
    }
  };

  // Adaptar comentarios y reacciones al formato de los componentes compartidos
  const commentThreadData: CommentData[] = comments.map(c => ({
    id: c.id,
    userId: c.autor_id,
    userName: commentUsers[c.autor_id]?.name || 'Usuario',
    userAvatar: commentUsers[c.autor_id]?.avatar_url || '/default-avatar.png',
    content: c.contenido,
    createdAt: c.creado_en,
    parent_id: c.parent_id || null,
    replies: [],
    canEdit: !!(user && c.autor_id === user.id),
    canDelete: !!(user && c.autor_id === user.id)
  }));
  const reactionsData: ReactionData[] = [
    { emoji: '❤️', count: likes.length, reacted: isLiked, id: event.id }, // id de la reacción = id del evento
    // TODO: mapear otros tipos de reacciones si existen
  ];

  // Buscar usuarios para autocompletado de menciones
  React.useEffect(() => {
    if (!debouncedMentionQuery) {
      setMentionResults([]);
      return;
    }
    (async () => {
      const { data: users } = await supabase
        .from('usuarios')
        .select('id, nombre_usuario, nombre_completo, avatar_url')
        .ilike('nombre_usuario', `%${debouncedMentionQuery}%`)
        .limit(5);
      setMentionResults(users || []);
    })();
  }, [debouncedMentionQuery]);

  // Detectar @ para autocompletado
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);
    const match = value.match(/@([\w\d_]{2,})$/);
    if (match) {
      setMentionQuery(match[1]);
      setShowMentionList(true);
    } else {
      setShowMentionList(false);
    }
  };

  // Insertar mención seleccionada
  const handleMentionSelect = (user: any) => {
    const regex = /@([\w\d_]{2,})$/;
    const match = newComment.match(regex);
    if (!match) return;
    const before = newComment.slice(0, match.index);
    setNewComment(before + '@' + user.nombre_usuario + ' ');
    setShowMentionList(false);
    setMentionQuery('');
    setTimeout(() => {
      if (commentInputRef.current) commentInputRef.current.focus();
    }, 0);
  };

  const handleEmojiSelect = (emoji: any) => {
    if (commentInputRef.current) {
      const input = commentInputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue =
        newComment.slice(0, start) +
        (emoji.native || emoji.skins?.[0]?.native || '') +
        newComment.slice(end);
      setNewComment(newValue);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + 2, start + 2);
      }, 0);
    } else {
      setNewComment(newComment + (emoji.native || emoji.skins?.[0]?.native || ''));
    }
    setShowEmojiPicker(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-lg shadow-md overflow-hidden mb-6 mx-0 sm:mx-auto">
      <div className="relative w-full flex justify-center items-center" style={{ minHeight: '120px', maxHeight: '80vh', background: 'transparent' }}>
        <img
          src={event.imagen_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'}
          alt={event.titulo}
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '470px',
            maxHeight: '80vh',
            objectFit: 'contain',
            border: 'none',
            borderRadius: 0,
            background: 'transparent',
            display: 'block',
            margin: 0,
            padding: 0
          }}
        />
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {event.titulo}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {event.descripcion}
            </p>
          </div>
          <div className="flex space-x-2 relative">
            <button
              type="button"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline focus:ring-2 focus:ring-primary-500"
              onClick={e => { e.stopPropagation(); setShowMenu((v) => !v); }}
              aria-label="Abrir menú de opciones del evento"
              data-menu="evento-menu"
            >
              <MoreHorizontal className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
            {showMenu && (
              <div
                className="absolute right-0 top-10 z-50 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 min-w-[180px] animate-fade-in"
              >
                <ul className="py-2">
                  <li>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => {navigator.clipboard.writeText(window.location.origin + '/eventos/' + event.id); setShowMenu(false); toast.success('¡Enlace copiado!')}} aria-label="Copiar enlace del evento">
                      Guardar enlace
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={handleShare} aria-label="Compartir evento">
                      Compartir evento
                    </button>
                  </li>
                  {isCreator && (
                    <>
                      <li>
                        <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => { setShowMenu(false); onEdit && onEdit(); }} aria-label="Editar evento">
                          Editar evento
                        </button>
                      </li>
                      <li>
                        <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-800" onClick={async () => { await handleDelete(); setShowMenu(false); }} aria-label="Eliminar evento">
                          Eliminar evento
                        </button>
                      </li>
                    </>
                  )}
                  <li>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={e => { e.stopPropagation(); setShowMenu(false); }} aria-label="Cerrar menú de opciones">
                      Cancelar
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Fecha y categoría */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">
            {event.categoria || event.categoria}
          </span>
          <span className="mx-2">•</span>
          {disableCardNavigation ? (
            <span><span className="sr-only">Fecha:</span> {format(new Date(event.fecha_inicio), 'dd MMM yyyy', { locale: es })}</span>
          ) : (
            <Link to={`/eventos/${event.id}`} className="group hover:underline">
              <span><span className="sr-only">Fecha:</span> {format(new Date(event.fecha_inicio), 'dd MMM yyyy', { locale: es })}</span>
            </Link>
          )}
        </div>

        {/* Reacciones y comentarios */}
        <div className="flex items-center space-x-6 mb-4">
          <ReactionsBar reactions={reactionsData} onReact={handleLike} reactionKind="evento" />
          <button
            className="flex items-center gap-1 text-gray-500 hover:text-primary-600 text-sm font-medium focus:outline-none"
            onClick={() => {
              setShowCommentsModal(true);
            }}
            aria-label="Mostrar comentarios"
            type="button"
          >
            <MessageCircle className="w-5 h-5" />
            {comments.length > 0 && (
              <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5">{comments.length}</span>
            )}
          </button>
        </div>
        {/* Modal de comentarios universal (móvil y escritorio) */}
        {(isMobile || !isMobile) && (
          <BottomSheetModal
            open={showCommentsModal}
            onClose={() => setShowCommentsModal(false)}
            title="Comentarios"
            height={isMobile ? '80vh' : '70vh'}
            desktopMode={!isMobile}
          >
            <CommentThread
              comments={commentThreadData}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              onReply={handleReplyComment}
            />
            {user && (
              <form onSubmit={handleAddComment} className="mt-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <img
                      src={user.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || '')}
                      alt={user.displayName || 'Usuario'}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <textarea
                      ref={commentInputRef}
                      value={newComment}
                      onChange={handleTextareaChange}
                      className="w-full p-3 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                      rows={2}
                      placeholder="Escribe un comentario..."
                      aria-label="Escribe un comentario"
                    />
                    {/* Lista de menciones */}
                    {showMentionList && mentionResults.length > 0 && (
                      <div className="absolute z-50 bottom-12 left-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-64 max-h-60 overflow-y-auto">
                        {mentionResults.map(user => (
                          <button
                            key={user.id}
                            className="flex items-center w-full px-3 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 gap-2 text-left"
                            onClick={() => handleMentionSelect(user)}
                            type="button"
                          >
                            <img src={user.avatar_url || '/default-avatar.png'} alt={user.nombre_usuario} className="w-6 h-6 rounded-full" />
                            <span className="font-medium">@{user.nombre_usuario}</span>
                            <span className="text-xs text-gray-400 ml-2">{user.nombre_completo}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setShowEmojiPicker((v) => !v)}
                      aria-label="Insertar emoji"
                      tabIndex={-1}
                    >
                      <span role="img" aria-label="emoji">😊</span>
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      aria-label="Agregar comentario"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute z-50 bottom-12 right-0">
                        <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="auto" />
                      </div>
                    )}
                  </div>
                </div>
              </form>
            )}
          </BottomSheetModal>
        )}
      </div>
    </div>
  );
};

export default EventoCulturalCard;