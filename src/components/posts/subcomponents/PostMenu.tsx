import React from 'react';

interface PostMenuProps {
  actions: { label: string; onClick: () => void; danger?: boolean }[];
  onClose: () => void;
}

const PostMenu: React.FC<PostMenuProps> = ({ actions, onClose }) => (
  <div className="z-[9999] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 min-w-[180px] animate-fade-in">
    <ul className="py-2">
      {actions.map((action, idx) => (
        <li key={idx}>
          <button
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 ${action.danger ? 'text-red-600 hover:bg-red-50' : ''}`}
            onClick={() => { action.onClick(); onClose(); }}
          >
            {action.label}
          </button>
        </li>
      ))}
      <li>
        <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={onClose}>
          Cancelar
        </button>
      </li>
    </ul>
  </div>
);

export default PostMenu;
