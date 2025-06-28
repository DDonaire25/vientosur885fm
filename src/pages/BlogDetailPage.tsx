import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import NotFoundPage from './NotFoundPage';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useDebounce } from 'use-debounce';
import { useAuthStore } from '../store/authStore';
import CommentThread, { CommentData } from '../components/shared/CommentThread';
import ReactionsBar, { ReactionData } from '../components/shared/ReactionsBar';
import { Share2 } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  coverImage: string;
  authorId: string;
  authorUsername: string;
  authorName: string;
  authorAvatar: string;
  published: string;
  category: string;
  commentsCount?: number;
  likesCount?: number;
}

const BlogDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [commentUsers, setCommentUsers] = useState<Record<string, any>>({});
  const [likes, setLikes] = useState<string[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [debouncedMentionQuery] = useDebounce(mentionQuery, 200);
  const commentInputRef = React.useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const isLiked = user ? likes.includes(user.id) : false;

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('publicaciones')
        .select('id, titulo, excerpt, imagen_portada, categoria, publicado_en, autor_id')
        .eq('id', id)
        .eq('tipo', 'blog')
        .single();
      if (!data || error) {
        setBlog(null);
        setLoading(false);
        return;
      }
      // Obtener datos de autor
      let autor = { nombre_completo: 'Autor', avatar_url: '/default-avatar.png', id: '', nombre_usuario: '' };
      if (data.autor_id) {
        const { data: userData } = await supabase.from('usuarios').select('id, nombre_completo, avatar_url, nombre_usuario').eq('id', data.autor_id).single();
        if (userData) autor = userData;
      }
      // Comentarios y likes count
      const { count: commentsCount } = await supabase
        .from('comentarios_blog')
        .select('*', { count: 'exact', head: true })
        .eq('publicacion_id', data.id);
      const { count: likesCount } = await supabase
        .from('reacciones_blog')
        .select('*', { count: 'exact', head: true })
        .eq('publicacion_id', data.id)
        .eq('tipo', 'like');
      setBlog({
        id: data.id,
        title: data.titulo,
        excerpt: data.excerpt,
        coverImage: data.imagen_portada,
        authorId: autor.id,
        authorUsername: autor.nombre_usuario,
        authorName: autor.nombre_completo,
        authorAvatar: autor.avatar_url,
        published: data.publicado_en,
        category: data.categoria || 'General',
        commentsCount: commentsCount || 0,
        likesCount: likesCount || 0
      });
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!blog) return;
    // Cargar comentarios y usuarios
    const fetchComments = async () => {
      const { data } = await supabase
        .from('comentarios_blog')
        .select('*, autor:usuarios(id, nombre_completo, avatar_url)')
        .eq('publicacion_id', blog.id)
        .order('creado_en', { ascending: true });
      setComments(data || []);
      // Cargar usuarios de los comentarios
      if (data && data.length > 0) {
        const userMap: Record<string, any> = {};
        data.forEach((c: any) => {
          if (c.autor) userMap[c.autor.id] = c.autor;
        });
        setCommentUsers(userMap);
      }
    };
    // Cargar likes
    const fetchLikes = async () => {
      const { data } = await supabase
        .from('reacciones_blog')
        .select('usuario_id')
        .eq('publicacion_id', blog.id)
        .eq('tipo', 'like');
      setLikes(data ? data.map((r: any) => r.usuario_id) : []);
    };
    fetchComments();
    fetchLikes();
  }, [blog]);

  // Optimización: carga de usuarios de comentarios con cache y fallback
  useEffect(() => {
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
            const { data: userData } = await supabase.from('usuarios').select('id, nombre_completo, avatar_url').eq('id', id).single();
            users[id] = userData || { nombre_completo: 'Usuario', avatar_url: '/default-avatar.png' };
          } catch {
            users[id] = { nombre_completo: 'Usuario', avatar_url: '/default-avatar.png' };
          }
        }
      }));
      if (isMounted) setCommentUsers(users);
    })();
    return () => { isMounted = false; };
  }, [comments, user]);

  const handleLike = async () => {
    if (!user || !blog) return;
    if (isLiked) {
      await supabase
        .from('reacciones_blog')
        .delete()
        .eq('publicacion_id', blog.id)
        .eq('usuario_id', user.id)
        .eq('tipo', 'like');
      setLikes(likes.filter(id => id !== user.id));
    } else {
      await supabase
        .from('reacciones_blog')
        .insert({ publicacion_id: blog.id, usuario_id: user.id, tipo: 'like' });
      setLikes([...likes, user.id]);
    }
  };

  const handleShare = () => {
    if (!blog) return;
    const url = window.location.origin + '/blogs/' + blog.id;
    if (navigator.share) {
      navigator.share({
        title: blog.title,
        text: blog.excerpt,
        url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      // @ts-ignore
      if (typeof toast !== 'undefined') toast.success('¡Enlace copiado!');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && commentText.trim() && blog) {
      const { error, data } = await supabase
        .from('comentarios_blog')
        .insert({
          publicacion_id: blog.id,
          autor_id: user.id,
          contenido: commentText.trim()
        })
        .select('*, autor:usuarios(id, nombre_completo, avatar_url)')
        .single();
      if (!error && data) {
        setCommentText('');
        setShowEmojiPicker(false);
        setComments(prev => [...prev, data]);
        setCommentUsers(prev => ({ ...prev, [user.id]: data.autor }));
      }
    }
  };

  const handleReplyComment = async (parentId: string, content: string) => {
    if (!user || !blog) return;
    const { error, data } = await supabase
      .from('comentarios_blog')
      .insert({
        publicacion_id: blog.id,
        autor_id: user.id,
        contenido: content,
        parent_id: parentId
      })
      .select('*, autor:usuarios(id, nombre_completo, avatar_url)')
      .single();
    if (!error && data) {
      setComments(prev => [...prev, data]);
      setCommentUsers(prev => ({ ...prev, [user.id]: data.autor }));
    }
  };

  const handleEmojiSelect = (emoji: any) => {
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
        input.setSelectionRange(start + 2, start + 2);
      }, 0);
    } else {
      setCommentText(commentText + (emoji.native || emoji.skins?.[0]?.native || ''));
    }
    setShowEmojiPicker(false);
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
    setMentionQuery('');
    setTimeout(() => {
      if (commentInputRef.current) commentInputRef.current.focus();
    }, 0);
  };

  // Funciones para edición y borrado de comentarios
  const handleEditComment = async (commentId: string, newContent: string) => {
    try {
      await supabase.from('comentarios_blog').update({ contenido: newContent }).eq('id', commentId);
      setComments(comments.map(c => c.id === commentId ? { ...c, contenido: newContent } : c));
      // Feedback visual
    } catch {
      // Feedback de error
    }
  };
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('¿Eliminar este comentario?')) return;
    try {
      await supabase.from('comentarios_blog').delete().eq('id', commentId);
      setComments(comments.filter(c => c.id !== commentId));
      // Feedback visual
    } catch {
      // Feedback de error
    }
  };

  if (loading) return <div className="py-8 flex justify-center"><LoadingSpinner message="Cargando artículo..." /></div>;
  if (!blog) return <NotFoundPage />;

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
    { emoji: '❤️', count: likes.length, reacted: isLiked, id: blog?.id }, // id de la reacción = id del blog
    // TODO: mapear otros tipos de reacciones si existen
  ];

  return (
    <div className="max-w-2xl mx-auto p-4">
      <button onClick={() => window.location.href = '/'} className="text-primary-600 dark:text-primary-400 hover:underline mb-4">
        ← Volver a inicio
      </button>
      <div className="mb-4">
        <img src={blog.coverImage} alt={blog.title} style={{ width: '100%', height: '100%', maxWidth: '470px', maxHeight: '80vh', objectFit: 'contain', border: 'none', borderRadius: 0, background: 'transparent', display: 'block', margin: 0, padding: 0 }} />
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">
            {blog.category}
          </span>
          <span className="mx-2">•</span>
          <span>{new Date(blog.published).toLocaleDateString('es-ES')}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{blog.title}</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{blog.excerpt}</p>
        <div className="flex items-center gap-2 mb-4">
          <img src={blog.authorAvatar} alt={blog.authorName} className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700" />
          <span className="font-medium text-gray-900 dark:text-white text-sm">{blog.authorName}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <ReactionsBar reactions={reactionsData} onReact={handleLike} reactionKind="blog" />
          <button onClick={handleShare} className="flex items-center group" title="Compartir">
            <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-500" />
          </button>
        </div>
        {((comments.length > 0) || true) && (
          <div className="px-0 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <CommentThread
              comments={commentThreadData}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              onReply={handleReplyComment}
            />
            {user && (
              <form onSubmit={handleComment} className="flex items-center space-x-2 relative mt-2">
                <div className="avatar w-8 h-8">
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="avatar-img"
                  />
                </div>
                <input
                  ref={commentInputRef}
                  type="text"
                  placeholder="Añade un comentario..."
                  className="flex-1 bg-white dark:bg-gray-900 rounded-full px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  value={commentText}
                  onChange={handleInputChange}
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
                  disabled={!commentText.trim()}
                  className="text-sm font-medium text-primary-600 dark:text-primary-400 disabled:opacity-50"
                >
                  Publicar
                </button>
                {showEmojiPicker && (
                  <div className="absolute z-50 bottom-12 right-0">
                    <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="auto" />
                  </div>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogDetailPage;
