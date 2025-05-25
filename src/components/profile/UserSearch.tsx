import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import UserQuickActions from './UserQuickActions';
import { Link } from 'react-router-dom';

export const UserSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data } = await supabase
      .from('usuarios')
      .select('id, nombre_usuario, nombre_completo, avatar_url')
      .ilike('nombre_usuario', `%${query}%`);
    setResults(data || []);
    setLoading(false);
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar usuario..."
          className="input"
        />
        <button type="submit" className="btn btn-primary">Buscar</button>
      </form>
      {loading && <div>Buscando...</div>}
      <div className="space-y-2">
        {results.map(user => (
          <Link
            key={user.id}
            to={`/profile/${user.nombre_usuario}`}
            className="block"
            tabIndex={0}
            aria-label={`Ver perfil de ${user.nombre_completo || user.nombre_usuario}`}
          >
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="flex items-center">
                <img
                  src={user.avatar_url || '/default-avatar.png'}
                  alt={user.nombre_completo || user.nombre_usuario}
                  className="h-9 w-9 rounded-full mr-3"
                />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{user.nombre_completo}</span>
                  <span className="text-xs text-gray-500 ml-2">@{user.nombre_usuario}</span>
                </div>
              </div>
              <UserQuickActions
                user={{
                  id: user.id,
                  username: user.nombre_usuario,
                  displayName: user.nombre_completo,
                  avatar: user.avatar_url || '/default-avatar.png',
                }}
              />
            </div>
          </Link>
        ))}
        {!loading && results.length === 0 && query && <div>No se encontraron usuarios.</div>}
      </div>
    </div>
  );
};
