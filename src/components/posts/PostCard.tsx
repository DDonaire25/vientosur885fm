import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, Trash } from 'lucide-react';
import { Post, formatPostDate, getUserById, usePostStore } from '../../store/postStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface PostCardProps {
  post: Post;
}

const urlRegex = /(https?:\/\/[\w\-\.\/?#&=;%+~]+)|(www\.[\w\-\.\/?#&=;%+~]+)/gi;

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [postUser, setPostUser] = useState<any>(null);
  const [commentUsers, setCommentUsers] = useState<Record<string, any>>({});
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);

  const { user } = useAuthStore();
  const { toggleLike, addComment, toggleFavorite } = usePostStore();

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

  // Cargar usuarios de los comentarios
  useEffect(() => {
    let isMounted = true;
    setLoadingComments(true);
    (async () => {
      const ids = Array.from(new Set(post.comments.map(c => c.userId)));
      const users: Record<string, any> = {};
      await Promise.all(ids.map(async (id) => {
        const u = await getUserById(id);
        if (u) users[id] = u;
      }));
      if (isMounted) {
        setCommentUsers(users);
        setLoadingComments(false);
      }
    })();
    return () => { isMounted = false; };
  }, [post.comments]);

  const isLiked = user ? post.likes.includes(user.id) : false;
  
  const handleLike = () => {
    if (user) {
      toggleLike(post.id, user.id);
    }
  };
  
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && commentText.trim()) {
      await addComment(post.id, user.id, commentText);
      setCommentText('');
      // Refrescar usuarios de comentarios tras agregar uno nuevo
      const ids = Array.from(new Set([...post.comments.map(c => c.userId), user.id]));
      const users: Record<string, any> = {};
      await Promise.all(ids.map(async (id) => {
        const u = await getUserById(id);
        if (u) users[id] = u;
      }));
      setCommentUsers(users);
    }
  };
  
  const handleFavorite = () => {
    toggleFavorite(post.id);
  };
  
  const handleShare = () => {
    // In a real app, implement sharing functionality
    alert('Sharing functionality would be implemented here');
  };

  const handleDelete = async () => {
    if (!user || user.id !== post.userId) return;
    if (!window.confirm('¿Estás seguro de eliminar este post?')) return;
    try {
      const { error } = await supabase
        .from('publicaciones')
        .delete()
        .eq('id', post.id);
      if (error) throw error;
      toast.success('Post eliminado exitosamente');
      // Elimina de la UI si existe la función
    } catch (error) {
      toast.error('Error al eliminar el post');
    }
  };
  
  return (
    <article className="feed-item">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="avatar">
            {loadingUser ? (
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            ) : (
              <img 
                src={postUser?.avatar || '/default-avatar.png'} 
                alt={postUser?.displayName || 'Usuario'} 
                className="avatar-img"
              />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {loadingUser ? <span className="bg-gray-200 rounded w-20 h-4 inline-block animate-pulse" /> : postUser?.displayName || 'Usuario'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatPostDate(post.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <MoreHorizontal className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
          {user && user.id === post.userId && (
            <button onClick={handleDelete} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900">
              <Trash className="h-5 w-5 text-red-500" />
            </button>
          )}
        </div>
      </div>
      
      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="mb-3 text-gray-900 dark:text-white">{post.content}</p>
      </div>
      
      {/* Enlaces en el contenido del post */}
      {post.content && post.content.match(urlRegex) && (
        <div className="mb-3">
          {post.content.match(urlRegex)?.map((url, idx) => (
            <div key={idx} className="mb-2">
              <a
                href={url.startsWith('http') ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 underline break-all"
              >
                {url}
              </a>
            </div>
          ))}
        </div>
      )}
      
      {/* Post Media */}
      {post.mediaUrl && post.type === 'image' && (
        <div className="relative pb-3">
          <img 
            src={post.mediaUrl} 
            alt="Post media" 
            className="w-full object-cover max-h-[500px]"
          />
        </div>
      )}
      {post.mediaUrl && post.type === 'video' && (
        <div className="relative pb-3">
          <video src={post.mediaUrl} controls className="w-full max-h-[500px] rounded-lg" />
        </div>
      )}
      {post.mediaUrl && post.type === 'audio' && (
        <div className="relative pb-3">
          <audio src={post.mediaUrl} controls className="w-full" />
        </div>
      )}
      {post.mediaUrl && post.type === 'document' && (
        <div className="relative pb-3">
          <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">Ver documento</a>
        </div>
      )}
      
      {/* Post Actions */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center space-x-6">
          <button 
            onClick={handleLike}
            className="flex items-center space-x-1 group"
          >
            <Heart 
              className={`h-5 w-5 ${isLiked 
                ? 'text-red-500 fill-red-500' 
                : 'text-gray-600 dark:text-gray-400 group-hover:text-red-500'}`} 
            />
            <span className={`text-sm ${isLiked 
              ? 'text-red-500' 
              : 'text-gray-600 dark:text-gray-400 group-hover:text-red-500'}`}>
              {post.likes.length}
            </span>
          </button>
          
          <button 
            onClick={() => setIsCommentExpanded(!isCommentExpanded)}
            className="flex items-center space-x-1 group"
          >
            <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-primary-500">
              {post.comments.length}
            </span>
          </button>
          
          <button 
            onClick={handleShare}
            className="flex items-center group"
          >
            <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-500" />
          </button>
        </div>
        
        <button 
          onClick={handleFavorite}
          className="flex items-center group"
        >
          <Bookmark 
            className={`h-5 w-5 ${post.isFavorite 
              ? 'text-primary-500 fill-primary-500' 
              : 'text-gray-600 dark:text-gray-400 group-hover:text-primary-500'}`}
          />
        </button>
      </div>
      
      {/* Comments */}
      {(post.comments.length > 0 || isCommentExpanded) && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
          {post.comments.length > 0 && (
            <div className="mb-3 space-y-3">
              {post.comments.slice(0, isCommentExpanded ? undefined : 2).map(comment => {
                const commentUser = commentUsers[comment.userId];
                return (
                  <div key={comment.id} className="flex space-x-2">
                    <div className="flex-shrink-0">
                      <div className="avatar w-8 h-8">
                        {loadingComments ? (
                          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                        ) : (
                          <img 
                            src={commentUser?.avatar || '/default-avatar.png'} 
                            alt={commentUser?.displayName || 'Usuario'} 
                            className="avatar-img"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white dark:bg-gray-900 p-2 rounded-lg">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {loadingComments ? <span className="bg-gray-200 rounded w-16 h-3 inline-block animate-pulse" /> : commentUser?.displayName || 'Usuario'}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {comment.content}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatPostDate(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {post.comments.length > 2 && !isCommentExpanded && (
                <button 
                  onClick={() => setIsCommentExpanded(true)}
                  className="text-sm text-primary-600 dark:text-primary-400 font-medium"
                >
                  View all {post.comments.length} comments
                </button>
              )}
            </div>
          )}
          
          {user && (
            <form onSubmit={handleComment} className="flex items-center space-x-2">
              <div className="avatar w-8 h-8">
                <img 
                  src={user.avatar} 
                  alt={user.displayName} 
                  className="avatar-img"
                />
              </div>
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 bg-white dark:bg-gray-900 rounded-full px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button 
                type="submit"
                disabled={!commentText.trim()}
                className="text-sm font-medium text-primary-600 dark:text-primary-400 disabled:opacity-50"
              >
                Post
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
};

export default PostCard;