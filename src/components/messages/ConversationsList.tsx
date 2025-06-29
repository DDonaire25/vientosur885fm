import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRecentConversations } from '../../hooks/useRecentConversations';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import Modal from '../ui/Modal';
import { UserSearch } from '../profile/UserSearch';
import { FiMessageCircle, FiTrash, FiArchive } from 'react-icons/fi';

interface ConversationsListProps {
  onSelectUser: (userId: string, userName: string, userAvatar: string) => void;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({ onSelectUser }) => {
  const { user } = useAuthStore();
  const { conversations, fetchConversations } = useRecentConversations(user?.id || '');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [loading] = useState(false); // loading solo para compatibilidad visual, no se usa setLoading
  const [swipeId, setSwipeId] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const swipeStartX = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Handler para seleccionar conversación de la lista
  const handleSelectConv = (u: any) => {
    setSelectedConvId(u.id);
    onSelectUser(u.id, u.displayName, u.avatar);
  };

  // Handler para seleccionar usuario desde el buscador
  const handleUserSearchSelect = (user: any) => {
    setShowUserSearch(false);
    if (user) {
      onSelectUser(user.id, user.nombre_completo || user.nombre_usuario, user.avatar_url || '/default-avatar.png');
    }
  };

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const el = listRef.current;
      if (!el || loading || !hasMore) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
        setLimit((prev) => prev + 20);
        setHasMore(conversations.length > limit + 20);
      }
    };
    const el = listRef.current;
    if (el) el.addEventListener('scroll', handleScroll);
    return () => { if (el) el.removeEventListener('scroll', handleScroll); };
  }, [loading, hasMore, conversations.length, limit]);

  // Filtrar conversaciones activas y archivadas
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  useEffect(() => {
    async function fetchBlocked() {
      if (!user) return;
      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id);
      if (!error && data) {
        setBlockedIds(data.map((b: any) => b.blocked_id));
      }
    }
    fetchBlocked();
  }, [user]);

  const [blockedByIds, setBlockedByIds] = useState<string[]>([]);
  useEffect(() => {
    async function fetchBlockedBy() {
      if (!user) return;
      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocker_id, blocked_id')
        .eq('blocked_id', user.id);
      if (!error && data) {
        setBlockedByIds(data.map((b: any) => b.blocker_id));
      }
    }
    fetchBlockedBy();
  }, [user]);

  const activeConversations = conversations.filter((c: any) => {
    if (!user) return false;
    const otherId = c.user2 === user.id ? c.user1 : c.user2;
    return !c.archived && !blockedIds.includes(otherId) && !blockedByIds.includes(otherId);
  });
  const archivedConversations = conversations.filter((c: any) => {
    if (!user) return false;
    const otherId = c.user2 === user.id ? c.user1 : c.user2;
    return c.archived && !blockedIds.includes(otherId) && !blockedByIds.includes(otherId);
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 relative">
      {/* Header con nombre de usuario y botón nuevo mensaje */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 sticky top-0 z-10">
        <span className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate max-w-[60%]">{user?.displayName || user?.username || 'Usuario'}</span>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center justify-center p-2 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 text-white shadow hover:scale-105 transition"
            title="Nuevo mensaje"
            aria-label="Nuevo mensaje"
            onClick={() => setShowUserSearch(true)}
          >
            <FiMessageCircle className="w-5 h-5" />
          </button>
          {archivedConversations.length > 0 && (
            <button
              className="inline-flex items-center justify-center p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
              title={showArchived ? 'Ocultar archivadas' : 'Ver archivadas'}
              aria-label={showArchived ? 'Ocultar archivadas' : 'Ver archivadas'}
              onClick={() => setShowArchived(v => !v)}
            >
              <FiArchive className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      <Modal open={showUserSearch} onClose={() => setShowUserSearch(false)} className="w-[50vw]">
        <div className="p-4">
          <h2 className="font-bold mb-2 text-lg text-center">Buscar usuario para chatear</h2>
          <UserSearch onSelectUser={handleUserSearchSelect} />
        </div>
      </Modal>
      {/* Lista de conversaciones compacta */}
      <div ref={listRef} className="flex-1 overflow-y-auto divide-y pb-24 sm:pb-4" style={{ minHeight: 0 }}>
        <AnimatePresence initial={false}>
        {loading ? (
          <div className="p-4">Cargando conversaciones...</div>
        ) : showArchived ? (
          archivedConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
              <span className="text-gray-400 text-center">No tienes conversaciones archivadas.</span>
            </div>
          ) : (
            archivedConversations
              .sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime())
              .map((u) => (
                <motion.div
                  key={u.id}
                  data-testid="archived-conversation-item"
                  className="relative px-3 py-2 flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.18 }}
                >
                  <span className="relative inline-block">
                    <img src={u.avatar} alt={u.displayName} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100">{u.displayName}</span>
                  </div>
                  <button
                    className="ml-2 p-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    title={`Desarchivar conversación con ${u.displayName}`}
                    aria-label={`Desarchivar conversación con ${u.displayName}`}
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const { error } = await supabase
                          .from('conversations')
                          .update({ archived: false })
                          .eq('id', u.id);
                        if (error) throw error;
                        await fetchConversations();
                        toast.success('Conversación desarchivada');
                      } catch {
                        toast.error('Error al desarchivar la conversación');
                      }
                    }}
                    type="button"
                  >
                    <FiArchive className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
          )
        ) : activeConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 gap-4" data-testid="no-conversations">
            <span className="text-gray-400 text-center">No tienes conversaciones aún.</span>
          </div>
        ) : (
          activeConversations
            .sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime())
            .slice(0, limit)
            .map((u) => (
              <motion.div
                key={u.id}
                data-testid="conversation-item"
                className={`relative px-3 py-2 cursor-pointer flex items-center gap-3 rounded-lg transition-all touch-target group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm ${selectedConvId === u.id ? 'bg-primary-100 dark:bg-primary-900/30 border border-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                tabIndex={0}
                role="button"
                aria-label={`Conversación con ${u.displayName}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.18 }}
                onClick={() => handleSelectConv(u)}
                onTouchStart={e => {
                  swipeStartX.current = e.touches[0].clientX;
                  setSwipeId(u.id);
                }}
                onTouchMove={e => {
                  if (swipeStartX.current !== null && swipeId === u.id) {
                    const deltaX = e.touches[0].clientX - swipeStartX.current;
                    if (Math.abs(deltaX) > 0) setSwipeX(deltaX);
                  }
                }}
                onTouchEnd={async () => {
                  if (swipeStartX.current !== null && swipeId === u.id) {
                    if (swipeX < -80) {
                      // Swipe a la izquierda: eliminar
                      if (user && window.confirm('¿Eliminar esta conversación? Esta acción no se puede deshacer.')) {
                        try {
                          const { error } = await supabase.from('messages')
                            .delete()
                            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${u.id}),and(sender_id.eq.${u.id},receiver_id.eq.${user.id})`);
                          if (error) throw error;
                          await fetchConversations();
                          toast.success('Conversación eliminada');
                        } catch {
                          toast.error('Error al eliminar la conversación');
                        }
                      }
                    } else if (swipeX > 80) {
                      // Swipe a la derecha: archivar REAL
                      if (user) {
                        try {
                          // Buscar la conversación entre ambos usuarios
                          const { data: conv, error: convError } = await supabase
                            .from('conversations')
                            .select('id, archived')
                            .or(`and(user1.eq.${user.id},user2.eq.${u.id}),and(user1.eq.${u.id},user2.eq.${user.id})`)
                            .maybeSingle();
                          if (convError) throw convError;
                          if (!conv) throw new Error('No se encontró la conversación');
                          const { error: updateError } = await supabase
                            .from('conversations')
                            .update({ archived: true })
                            .eq('id', conv.id);
                          if (updateError) throw updateError;
                          await fetchConversations();
                          toast.success('Conversación archivada');
                        } catch (err) {
                          toast.error('Error al archivar la conversación');
                        }
                      }
                    }
                    setSwipeX(0);
                    setSwipeId(null);
                    swipeStartX.current = null;
                  }
                }}
                style={swipeId === u.id ? { transform: `translateX(${swipeX}px)`, transition: 'transform 0.15s' } : {}}
              >
                <span className="relative inline-block">
                  <img src={u.avatar} alt={u.displayName} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
                  {/* Indicador de estado en línea/offline */}
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${u.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                    title={u.isOnline ? 'En línea' : 'Desconectado'}
                  />
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100">{u.displayName}</span>
                </div>
                {u.unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold min-w-[18px] h-5 px-1 ml-1" aria-label={`${u.unreadCount} mensajes no leídos`}>
                    {u.unreadCount > 9 ? '9+' : u.unreadCount}
                  </span>
                )}
                {/* Botón eliminar conversación */}
                <button
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100 text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  title={`Eliminar conversación con ${u.displayName}`}
                  aria-label={`Eliminar conversación con ${u.displayName}`}
                  tabIndex={0}
                  disabled={!user}
                  onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && user) e.currentTarget.click(); }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!user) return;
                    if (!window.confirm('¿Eliminar esta conversación? Esta acción no se puede deshacer.')) return;
                    try {
                      const { error } = await supabase.from('messages')
                        .delete()
                        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${u.id}),and(sender_id.eq.${u.id},receiver_id.eq.${user.id})`);
                      if (error) throw error;
                      await fetchConversations();
                      toast.success('Conversación eliminada');
                    } catch (err) {
                      toast.error('Error al eliminar la conversación');
                    }
                  }}
                  type="button"
                >
                  <FiTrash className="w-4 h-4" />
                </button>
                {/* Indicador visual de swipe */}
                {swipeId === u.id && Math.abs(swipeX) > 40 && (
                  <span className={`absolute inset-y-0 ${swipeX < 0 ? 'right-4 text-red-600' : 'left-4 text-blue-600'} flex items-center text-lg font-bold pointer-events-none`}>
                    {swipeX < 0 ? <FiTrash className="inline w-5 h-5 mr-1" /> : <FiArchive className="inline w-5 h-5 mr-1" />} {swipeX < 0 ? 'Eliminar' : 'Archivar'}
                  </span>
                )}
              </motion.div>
            ))
        )}
        </AnimatePresence>
        {hasMore && !loading && (
          <div className="p-4 text-center text-gray-400">Cargando más...</div>
        )}
      </div>
    </div>
  );
};
