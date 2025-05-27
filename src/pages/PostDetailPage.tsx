import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePostStore } from '../store/postStore';
import NotFoundPage from './NotFoundPage';
import PostCard from '../components/posts/PostCard';
import { supabase } from '../lib/supabase';

const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { posts } = usePostStore();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const found = posts.find((p) => p.id === id);
    if (found) {
      setPost(found);
      setLoading(false);
    } else if (id) {
      // Buscar el post por ID directamente en la base de datos si no está en el estado local
      (async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single();
        if (data && !error) {
          setPost({
            id: data.id,
            userId: data.autor_id,
            type: data.tipo,
            content: data.contenido,
            mediaUrl: data.multimedia_url?.[0],
            createdAt: data.creado_en,
            likes: [], // Opcional: podrías cargar likes si lo necesitas
            comments: [], // Opcional: podrías cargar comentarios si lo necesitas
            isFavorite: false // Opcional: podrías cargar favoritos si lo necesitas
          });
        } else {
          setPost(null);
        }
        setLoading(false);
      })();
    }
  }, [id, posts]);

  if (loading) return <div className="p-8 text-center">Cargando...</div>;
  if (!post) return <NotFoundPage />;

  return (
    <div className="max-w-xl mx-auto p-4">
      <PostCard post={post} />
    </div>
  );
};

export default PostDetailPage;
