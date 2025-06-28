import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Cake, Mail, Phone, MoreHorizontal, MessageCircle, Send } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import CreateBirthdayForm from './CreateBirthdayForm';
import CommentThread, { CommentData } from '../shared/CommentThread';
import ReactionsBar, { ReactionData } from '../shared/ReactionsBar';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useDebounce } from 'use-debounce';
import BottomSheetModal from '../shared/BottomSheetModal';



interface CumpleañosCardProps {
  birthday: {
    id: string;
    nombre: string;
    fecha_nacimiento: string;
    imagen_url?: string;
    // Campos opcionales para compatibilidad con el formulario
    usuario_id?: string;
    mensaje?: string;
    multimedia_url?: string;
    // Los siguientes pueden ser opcionales
    disciplina?: string;
    rol?: string;
    email?: string;
    telefono?: string;
    trayectoria?: string;
  };
  onEdit?: (cumpleActualizado: any) => void;
  onDeleted?: () => void;
}

const CumpleañosCard: React.FC<CumpleañosCardProps> = ({ birthday, onEdit, onDeleted }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentUsers, setCommentUsers] = useState<Record<string, any>>({});
  const [likes, setLikes] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [debouncedMentionQuery] = useDebounce(mentionQuery, 200);
  const commentInputRef = React.useRef<HTMLTextAreaElement>(null);
  const { user } = useAuthStore();
  const isLiked = user ? likes.includes(user.id) : false;
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const isToday = (date: string) => {
    const today = new Date();
    const birthDate = new Date(date);
    return birthDate.getDate() === today.getDate() && 
           birthDate.getMonth() === today.getMonth();
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar este cumpleaños?')) return;

    try {
      const { error } = await supabase
        .from('cumpleanos')
        .delete()
        .eq('id', birthday.id);

      if (error) throw error;
      toast.success('Cumpleaños eliminado exitosamente');
      if (typeof onDeleted === 'function') onDeleted();
    } catch (error) {
      console.error('Error al eliminar cumpleaños:', error);
      toast.error('Error al eliminar el cumpleaños');
    }
  };

  // Handler para compartir cumpleaños
  const handleShare = () => {
    const url = window.location.origin + '/cumpleanos/' + birthday.id;
    const title = `Cumpleaños de ${birthday.nombre}`;
    const text = `¡Feliz cumpleaños a ${birthday.nombre}! (${birthday.rol})`;
    if (navigator.share) {
      navigator.share({ title, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('¡Enlace copiado!');
    }
  };

  React.useEffect(() => {
    // Cargar comentarios y usuarios
    const fetchComments = async () => {
      const { data } = await supabase
        .from('comentarios_cumpleanos')
        .select('*')
        .eq('cumpleanos_id', birthday.id)
        .order('creado_en', { ascending: true });
      setComments(data || []);
      // Cargar usuarios de los comentarios
      if (data && data.length > 0) {
        const userMap: Record<string, any> = {};
        await Promise.all(
          Array.from(new Set(data.map((c: any) => c.autor_id))).map(async (userId: string) => {
            const { data: userData } = await supabase.from('usuarios').select('id, nombre_completo, avatar_url').eq('id', userId).single();
            if (userData) userMap[userId] = userData;
          })
        );
        setCommentUsers(userMap);
      }
    };
    const fetchLikes = async () => {
      const { data } = await supabase
        .from('reacciones_cumpleanos')
        .select('usuario_id')
        .eq('cumpleanos_id', birthday.id);
      setLikes(data ? data.map((r: any) => r.usuario_id) : []);
    };
    fetchComments();
    fetchLikes();
  }, [birthday.id]);

  // Autocompletado de menciones
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

  // Like/reacción principal
  const handleLike = async () => {
    if (!user) return;
    if (isLiked) {
      await supabase
        .from('reacciones_cumpleanos')
        .delete()
        .eq('cumpleanos_id', birthday.id)
        .eq('usuario_id', user.id);
      setLikes(likes.filter(id => id !== user.id));
    } else {
      await supabase
        .from('reacciones_cumpleanos')
        .insert({ cumpleanos_id: birthday.id, usuario_id: user.id });
      setLikes([...likes, user.id]);
    }
  };

  // Agregar comentario
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    try {
      const { data, error } = await supabase
        .from('comentarios_cumpleanos')
        .insert({ cumpleanos_id: birthday.id, autor_id: user.id, contenido: newComment.trim() })
        .select()
        .single();
      if (error) throw error;
      let userData = commentUsers[user.id];
      if (!userData) {
        const { data: u } = await supabase.from('usuarios').select('id, nombre_completo, avatar_url').eq('id', user.id).single();
        userData = u;
        setCommentUsers(prev => ({ ...prev, [user.id]: userData }));
      }
      setComments([...comments, data]);
      setNewComment('');
    } catch (error) {
      toast.error('Error al agregar el comentario');
    }
  };

  // Editar comentario
  const handleEditComment = async (commentId: string, newContent: string) => {
    try {
      await supabase.from('comentarios_cumpleanos').update({ contenido: newContent }).eq('id', commentId);
      setComments(comments.map(c => c.id === commentId ? { ...c, contenido: newContent } : c));
      toast.success('Comentario editado');
    } catch {
      toast.error('Error al editar comentario');
    }
  };
  // Borrar comentario
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('¿Eliminar este comentario?')) return;
    try {
      await supabase.from('comentarios_cumpleanos').delete().eq('id', commentId);
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comentario eliminado');
    } catch {
      toast.error('Error al eliminar comentario');
    }
  };
  // Responder comentario
  const handleReplyComment = async (parentId: string, content: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('comentarios_cumpleanos')
        .insert({ cumpleanos_id: birthday.id, autor_id: user.id, contenido: content, parent_id: parentId })
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
    userName: commentUsers[c.autor_id]?.nombre_completo || 'Usuario',
    userAvatar: commentUsers[c.autor_id]?.avatar_url || '/default-avatar.png',
    content: c.contenido,
    createdAt: c.creado_en,
    parent_id: c.parent_id || null,
    replies: [],
    canEdit: !!(user && c.autor_id === user.id),
    canDelete: !!(user && c.autor_id === user.id)
  }));
  const reactionsData: ReactionData[] = [
    { emoji: '❤️', count: likes.length, reacted: isLiked, id: birthday.id },
    // Puedes añadir más tipos de reacciones si lo deseas
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${isToday(birthday.fecha_nacimiento) ? 'ring-2 ring-pink-500' : ''}`}>
      {editMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setEditMode(false)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <CreateBirthdayForm
              onSuccess={(cumpleActualizado) => { setEditMode(false); if (typeof onEdit === 'function') onEdit(cumpleActualizado); }}
              onCancel={() => setEditMode(false)}
              initialData={birthday}
            />
          </div>
        </div>
      )}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {birthday.nombre}
            </h3>
            {birthday.usuario_id && (
              <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                <a href={`/profile/${birthday.usuario_id}`} target="_blank" rel="noopener noreferrer" className="hover:underline">@{birthday.usuario_id}</a>
              </p>
            )}
            {birthday.mensaje && (
              <p className="mt-2 text-base text-gray-700 dark:text-gray-200 bg-primary-50 dark:bg-primary-900/30 rounded-lg p-3 border border-primary-100 dark:border-primary-800">
                {birthday.mensaje}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 relative">
            <Cake className={`h-6 w-6 ${isToday(birthday.fecha_nacimiento) ? 'text-pink-500' : 'text-gray-400'}`} />
            <button
              type="button"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={e => { e.stopPropagation(); setShowMenu((v) => !v); }}
              aria-label="Abrir menú"
              data-menu="cumple-menu"
            >
              <MoreHorizontal className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
            {showMenu && (
              <div
                className="absolute right-0 top-10 z-50 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 min-w-[180px] animate-fade-in"
              >
                <ul className="py-2">
                  <li>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => {navigator.clipboard.writeText(window.location.origin + '/cumpleanos/' + birthday.id); setShowMenu(false); toast.success('¡Enlace copiado!')}}>
                      Guardar enlace
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={handleShare}>
                      Compartir cumpleaños
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => {setShowMenu(false); setEditMode(true);}}>
                      Editar cumpleaños
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-800" onClick={async () => {await handleDelete(); setShowMenu(false);}}>
                      Eliminar cumpleaños
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={e => { e.stopPropagation(); setShowMenu(false); }}>
                      Cancelar
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {birthday.imagen_url && (
          <div className="mt-4 flex justify-center items-center" style={{ width: '100%', minHeight: '120px', maxHeight: '80vh', background: 'transparent' }}>
            <img
              src={birthday.imagen_url}
              alt={birthday.nombre}
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
        )}
        {birthday.multimedia_url && (
          <div className="mt-4">
            {/* Soporte para multimedia adjunta (audio, video, etc.) */}
            {birthday.multimedia_url.match(/\.(mp4|webm|ogg)$/) ? (
              <video controls className="w-full rounded-lg">
                <source src={birthday.multimedia_url} />
                Tu navegador no soporta video.
              </video>
            ) : birthday.multimedia_url.match(/\.(mp3|wav|ogg)$/) ? (
              <audio controls className="w-full mt-2">
                <source src={birthday.multimedia_url} />
                Tu navegador no soporta audio.
              </audio>
            ) : null}
          </div>
        )}

        <div className="mt-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span className="flex items-center">
              <Cake className="h-4 w-4 mr-1 text-pink-500" />
              <a
                href={`/cumpleanos/${birthday.id}`}
                className="hover:underline text-pink-600 dark:text-pink-400 font-semibold"
                title="Ver detalle del cumpleaños"
              >
                {format(new Date(birthday.fecha_nacimiento), 'dd MMMM', { locale: es })}
              </a>
            </span>
          </div>
          {/* Campos opcionales para compatibilidad */}
          {birthday.disciplina && (
            <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full ml-2">
              {birthday.disciplina}
            </span>
          )}
          {birthday.email && (
            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Mail className="h-4 w-4 mr-2" />
              <a href={`mailto:${birthday.email}`} className="hover:text-pink-500">
                {birthday.email}
              </a>
            </div>
          )}
          {birthday.telefono && (
            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Phone className="h-4 w-4 mr-2" />
              <a href={`tel:${birthday.telefono}`} className="hover:text-pink-500">
                {birthday.telefono}
              </a>
            </div>
          )}
        </div>
        {birthday.trayectoria && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Trayectoria
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
              {birthday.trayectoria}
            </p>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cumpleaños: {format(new Date(birthday.fecha_nacimiento), "d 'de' MMMM", { locale: es })}
          </p>
        </div>

        {/* Reacciones y comentarios */}
        <div className="flex items-center gap-4 mb-4">
          <ReactionsBar reactions={reactionsData} onReact={handleLike} reactionKind="cumpleanos" />
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
                  <div className="flex-1 relative">
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
                  </div>
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
              </form>
            )}
          </BottomSheetModal>
        )}
      </div>
    </div>
  );
};

export default CumpleañosCard;