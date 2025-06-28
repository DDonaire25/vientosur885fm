import { create } from 'zustand';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../lib/supabase';

export type PostType = 'text' | 'image' | 'video' | 'audio' | 'document';

export interface Post {
  id: string;
  userId: string;
  type: PostType;
  content: string;
  mediaUrl?: string;
  mediaUrls?: Array<{ url: string; type: string; name: string }>;
  createdAt: string;
  likes: string[];
  comments: Comment[];
  isFavorite: boolean;
}

export interface CommentReaction {
  id: string;
  comentario_id: string;
  usuario_id: string;
  tipo: string; // 'like', 'love', etc.
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  parent_id?: string | null;
  reactions?: CommentReaction[];
}

interface PostState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  
  fetchPosts: () => Promise<void>;
  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => Promise<void>;
  toggleLike: (postId: string, userId: string) => Promise<void>;
  addComment: (postId: string, userId: string, content: string, parentId?: string | null) => Promise<void>;
  toggleFavorite: (postId: string) => Promise<void>;
  getFavoritePosts: () => Post[];
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  isLoading: false,
  error: null,

  fetchPosts: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          comentarios:comentarios_post(*),
          reacciones:reacciones_post(*)
        `)
        .order('creado_en', { ascending: false });

      // Log de depuración
      // eslint-disable-next-line no-console
      console.log('fetchPosts: resultado de Supabase', { posts, error });

      if (error) throw error;
      if (!posts || posts.length === 0) {
        // eslint-disable-next-line no-console
        console.warn('fetchPosts: No se recibieron posts desde Supabase');
      }

      // Transform data to match Post interface
      const transformedPosts: Post[] = posts.map((post: any) => {
        let mediaUrls: Array<{ url: string; type: string; name: string }> = [];
        if (post.media_urls) {
          try {
            mediaUrls = typeof post.media_urls === 'string' ? JSON.parse(post.media_urls) : post.media_urls;
          } catch {
            mediaUrls = [];
          }
        } else if (post.multimedia_url && Array.isArray(post.multimedia_url)) {
          mediaUrls = post.multimedia_url.map((url: string) => ({ url, type: 'image', name: '' }));
        }
        return {
          id: post.id,
          userId: post.autor_id,
          type: post.tipo,
          content: post.contenido,
          mediaUrl: post.multimedia_url?.[0],
          mediaUrls,
          createdAt: post.creado_en,
          likes: post.reacciones ? post.reacciones.map((r: any) => r.usuario_id) : [],
          comments: post.comentarios ? post.comentarios.map((c: any) => ({
            id: c.id,
            userId: c.autor_id,
            content: c.contenido,
            createdAt: c.creado_en,
            reactions: [] // No se traen reacciones de comentarios en esta versión simplificada
          })) : [],
          isFavorite: false // No se traen favoritos en esta versión simplificada
        };
      });

      set({ posts: transformedPosts, isLoading: false });
      // eslint-disable-next-line no-console
      console.log('fetchPosts: posts seteados en el store', transformedPosts);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al cargar posts', 
        isLoading: false 
      });
    }
  },
  
  addPost: async (post) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date().toISOString();
      const insertData: any = {
        autor_id: post.userId,
        tipo: post.type,
        contenido: post.content,
        multimedia_url: post.mediaUrls ? post.mediaUrls.map(m => m.url) : (post.mediaUrl ? [post.mediaUrl] : []),
        media_urls: post.mediaUrls ? JSON.stringify(post.mediaUrls) : null,
        creado_en: now,
        actualizado_en: now
      };
      const { data, error } = await supabase
        .from('posts')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Soporte para media_urls enriquecido
      let mediaUrls: Array<{ url: string; type: string; name: string }> = [];
      if (data.media_urls) {
        try {
          mediaUrls = typeof data.media_urls === 'string' ? JSON.parse(data.media_urls) : data.media_urls;
        } catch {
          mediaUrls = [];
        }
      } else if (data.multimedia_url && Array.isArray(data.multimedia_url)) {
        mediaUrls = data.multimedia_url.map((url: string) => ({ url, type: 'image', name: '' }));
      }

      const newPost: Post = {
        id: data.id,
        userId: data.autor_id,
        type: data.tipo,
        content: data.contenido,
        mediaUrl: data.multimedia_url?.[0],
        mediaUrls,
        createdAt: data.creado_en,
        likes: [],
        comments: [],
        isFavorite: false
      };
      set(state => ({ 
        posts: [newPost, ...state.posts],
        isLoading: false 
      }));
      toast.success('¡Publicación creada exitosamente!');
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al crear post', 
        isLoading: false 
      });
      toast.error('Error al crear post');
    }
  },
  
  toggleLike: async (postId, userId) => {
    set({ isLoading: true });
    try {
      const post = get().posts.find(p => p.id === postId);
      if (!post) return;
      const isLiked = post.likes.includes(userId);
      if (isLiked) {
        const { error } = await supabase
          .from('reacciones_post')
          .delete()
          .eq('post_id', postId)
          .eq('usuario_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reacciones_post')
          .insert({
            post_id: postId,
            usuario_id: userId,
            tipo: 'like'
          });
        if (error) throw error;
      }
      set(state => ({
        posts: state.posts.map(p => 
          p.id === postId
            ? {
                ...p,
                likes: isLiked
                  ? p.likes.filter(id => id !== userId)
                  : [...p.likes, userId]
              }
            : p
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ isLoading: false });
      toast.error('Error al actualizar reacción');
    }
  },

  addComment: async (postId, userId, content, parentId = null) => {
    set({ isLoading: true });
    try {
      // Validar que el usuario existe en la tabla usuarios
      const { data: existingUser, error: userError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', userId)
        .single();
      if (userError || !existingUser) {
        // Intentar crear el usuario con datos mínimos
        const { error: insertError } = await supabase.from('usuarios').insert([
          {
            id: userId,
            nombre_usuario: userId.slice(0, 8),
            nombre_completo: 'Usuario',
            avatar_url: ''
          }
        ]);
        if (insertError) throw insertError;
      }
      const { data, error } = await supabase
        .from('comentarios_post')
        .insert({
          post_id: postId,
          autor_id: userId,
          contenido: content,
          parent_id: parentId
        })
        .select()
        .single();
      if (error) throw error;
      // Evitar duplicados en comentarios
      set(state => ({
        posts: state.posts.map(p => 
          p.id === postId
            ? {
                ...p,
                comments: p.comments.some(c => c.id === data.id)
                  ? p.comments
                  : [...p.comments, {
                      id: data.id,
                      userId: data.autor_id,
                      content: data.contenido,
                      createdAt: data.creado_en
                    }]
              }
            : p
        ),
        isLoading: false
      }));
      toast.success('¡Comentario agregado!');
    } catch (error) {
      set({ isLoading: false });
      toast.error('Error al agregar comentario');
    }
  },

  toggleFavorite: async (postId) => {
    set({ isLoading: true });
    try {
      const post = get().posts.find(p => p.id === postId);
      if (!post) return;
      const isFavorited = post.isFavorite;
      const currentUser = require('../store/authStore').useAuthStore.getState().user;
      if (!currentUser) throw new Error('No hay usuario autenticado');
      if (isFavorited) {
        const { error } = await supabase
          .from('favoritos_post')
          .delete()
          .eq('post_id', postId)
          .eq('usuario_id', currentUser.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favoritos_post')
          .insert({
            post_id: postId,
            usuario_id: currentUser.id
          });
        if (error) throw error;
      }
      set(state => ({
        posts: state.posts.map(p => 
          p.id === postId
            ? {
                ...p,
                isFavorite: !isFavorited
              }
            : p
        ),
        isLoading: false
      }));
      toast.success(isFavorited ? '¡Publicación desmarcada como favorita!' : '¡Publicación marcada como favorita!');
    } catch (error) {
      set({ isLoading: false });
      toast.error('Error al actualizar favorito');
    }
  },

  getFavoritePosts: () => {
    const { posts } = get();
    return posts.filter(post => post.isFavorite);
  }
}));

// Helper function to format post date
export const formatPostDate = (dateString: string) => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
};

// Helper function to get user by ID
export const getUserById = async (userId: string) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;

  return {
    id: data.id,
    username: data.nombre_usuario,
    displayName: data.nombre_completo,
    avatar: data.avatar_url
  };
};