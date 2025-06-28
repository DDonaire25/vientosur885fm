import React from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

interface PostActionsProps {
  isLiked: boolean;
  isFavorite: boolean;
  likes: number;
  comments: number;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onFavorite: () => void;
}

const PostActions: React.FC<PostActionsProps> = ({ isLiked, isFavorite, likes, comments, onLike, onComment, onShare, onFavorite }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center space-x-6">
      <button onClick={onLike} className="flex items-center space-x-1 group">
        <Heart className={`h-5 w-5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600 dark:text-gray-400 group-hover:text-red-500'}`} />
        <span className={`text-sm ${isLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400 group-hover:text-red-500'}`}>{likes}</span>
      </button>
      <button onClick={onComment} className="flex items-center space-x-1 group">
        <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-500" />
        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-primary-500">{comments}</span>
      </button>
      <button onClick={onShare} className="flex items-center group" title="Compartir">
        <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-500" />
      </button>
    </div>
    <button onClick={onFavorite} className="flex items-center group">
      <Bookmark className={`h-5 w-5 ${isFavorite ? 'text-primary-500 fill-primary-500' : 'text-gray-600 dark:text-gray-400 group-hover:text-primary-500'}`} />
    </button>
  </div>
);

export default PostActions;
