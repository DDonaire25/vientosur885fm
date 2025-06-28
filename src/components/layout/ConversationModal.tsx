import React, { useState } from 'react';
import { ConversationsList } from '../messages/ConversationsList';
import BottomSheetModal from '../shared/BottomSheetModal';
import { ChatWindow } from '../messages/ChatWindow';
import UserQuickActions from '../profile/UserQuickActions';
import { supabase } from '../../lib/supabase';

interface ConversationModalProps {
  open: boolean;
  onClose: () => void;
}

// Añadimos bio y followersCount al tipo de chatUser
interface ChatUser {
  id: string;
  name?: string;
  avatar?: string;
  username?: string;
  bio?: string;
  followersCount?: number;
}

const ConversationModal: React.FC<ConversationModalProps> = ({ open, onClose }) => {
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Detectar si es móvil para bottom sheet, escritorio centrado
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Handler para seleccionar usuario y cargar datos reales
  const handleSelectUser = async (userId: string, userName: string, userAvatar: string) => {
    setLoadingProfile(true);
    // Cargar datos reales del usuario desde Supabase
    const { data: userData } = await supabase.from('usuarios').select('id, nombre_usuario, nombre_completo, avatar_url, bio').eq('id', userId).single();
    // Contar seguidores
    const { count: followersCount } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', userId);
    setChatUser({
      id: userId,
      name: userData?.nombre_completo || userName,
      avatar: userData?.avatar_url || userAvatar,
      username: userData?.nombre_usuario,
      bio: userData?.bio,
      followersCount: followersCount ?? undefined,
    });
    setLoadingProfile(false);
  };

  return (
    <BottomSheetModal
      open={open}
      onClose={onClose}
      title={undefined}
      height={'100vh'}
      desktopMode={!isMobile}
      className={!isMobile ? 'max-w-[98vw] w-full' : ''}
    >
      {/* Layout de 3 columnas solo en escritorio */}
      <div className={`h-full w-full ${isMobile ? '' : 'flex flex-row bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden'} animate-fade-in`}>
        {/* Columna 1: Lista de conversaciones */}
        {isMobile ? (
          chatUser ? (
            <div className="h-full w-full flex flex-col">
              <button
                className="p-2 text-primary-600 font-semibold text-left flex items-center gap-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"
                onClick={() => setChatUser(null)}
              >
                ← Volver a conversaciones
              </button>
              <div className="flex-1 flex flex-col">
                <ChatWindow
                  otherUserId={chatUser.id}
                  otherUserName={chatUser.name}
                  otherUserAvatar={chatUser.avatar}
                />
              </div>
            </div>
          ) : (
            <div className="h-full w-full">
              <ConversationsList onSelectUser={handleSelectUser} />
            </div>
          )
        ) : (
          <>
            <div className="flex-[1_1_0%] border-r border-gray-200 dark:border-gray-800 flex flex-col items-center p-6 h-full bg-white dark:bg-gray-900">
              <ConversationsList onSelectUser={handleSelectUser} />
            </div>
            {/* Columna 2: Chat activo (más grande) */}
            <div className="flex-[2_2_0%] flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-0">
              {chatUser ? (
                <ChatWindow
                  otherUserId={chatUser.id}
                  otherUserName={chatUser.name}
                  otherUserAvatar={chatUser.avatar}
                />
              ) : (
                <div className="flex flex-1 items-center justify-center text-gray-400 text-lg">Selecciona una conversación</div>
              )}
            </div>
            {/* Columna 3: Perfil compacto con detalles y acciones */}
            <div className="flex-[1_1_0%] flex flex-col items-center p-6 bg-white dark:bg-gray-900">
              {loadingProfile ? (
                <div className="flex flex-col items-center justify-center h-full w-full text-gray-400">
                  <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 mb-3 animate-pulse" />
                  <div className="font-bold text-lg mb-1">Cargando perfil...</div>
                </div>
              ) : chatUser ? (
                <>
                  <img src={chatUser.avatar || '/default-avatar.png'} alt={chatUser.name || chatUser.id} className="w-20 h-20 rounded-full mb-3 object-cover border" />
                  <div className="font-bold text-lg text-gray-900 dark:text-white mb-1">{chatUser.name}</div>
                  <div className="text-sm text-gray-500 mb-2">@{chatUser.username || chatUser.id}</div>
                  {/* Acciones principales */}
                  <UserQuickActions user={{ id: chatUser.id, username: chatUser.username || '', displayName: chatUser.name || '', avatar: chatUser.avatar || '' }} />
                  {/* Detalles adicionales: biografía y seguidores */}
                  <div className="mt-4 w-full text-left">
                    <div className="mb-2">
                      <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Biografía:</span>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{chatUser.bio || 'Sin biografía.'}</div>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Seguidores:</span>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{chatUser.followersCount ?? '—'}</span>
                    </div>
                  </div>
                  {/* Acciones extra: bloquear, reportar, eliminar chat */}
                  <div className="mt-4 w-full flex flex-col gap-2">
                    <button className="w-full py-2 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 transition text-sm font-medium" onClick={() => alert('Función de bloquear próximamente')}>Bloquear usuario</button>
                    <button className="w-full py-2 rounded bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-800 transition text-sm font-medium" onClick={() => alert('Función de reportar próximamente')}>Reportar usuario</button>
                    <button className="w-full py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium" onClick={() => alert('Función de eliminar chat próximamente')}>Eliminar chat</button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full text-gray-400">
                  <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 mb-3" />
                  <div className="font-bold text-lg mb-1">Perfil</div>
                  <div className="text-sm text-gray-500 mb-2">Selecciona una conversación</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </BottomSheetModal>
  );
};

export default ConversationModal;
