import React, { useEffect, useState } from 'react';
import { Book, Calendar, Share2, MessageCircle, Heart } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import SuggestionsToFollow from '../components/profile/SuggestionsToFollow';
import BottomSheetModal from '../components/shared/BottomSheetModal';
import CommentThread from '../components/shared/CommentThread';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  coverImage: string;
  authorId: string;
  authorUsername: string; // <-- nuevo campo
  authorName: string;
  authorAvatar: string;
  published: string;
  category: string;
  commentsCount?: number;
  likesCount?: number;
}

const FEED_MODES = [
  { label: 'Para ti', value: 'feed' },
  { label: 'Lo último', value: 'timeline' }
];

const BlogsPage: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const { user } = useAuthStore();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedMode, setFeedMode] = useState<'feed' | 'timeline'>('feed');
  const [commentText, setCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const commentInputRef = React.useRef<HTMLInputElement>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [likedBlogs, setLikedBlogs] = useState<string[]>([]);
  const [likeLoading, setLikeLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoading(true);
      // Traer solo publicaciones tipo 'blog' y ajustar el select a la estructura real
      const { data } = await supabase
        .from('publicaciones')
        .select(`id, titulo, excerpt, imagen_portada, categoria, publicado_en, autor_id`)
        .eq('tipo', 'blog')
        .order('publicado_en', { ascending: false });
      // Obtener datos de autor para cada blog
      const blogsWithAuthors = await Promise.all((data || []).map(async (b: any) => {
        let autor = { nombre_completo: 'Autor', avatar_url: '/default-avatar.png', id: '', nombre_usuario: '' };
        if (b.autor_id) {
          const { data: userData } = await supabase.from('usuarios').select('id, nombre_completo, avatar_url, nombre_usuario').eq('id', b.autor_id).single();
          if (userData) autor = userData;
        }
        // Comentarios
        const { count: commentsCount } = await supabase
          .from('comentarios_blog')
          .select('*', { count: 'exact', head: true })
          .eq('publicacion_id', b.id);
        // Likes
        const { count: likesCount } = await supabase
          .from('reacciones_blog')
          .select('*', { count: 'exact', head: true })
          .eq('publicacion_id', b.id)
          .eq('tipo', 'like');
        return {
          id: b.id,
          title: b.titulo,
          excerpt: b.excerpt,
          coverImage: b.imagen_portada,
          authorId: autor.id,
          authorUsername: autor.nombre_usuario, // <-- nuevo campo
          authorName: autor.nombre_completo,
          authorAvatar: autor.avatar_url,
          published: b.publicado_en,
          category: b.categoria || 'General',
          commentsCount: commentsCount || 0,
          likesCount: likesCount || 0
        };
      }));
      setBlogs(blogsWithAuthors);
      setIsLoading(false);
    };
    fetchBlogs();
  }, []);

  useEffect(() => {
    if (!user) return;
    // Cargar blogs que el usuario ha dado like
    (async () => {
      const { data } = await supabase
        .from('reacciones_blog')
        .select('publicacion_id')
        .eq('usuario_id', user.id)
        .eq('tipo', 'like');
      setLikedBlogs(data ? data.map((r: any) => r.publicacion_id) : []);
    })();
  }, [user]);

  const categories = ['Todos', 'Arte', 'Música', 'Cine', 'Danza', 'Literatura'];

  const handleShowComments = async (blogId: string) => {
    if (comments[blogId]) {
      setSelectedBlogId(blogId);
      setShowCommentsModal(true);
      return;
    }
    const { data } = await supabase
      .from('comentarios_blog')
      .select('id, contenido, creado_en, autor:usuarios(id, nombre_completo, avatar_url)')
      .eq('publicacion_id', blogId)
      .order('creado_en', { ascending: true });
    setComments(prev => ({ ...prev, [blogId]: data || [] }));
    setSelectedBlogId(blogId);
    setShowCommentsModal(true);
  };

  const handleAddComment = async (blogId: string) => {
    if (!user || !newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('comentarios_blog')
        .insert({
          publicacion_id: blogId,
          autor_id: user.id,
          contenido: newComment.trim()
        })
        .select('id, contenido, creado_en, autor:usuarios(id, nombre_completo, avatar_url)')
        .single();
      if (error) throw error;
      setComments(prev => ({
        ...prev,
        [blogId]: prev[blogId] ? [...prev[blogId], data] : [data]
      }));
      setNewComment('');
      toast.success('Comentario agregado');
    } catch (err) {
      toast.error('Error al agregar comentario');
    } finally {
      setIsSubmitting(false);
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

  // Handler para compartir blogs
  const handleShareBlog = (blog: BlogPost) => {
    const url = window.location.origin + '/blogs/' + blog.id;
    if (navigator.share) {
      navigator.share({
        title: blog.title,
        text: blog.excerpt,
        url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('¡Enlace copiado!');
    }
  };

  const handleLikeBlog = async (blogId: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para dar like');
      return;
    }
    setLikeLoading(blogId);
    const isLiked = likedBlogs.includes(blogId);
    if (isLiked) {
      await supabase
        .from('reacciones_blog')
        .delete()
        .eq('publicacion_id', blogId)
        .eq('usuario_id', user.id)
        .eq('tipo', 'like');
      setLikedBlogs(likedBlogs.filter(id => id !== blogId));
      setBlogs(blogs => blogs.map(b => b.id === blogId ? { ...b, likesCount: (b.likesCount || 1) - 1 } : b));
    } else {
      await supabase
        .from('reacciones_blog')
        .insert({ publicacion_id: blogId, usuario_id: user.id, tipo: 'like' });
      setLikedBlogs([...likedBlogs, blogId]);
      setBlogs(blogs => blogs.map(b => b.id === blogId ? { ...b, likesCount: (b.likesCount || 0) + 1 } : b));
    }
    setLikeLoading(null);
  };

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <LoadingSpinner message="Cargando artículos..." />
      </div>
    );
  }

  return (
    <div className="max-w-full sm:max-w-2xl mx-auto p-2 sm:p-4 pb-24">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-primary-700 dark:text-primary-300 text-center">Blogs</h1>
      {/* Selector Feed/Timeline para blogs */}
      <div className="flex justify-center gap-4 my-4">
        {FEED_MODES.map((mode) => (
          <button
            key={mode.value}
            className={`px-5 py-2 rounded-full font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 text-base ${feedMode === mode.value ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
            onClick={() => setFeedMode(mode.value as 'feed' | 'timeline')}
            aria-pressed={feedMode === mode.value}
            tabIndex={0}
          >
            {mode.label}
          </button>
        ))}
      </div>
      {/* Sugerencias de seguidores solo en móvil */}
      <div className="block sm:hidden mb-4">
        {/** Sugerencias para seguir */}
        <SuggestionsToFollow />
      </div>
      {/* Categories */}
      <nav className="flex overflow-x-auto pb-2 hide-scrollbar" aria-label="Categorías de blogs">
        <div className="flex space-x-2">
          {categories.map(category => (
            <motion.button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-500 ${activeCategory === category ? 'bg-primary-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              whileTap={{ scale: 0.95 }}
              aria-pressed={activeCategory === category}
              tabIndex={0}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </nav>
      {/* Blog List */}
      <div className="space-y-8">
        {blogs
          .filter(blog => activeCategory === 'Todos' || blog.category === activeCategory)
          .slice()
          .sort((a, b) => feedMode === 'feed'
            ? (b.likesCount || 0) - (a.likesCount || 0)
            : new Date(b.published).getTime() - new Date(a.published).getTime()
          )
          .map(blog => (
            <article key={blog.id} className="card p-0 overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-200 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 group" tabIndex={0} aria-label={`Blog: ${blog.title}`}> 
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 aspect-video md:aspect-square">
                  <img 
                    src={blog.coverImage} 
                    alt={blog.title} 
                    style={{ width: '100%', height: '100%', maxWidth: '470px', maxHeight: '80vh', objectFit: 'contain', border: 'none', borderRadius: 0, background: 'transparent', display: 'block', margin: 0, padding: 0 }}
                  />
                </div>
                <div className="p-6 md:w-2/3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">
                        {blog.category}
                      </span>
                      <span className="mx-2">•</span>
                      <Link to={`/blogs/${blog.id}`} className="flex items-center group hover:underline">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{new Date(blog.published).toLocaleDateString('es-ES')}</span>
                      </Link>
                    </div>
                    <h3 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                      {blog.title}
                    </h3>
                    <p className="text-base text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">
                      {blog.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <Link to={blog.authorUsername ? `/profile/${blog.authorUsername}` : '#'} className="flex items-center group focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label={`Ver perfil de ${blog.authorName}`}>
                      <div className="avatar h-8 w-8 mr-2">
                        <img 
                          src={blog.authorAvatar} 
                          alt={blog.authorName} 
                          className="avatar-img rounded-full border border-gray-300 dark:border-gray-700"
                        />
                      </div>
                      <span className="text-sm font-medium group-hover:underline">{blog.authorName}</span>
                    </Link>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-4">
                      <button
                        className={`flex items-center space-x-1 group ${likeLoading === blog.id ? 'opacity-60 pointer-events-none' : ''}`}
                        onClick={() => handleLikeBlog(blog.id)}
                        aria-pressed={likedBlogs.includes(blog.id)}
                        title={likedBlogs.includes(blog.id) ? 'Quitar like' : 'Dar like'}
                      >
                        <Heart className={`h-5 w-5 transition-colors duration-150 ${likedBlogs.includes(blog.id) ? 'text-red-500 fill-red-500' : 'text-gray-600 dark:text-gray-400 group-hover:text-red-500'}`} />
                        <span className={`text-sm transition-colors duration-150 ${likedBlogs.includes(blog.id) ? 'text-red-500' : 'text-gray-600 dark:text-gray-400 group-hover:text-red-500'}`}>{blog.likesCount || 0}</span>
                      </button>
                      <button
                        className="flex items-center space-x-1 group"
                        onClick={() => handleShowComments(blog.id)}
                        aria-label="Mostrar comentarios"
                        tabIndex={0}
                      >
                        <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-primary-500">{blog.commentsCount || 0}</span>
                      </button>
                      <button
                        onClick={() => handleShareBlog(blog)}
                        className="ml-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        title="Compartir blog"
                        aria-label="Compartir blog"
                        tabIndex={0}
                      >
                        <Share2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                  {/* Modal de comentarios universal (móvil y escritorio) */}
                  <BottomSheetModal
                    open={showCommentsModal}
                    onClose={() => setShowCommentsModal(false)}
                    title="Comentarios"
                    height={window.innerWidth < 640 ? '80vh' : '70vh'}
                    desktopMode={window.innerWidth >= 640}
                  >
                    {selectedBlogId && (
                      <CommentThread
                        comments={comments[selectedBlogId] || []}
                        // Puedes agregar onEdit, onReply, etc. si lo necesitas
                      />
                    )}
                    {user && selectedBlogId && (
                      <form onSubmit={e => { e.preventDefault(); handleAddComment(selectedBlogId); }} className="flex items-center space-x-2 relative mt-2">
                        <div className="avatar w-9 h-9">
                          <img 
                            src={user.avatar || '/default-avatar.png'} 
                            alt={user.displayName}
                            className="avatar-img"
                          />
                        </div>
                        <input
                          ref={commentInputRef}
                          type="text"
                          placeholder="Añade un comentario..."
                          className="flex-1 bg-white dark:bg-gray-900 rounded-full px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                        />
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
                          disabled={!newComment.trim() || isSubmitting}
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
                  </BottomSheetModal>
                </div>
              </div>
            </article>
          ))}
      </div>
      {/* Create Blog Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <Link to="/blogs/new">
          <motion.button
            className="btn btn-primary rounded-full p-4 shadow-lg text-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Crear nuevo blog"
            tabIndex={0}
          >
            <Book className="h-6 w-6" />
          </motion.button>
        </Link>
      </div>
    </div>
  );
};

export default BlogsPage;