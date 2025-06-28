import React from 'react';

export interface LinkData {
  url: string;
  image?: string;
  title?: string;
  description?: string;
}

const LinkPreview: React.FC<{ link: LinkData }> = ({ link }) => {
  if (!link) return null;
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 mb-2"
    >
      {link.image && (
        <img src={link.image} alt={link.title || 'Enlace'} className="w-24 h-24 object-cover flex-shrink-0" />
      )}
      <div className="p-3 flex-1 min-w-0">
        <div className="font-semibold text-gray-900 dark:text-white truncate">{link.title}</div>
        <div className="text-sm text-gray-600 dark:text-gray-300 truncate">{link.description}</div>
        <div className="text-xs text-primary-600 mt-1 truncate">{link.url}</div>
      </div>
    </a>
  );
};

export default LinkPreview;
