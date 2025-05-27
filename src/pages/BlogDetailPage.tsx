import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import NotFoundPage from './NotFoundPage';

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

  if (loading) return <div className="py-8 flex justify-center"><LoadingSpinner message="Cargando artículo..." /></div>;
  if (!blog) return <NotFoundPage />;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-4">
        <img src={blog.coverImage} alt={blog.title} className="w-full h-64 object-cover rounded-lg mb-4" />
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
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>❤️ {blog.likesCount}</span>
          <span>💬 {blog.commentsCount}</span>
        </div>
      </div>
    </div>
  );
};

export default BlogDetailPage;
