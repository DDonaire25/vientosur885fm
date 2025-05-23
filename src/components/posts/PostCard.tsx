import React, { useState } from 'react';
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, Trash } from 'lucide-react';
import { Post, formatPostDate, getUserById, usePostStore } from '../../store/postStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  const { user } = useAuthStore();
  const { toggleLike, addComment, toggleFavorite, removePost } = usePostStore();
  
  const postUser = getUserById(post.userId);
  const isLiked = user ? post.likes.includes(user.id) : false;
  
  const handleLike = () => {
    if (user) {
      toggleLike(post.id, user.id);
    }
  };
  
  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && commentText.trim()) {
      addComment(post.id, user.id, commentText);
      setCommentText('');
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
      if (removePost) removePost(post.id); // Elimina de la UI si existe la función
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
            <img 
              src={postUser?.avatar} 
              alt={postUser?.displayName} 
              className="avatar-img"
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {postUser?.displayName}
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
      
      {/* Post Media */}
      {post.mediaUrl && (
        <div className="relative pb-3">
          <img 
            src={post.mediaUrl} 
            alt="Post media" 
            className="w-full object-cover max-h-[500px]"
          />
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
                const commentUser = getUserById(comment.userId);
                return (
                  <div key={comment.id} className="flex space-x-2">
                    <div className="flex-shrink-0">
                      <div className="avatar w-8 h-8">
                        <img 
                          src={commentUser?.avatar} 
                          alt={commentUser?.displayName} 
                          className="avatar-img"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white dark:bg-gray-900 p-2 rounded-lg">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {commentUser?.displayName}
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