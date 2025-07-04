import { useEffect } from 'react';
import PostCard from '../components/posts/PostCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { usePostStore } from '../store/postStore';
import { Bookmark } from 'lucide-react';

const FavoritesPage = () => {
  const { isLoading, fetchPosts, getFavoritePosts } = usePostStore();
  const favoritePosts = getFavoritePosts();
  
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);
  
  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="py-8 flex justify-center">
          <LoadingSpinner message="Loading favorites..." />
        </div>
      ) : favoritePosts.length === 0 ? (
        <div className="card py-8 text-center">
          <div className="flex justify-center mb-3">
            <Bookmark className="h-12 w-12 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">No favorites yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Bookmark posts to save them here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {favoritePosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              user={{
                nombre: post.autor?.displayName || 'Usuario',
                avatar: post.autor?.avatar || '/default-avatar.png',
                verificado: post.autor?.verificado || false
              }}
              date={post.createdAt}
              media={post.mediaUrls}
              text={post.content}
              backgroundColor={post.backgroundColor}
              linkData={post.linkData}
              pollData={post.pollData}
              stats={{
                likes: post.likes?.length || 0,
                comentarios: post.comments?.length || 0,
                compartidos: post.shares || 0,
                votos: post.pollData?.totalVotes || 0
              }}
              onLike={() => usePostStore.getState().toggleLike(post.id, post.userId)}
              onComment={() => {}}
              onShare={() => {}}
              onVote={() => {}}
              actions={[]}
              onFavorite={() => usePostStore.getState().toggleFavorite(post.id)}
              onDeleted={() => fetchPosts()}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;