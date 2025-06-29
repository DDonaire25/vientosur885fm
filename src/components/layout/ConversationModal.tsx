import React, { useState } from 'react';
import { ConversationsList } from '../messages/ConversationsList';
import BottomSheetModal from '../shared/BottomSheetModal';
import { ChatWindow } from '../messages/ChatWindow';
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

  // Detectar si es móvil para bottom sheet, escritorio centrado
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Handler para seleccionar usuario y cargar datos reales
  const handleSelectUser = async (userId: string, userName: string, userAvatar: string) => {
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
  };

  return (
    <BottomSheetModal
      open={open}
      onClose={onClose}
      title={undefined}
      height={'100vh'}
      desktopMode={!isMobile}
      className={!isMobile ? 'max-w-[75vw] w-full' : ''}
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
            <div className="flex-[2_2_0%] flex flex-col h-full bg-gray-50 dark:bg-gray-900 p-0">
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
            {/* Columna de perfil eliminada */}
          </>
        )}
      </div>
    </BottomSheetModal>
  );
};

export default ConversationModal;
