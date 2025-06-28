import React from 'react';

interface PostStatsProps {
  likes: number;
  comments: number;
  shares: number;
  votes?: number;
}

const PostStats: React.FC<PostStatsProps> = ({ likes, comments, shares, votes }) => (
  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
    <span>👍 {likes} Me gusta</span>
    <span>💬 {comments} Comentarios</span>
    <span>🔁 {shares} Compartidos</span>
    {votes !== undefined && <span>🗳️ {votes} Votos</span>}
  </div>
);

export default PostStats;
