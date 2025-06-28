import React from 'react';

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollData {
  question: string;
  options: PollOption[];
  userVote?: string;
  totalVotes: number;
}

interface PollProps {
  poll: PollData;
  onVote: (optionId: string) => void;
}

const Poll: React.FC<PollProps> = ({ poll, onVote }) => {
  return (
    <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="font-semibold mb-2 text-gray-900 dark:text-white">{poll.question}</div>
      <div className="space-y-2">
        {poll.options.map(opt => (
          <button
            key={opt.id}
            className={`w-full text-left px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors
              ${poll.userVote === opt.id ? 'bg-primary-100 dark:bg-primary-900 border-primary-500' : 'bg-white dark:bg-gray-900'}`}
            onClick={() => onVote(opt.id)}
            disabled={!!poll.userVote}
          >
            <span className="font-medium">{opt.text}</span>
            {poll.userVote && (
              <span className="float-right text-xs text-gray-500 ml-2">{opt.votes} votos ({((opt.votes / poll.totalVotes) * 100 || 0).toFixed(0)}%)</span>
            )}
          </button>
        ))}
      </div>
      {poll.userVote && (
        <div className="mt-2 text-xs text-gray-500">Total votos: {poll.totalVotes}</div>
      )}
    </div>
  );
};

export default Poll;
