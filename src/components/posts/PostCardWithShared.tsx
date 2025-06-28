import React, { useState } from 'react';
import { Post } from '../../store/postStore';
import { MediaItem } from './subcomponents/MediaCarousel';
import { LinkData } from './subcomponents/LinkPreview';
import { PollData } from './subcomponents/Poll';
import CommentThread, { CommentData } from '../shared/CommentThread';
import ReactionsBar, { ReactionData } from '../shared/ReactionsBar';
import MediaCarousel from './subcomponents/MediaCarousel';
import LinkPreview from './subcomponents/LinkPreview';
import Poll from './subcomponents/Poll';
import { useAuthStore } from '../../store/authStore';
import { useSupabaseFetch } from '../../hooks/useSupabaseFetch';

interface PostCardWithSharedProps {
  post: Post;
  user: { nombre: string; avatar: string; verificado?: boolean; id?: string };
  media?: MediaItem[];
  text: string;
  backgroundColor?: string;
  linkData?: LinkData;
  pollData?: PollData;
  onVote?: (optionId: string) => void;
}

const PostCardWithShared: React.FC<PostCardWithSharedProps> = ({ post, user, media, text, backgroundColor, linkData, pollData, onVote }) => {
  const { user: currentUser } = useAuthStore();
  const [likes, setLikes] = useState<string[]>(post.likes);
  const [isLiked, setIsLiked] = useState(currentUser ? post.likes.includes(currentUser.id) : false);

  // Cargar datos de usuario desde Supabase de forma robusta
  const { data: userData, loading: loadingUser, error: errorUser } = useSupabaseFetch(
    () =>
      user.id
        ? import('../../lib/supabase').then(({ supabase }) =>
            supabase.from('usuarios').select('id, nombre, avatar, verificado').eq('id', user.id).single()
          )
        : Promise.resolve({ data: null, error: null }),
    [user.id]
  );
  const displayUser = userData || user;

  // Adaptar los datos de comentarios y reacciones al formato de los componentes compartidos
  const comments: CommentData[] = post.comments.map(c => ({
    id: c.id,
    userId: c.userId,
    userName: displayUser.nombre,
    userAvatar: displayUser.avatar,
    content: c.content,
    createdAt: c.createdAt,
    replies: [], // TODO: mapear respuestas anidadas si existen
    canEdit: true, // TODO: lógica real
    canDelete: true // TODO: lógica real
  }));
  const reactions: ReactionData[] = [
    { emoji: '❤️', count: likes.length, reacted: isLiked },
    // TODO: mapear otros tipos de reacciones
  ];

  // Manejar reacción (like)
  const handleLike = () => {
    if (!currentUser) return;
    if (isLiked) {
      setLikes(likes.filter(id => id !== currentUser.id));
    } else {
      setLikes([...likes, currentUser.id]);
    }
    setIsLiked(!isLiked);
    // Aquí puedes agregar lógica para actualizar en la base de datos si es necesario
  };

  return (
    <article className="feed-item w-full border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-none rounded-none">
      {/* Header con loading/error */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        {loadingUser ? (
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        ) : errorUser ? (
          <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center text-xs">!</div>
        ) : (
          <img
            src={displayUser.avatar || '/default-avatar.png'}
            alt={displayUser.nombre || 'Usuario'}
            className="w-10 h-10 rounded-full object-cover border"
          />
        )}
        <span className="font-semibold text-gray-900 dark:text-white text-sm">
          {loadingUser ? 'Cargando...' : displayUser.nombre || 'Usuario'}
        </span>
      </div>
      {/* Media */}
      {media && media.length > 0 && <MediaCarousel media={media} />}
      {/* Link Preview */}
      {linkData && <LinkPreview link={linkData} />}
      {/* Poll */}
      {pollData && <Poll poll={pollData} onVote={onVote ?? (() => {})} />}
      <div className="px-4 pb-3 pt-2" style={backgroundColor ? { backgroundColor } : {}}>
        <span>{text}</span>
      </div>
      <div className="flex items-center space-x-4 py-2 px-4 justify-between">
        <ReactionsBar reactions={reactions} onReact={handleLike} />
      </div>
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl border-t border-gray-200 dark:border-gray-700 transition-all duration-300">
        <CommentThread comments={comments} />
      </div>
    </article>
  );
};

export default PostCardWithShared;
