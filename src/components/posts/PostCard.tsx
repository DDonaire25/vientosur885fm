import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, MoreHorizontal } from 'lucide-react';
import { Post, formatPostDate, getUserById } from '../../store/postStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { Link } from 'react-router-dom';
import ReactDOM from 'react-dom';
import MediaCarousel, { MediaItem } from './subcomponents/MediaCarousel';
import LinkPreview, { LinkData } from './subcomponents/LinkPreview';
import Poll, { PollData } from './subcomponents/Poll';
import CommentThread, { CommentData } from '../shared/CommentThread';
import ReactionsBar, { ReactionData } from '../shared/ReactionsBar';
import { useDebounce } from 'use-debounce';
import BottomSheetModal from '../shared/BottomSheetModal';

interface PostCardProps {
  post: Post;
  disableCardNavigation?: boolean;
  onDeleted?: () => void;
  user: { nombre: string; avatar: string; verificado?: boolean; id?: string };
  media?: MediaItem[];
  text: string;
  backgroundColor?: string;
  linkData?: LinkData;
  pollData?: PollData;
  onVote?: (optionId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, disableCardNavigation, onDeleted, user, media, text, backgroundColor, linkData, pollData, onVote }) => {
  const [commentText, setCommentText] = useState('');
  const [postUser, setPostUser] = useState<any>(null);
  const [commentUsers, setCommentUsers] = useState<Record<string, any>>({});
  const [loadingUser, setLoadingUser] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useAuthStore();
  const [likes, setLikes] = useState<string[]>(post.likes);
  const [comments, setComments] = useState(post.comments);
  const [isLiked, setIsLiked] = useState(currentUser ? post.likes.includes(currentUser.id) : false);
  const [isLoadingReaction, setIsLoadingReaction] = useState(false);
  const [isLoadingComment, setIsLoadingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [debouncedMentionQuery] = useDebounce(mentionQuery, 200);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Cargar usuario del post
  useEffect(() => {
    let isMounted = true;
    setLoadingUser(true);
    (async () => {
      const u = await getUserById(post.userId);
      if (isMounted) {
        setPostUser(u);
        setLoadingUser(false);
      }
    })();
    return () => { isMounted = false; };
  }, [post.userId]);

  // Optimización: carga de usuarios de comentarios con cache y fallback
  useEffect(() => {
    let isMounted = true;
    const users: Record<string, any> = {};
    const ids = Array.from(new Set(comments
      .map(c => c.userId)
      .filter(id => typeof id === 'string' && id && id !== 'undefined' && /^[0-9a-fA-F-]{36}$/.test(id))
    ));
    (async () => {
      await Promise.all(ids.map(async (id) => {
        if (!id || id === 'undefined') return;
        if (users[id]) return; // cache local
        if (id === user?.id) {
          users[id] = user;
        } else {
          try {
            const u = await getUserById(id);
            users[id] = u || { displayName: 'Usuario', avatar: '/default-avatar.png' };
          } catch {
            users[id] = { displayName: 'Usuario', avatar: '/default-avatar.png' };
          }
        }
      }));
      if (isMounted) setCommentUsers(users);
    })();
    return () => { isMounted = false; };
  }, [comments, user]);

  // Sincronizar likes y comentarios con props.post
  useEffect(() => {
    setLikes(post.likes);
    setComments(post.comments);
    setIsLiked(currentUser ? post.likes.includes(currentUser.id) : false);
  }, [post, currentUser]);

  // Reacción (like)
  const handleLike = async () => {
    if (!currentUser || isLoadingReaction) return;
    setIsLoadingReaction(true);
    try {
      if (isLiked) {
        await supabase.from('reacciones_post').delete().eq('post_id', post.id).eq('usuario_id', currentUser.id);
        setLikes(likes.filter(id => id !== currentUser.id));
      } else {
        await supabase.from('reacciones_post').insert({ post_id: post.id, usuario_id: currentUser.id, tipo: 'like' });
        setLikes([...likes, currentUser.id]);
      }
      setIsLiked(!isLiked);
    } catch {
      toast.error('Error al actualizar reacción');
    } finally {
      setIsLoadingReaction(false);
    }
  };

  // Comentario
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    if (!currentUser) {
      setCommentError('Debes iniciar sesión para comentar.');
      return;
    }
    if (!commentText.trim()) {
      setCommentError('El comentario no puede estar vacío.');
      return;
    }
    setIsLoadingComment(true);
    try {
      const { data, error } = await supabase.from('comentarios_post').insert({ post_id: post.id, autor_id: currentUser.id, contenido: commentText.trim() }).select().single();
      if (error) throw error;
      setComments([...comments, { id: data.id, userId: data.autor_id, content: data.contenido, createdAt: data.creado_en }]);
      setCommentText('');
    } catch {
      setCommentError('Error al agregar comentario.');
    } finally {
      setIsLoadingComment(false);
    }
  };

  // Asegura que handleShare esté correctamente definido y asignado al botón
  const handleShare = async () => {
    try {
      const url = window.location.origin + '/posts/' + post.id;
      if (navigator.share) {
        await navigator.share({
          title: post.content?.slice(0, 60) || 'Post de Red Viento Sur',
          text: post.content,
          url
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success('¡Enlace copiado!');
      } else {
        // Fallback: input temporal
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        toast.success('¡Enlace copiado!');
      }
    } catch (e) {
      toast.error('No se pudo compartir el enlace');
    }
  };

  const handleDelete = async () => {
    if (!user || user.id !== post.userId) return;
    if (!window.confirm('¿Estás seguro de eliminar este post?')) return;
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);
      if (error) throw error;
      toast.success('Post eliminado exitosamente');
      if (typeof onDeleted === 'function') onDeleted();
    } catch (error) {
      toast.error('Error al eliminar el post');
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    // Insertar emoji en la posición actual del cursor
    if (commentInputRef.current) {
      const input = commentInputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue =
        commentText.slice(0, start) +
        (emoji.native || emoji.skins?.[0]?.native || '') +
        commentText.slice(end);
      setCommentText(newValue);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + 2, start + 2); // 2 = longitud típica de emoji
      }, 0);
    } else {
      setCommentText(commentText + (emoji.native || emoji.skins?.[0]?.native || ''));
    }
    setShowEmojiPicker(false);
  };
  
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu((v) => {
      const next = !v;
      if (next && menuButtonRef.current) {
        const rect = menuButtonRef.current.getBoundingClientRect();
        let left = rect.left + window.scrollX;
        let top = rect.bottom + window.scrollY;
        // Ajuste para móvil: evitar overflow a la derecha
        if (isMobile) {
          const menuWidth = 220; // Ancho estimado del menú
          const padding = 8; // Espacio desde el borde derecho
          const viewportWidth = window.innerWidth;
          if (left + menuWidth > viewportWidth - padding) {
            left = viewportWidth - menuWidth - padding;
            if (left < padding) left = padding; // nunca menos que el padding
          }
        }
        setMenuPosition({ top, left });
      }
      return next;
    });
  };
  
  // Cerrar menú al hacer clic fuera de él
  useEffect(() => {
    if (!showMenu) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);
  
  // Log de depuración para detectar datos vacíos
  useEffect(() => {
    if (!post || !post.id) {
      // eslint-disable-next-line no-console
      console.warn('PostCard: post vacío o sin id', post);
    }
    if (!user || !user.id) {
      // eslint-disable-next-line no-console
      console.warn('PostCard: user vacío o sin id', user);
    }
  }, [post, user]);
  
  // Adaptar comentarios y reacciones al formato de los componentes compartidos
  const commentThreadData: CommentData[] = comments.map(c => ({
    id: c.id,
    userId: c.userId,
    userName: commentUsers[c.userId]?.displayName || 'Usuario',
    userAvatar: commentUsers[c.userId]?.avatar || '/default-avatar.png',
    content: c.content,
    createdAt: c.createdAt,
    parent_id: c.parent_id || null,
    replies: [],
    canEdit: !!(currentUser && c.userId === currentUser.id),
    canDelete: !!(currentUser && c.userId === currentUser.id)
  }));
  const reactionsData: ReactionData[] = [
    { emoji: '❤️', count: likes.length, reacted: isLiked, id: post.id }, // id de la reacción = id del post para reportar
    // TODO: mapear otros tipos de reacciones
  ];
  
  // Definir handleEditComment en el scope correcto
  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!newContent.trim()) return;
    try {
      await supabase.from('comentarios_post').update({ contenido: newContent }).eq('id', commentId);
      setComments(comments.map(c => c.id === commentId ? { ...c, content: newContent } : c));
      toast.success('Comentario editado');
    } catch {
      toast.error('Error al editar comentario');
    }
  };

  // Permitir respuestas anidadas
  const handleReplyComment = async (parentId: string, content: string) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.from('comentarios_post').insert({ post_id: post.id, autor_id: currentUser.id, contenido: content, parent_id: parentId }).select().single();
      if (error) throw error;
      setComments([...comments, { id: data.id, userId: data.autor_id, content: data.contenido, createdAt: data.creado_en, parent_id: data.parent_id }]);
    } catch {
      toast.error('Error al responder comentario.');
    }
  };

  // Buscar usuarios para autocompletado de menciones
  useEffect(() => {
    if (!debouncedMentionQuery) {
      setMentionResults([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('usuarios')
        .select('id, nombre_usuario, nombre_completo, avatar_url')
        .ilike('nombre_usuario', `%${debouncedMentionQuery}%`)
        .limit(5);
      setMentionResults(data || []);
    })();
  }, [debouncedMentionQuery]);

  // Detectar @ para autocompletado
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCommentText(value);
    setCommentError(null);
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
    const match = commentText.match(regex);
    if (!match) return;
    const before = commentText.slice(0, match.index);
    setCommentText(before + '@' + user.nombre_usuario + ' ');
    setShowMentionList(false);
  };
  
  // Eliminar comentario
  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase.from('comentarios_post').delete().eq('id', commentId);
      if (error) throw error;
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comentario eliminado');
    } catch {
      toast.error('Error al eliminar el comentario');
    }
  };
  
  if (!post || !postUser) {
    return null;
  }
  
  return (
    <article className="feed-item w-full border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-none rounded-none">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center space-x-3">
          {postUser?.username ? (
            <Link to={`/profile/${postUser.username}`} className="avatar" aria-label={`Ver perfil de ${postUser.displayName || 'Usuario'}`}> 
              {loadingUser ? (
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              ) : (
                <img 
                  src={postUser?.avatar || '/default-avatar.png'} 
                  alt={postUser?.displayName || 'Usuario'} 
                  className="avatar-img"
                  style={{ objectFit: 'cover', width: '100%', height: '100%', border: 'none', borderRadius: 0, background: 'transparent', margin: 0, padding: 0 }}
                />
              )}
            </Link>
          ) : (
            <div className="avatar">
              <img 
                src={postUser?.avatar || '/default-avatar.png'} 
                alt={postUser?.displayName || 'Usuario'} 
                className="avatar-img opacity-50"
                style={{ objectFit: 'cover', width: '100%', height: '100%', border: 'none', borderRadius: 0, background: 'transparent', margin: 0, padding: 0 }}
              />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {loadingUser ? (
                <span className="bg-gray-200 rounded w-20 h-4 inline-block animate-pulse" />
              ) : postUser?.username ? (
                <Link to={`/profile/${postUser.username}`} className="hover:underline" aria-label={`Ver perfil de ${postUser.displayName || 'Usuario'}`}> 
                  {postUser?.displayName || 'Usuario'}
                </Link>
              ) : (
                <span className="text-gray-400">{postUser?.displayName || 'Usuario'}</span>
              )}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {disableCardNavigation ? (
                <span>{formatPostDate(post.createdAt)}</span>
              ) : (
                <Link to={`/posts/${post.id}`} className="hover:underline" onClick={e => {
                  const target = e.target as HTMLElement;
                  if (target.closest('[data-menu="post-menu"]')) {
                    e.preventDefault();
                  }
                }}>
                  <span>{formatPostDate(post.createdAt)}</span>
                </Link>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 relative">
          <button
            ref={menuButtonRef}
            type="button"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={handleMenuClick}
            aria-label="Abrir menú"
            data-menu="post-menu"
          >
            <MoreHorizontal className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
          {showMenu && menuPosition && ReactDOM.createPortal(
            <div
              ref={menuRef}
              className="z-[9999] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 min-w-[180px] animate-fade-in"
              style={{
                position: 'absolute',
                top: menuPosition.top,
                left: isMobile ? menuPosition.left : menuPosition.left,
                maxWidth: isMobile ? 220 : undefined,
                right: isMobile ? undefined : undefined,
                overflow: 'visible',
              }}
            >
              <ul className="py-2">
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => {navigator.clipboard.writeText(window.location.origin + '/posts/' + post.id); setShowMenu(false); toast.success('¡Enlace copiado!')}}>
                    Guardar enlace
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={handleShare}>
                    Compartir publicación
                  </button>
                </li>
                {user && user.id === post.userId && (
                  <>
                    <li>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => {setShowMenu(false); /* Aquí podrías abrir un modal de edición */}}>
                        Editar publicación
                      </button>
                    </li>
                    <li>
                      <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-800" onClick={async () => {await handleDelete(); setShowMenu(false);}}>
                        Eliminar publicación
                      </button>
                    </li>
                  </>
                )}
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={e => { e.stopPropagation(); setShowMenu(false); }}>
                    Cancelar
                  </button>
                </li>
              </ul>
            </div>,
            document.body
          )}
        </div>
      </div>
      
      {/* Post Media */}
      <div className="w-full flex justify-center items-center bg-white" style={{padding: 0, margin: 0}}>
        {media && media.length > 0 && <MediaCarousel media={media} />}
      </div>
      {/* Link Preview */}
      {linkData && <LinkPreview link={linkData} />}
      {/* Poll */}
      {pollData && <Poll poll={pollData} onVote={onVote ?? (() => {})} />}
      {/* Post Content (TEXTO) debajo del media */}
      <div className="px-4 pb-3 pt-2" style={backgroundColor ? { backgroundColor } : {}}>
        <span>{text}</span>
      </div>
      <div className="flex items-center gap-2 py-2 px-4 justify-start">
        <ReactionsBar reactions={reactionsData} onReact={handleLike} reactionKind="post" />
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
            onReply={handleReplyComment}
            onDelete={handleDeleteComment}
          />
          {currentUser && (
            <form onSubmit={handleComment} className="flex items-center space-x-2 relative mt-2">
              <div className="avatar w-9 h-9">
                <img 
                  src={currentUser.avatar || '/default-avatar.png'} 
                  alt={currentUser.displayName || 'Usuario'} 
                  className="avatar-img rounded-full object-cover border border-primary-200 dark:border-primary-700"
                  style={{ objectFit: 'cover', width: '100%', height: '100%', border: 'none', borderRadius: 0, background: 'transparent', margin: 0, padding: 0 }}
                />
              </div>
              <input
                type="text"
                placeholder="Añade un comentario..."
                className={`flex-1 bg-white dark:bg-gray-900 rounded-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all ${commentError ? 'border-red-500' : ''}`}
                value={commentText}
                onChange={handleInputChange}
                maxLength={300}
                autoComplete="off"
                disabled={isLoadingComment}
                aria-invalid={!!commentError}
                ref={commentInputRef}
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
                disabled={!commentText.trim() || isLoadingComment}
                className="text-sm font-bold text-primary-600 dark:text-primary-400 disabled:opacity-50 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900 hover:bg-primary-100 dark:hover:bg-primary-800 transition-all"
              >
                {isLoadingComment ? '...' : 'Publicar'}
              </button>
              {showEmojiPicker && (
                <div className="absolute z-50 bottom-12 right-0">
                  <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="auto" />
                </div>
              )}
              {commentError && (
                <span className="absolute left-0 -bottom-6 text-xs text-red-500 font-medium">{commentError}</span>
              )}
            </form>
          )}
        </BottomSheetModal>
      )}
      {/* Ya no se muestran comentarios ni caja de comentario en la tarjeta */}
    </article>
  );
};

export default PostCard;

/*
// Ejemplos de uso

// Post solo texto
<PostCard
  user={{ nombre: 'Ana', avatar: '/ana.png', verificado: true }}
  date="2025-06-18T12:00:00Z"
  text="¡Hola mundo! #bienvenidos @usuario"
  stats={{ likes: 10, comentarios: 2, compartidos: 1 }}
  onLike={() => {}}
  onComment={() => {}}
  onShare={() => {}}
/>

// Post con imagen y link preview
<PostCard
  user={{ nombre: 'Luis', avatar: '/luis.png' }}
  date="2025-06-18T13:00:00Z"
  text="Mira este enlace: https://ejemplo.com"
  media={[{ url: '/foto.jpg', type: 'image', aspectRatio: '1:1' }]}
  linkData={{ url: 'https://ejemplo.com', image: '/preview.jpg', title: 'Ejemplo', description: 'Descripción del enlace' }}
  stats={{ likes: 5, comentarios: 1, compartidos: 0 }}
  onLike={() => {}}
  onComment={() => {}}
  onShare={() => {}}
/>

// Post con carrusel y encuesta
<PostCard
  user={{ nombre: 'Sofía', avatar: '/sofia.png' }}
  date="2025-06-18T14:00:00Z"
  text="¿Cuál prefieres?"
  media={[
    { url: '/img1.jpg', type: 'image', aspectRatio: '4:5' },
    { url: '/img2.jpg', type: 'image', aspectRatio: '1.91:1' }
  ]}
  pollData={{
    question: 'Elige una opción',
    options: [
      { id: '1', text: 'Opción 1', votes: 3 },
      { id: '2', text: 'Opción 2', votes: 7 }
    ],
    totalVotes: 10
  }}
  stats={{ likes: 8, comentarios: 3, compartidos: 2, votos: 10 }}
  onLike={() => {}}
  onComment={() => {}}
  onShare={() => {}}
  onVote={id => {}}
/>
*/
