import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { ChatWindow } from '../messages/ChatWindow';
import { HiOutlineMinus, HiOutlineX } from 'react-icons/hi';

interface ChatUserModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  userAvatar?: string;
}

const ChatUserModal: React.FC<ChatUserModalProps> = ({ open, onClose, userId, userName, userAvatar }) => {
  const [minimized, setMinimized] = useState(false);
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose}>
      <div className={`w-full max-w-md transition-all duration-300 ${minimized ? 'h-16 overflow-hidden' : ''}`}>
        <div className="flex items-center justify-between p-2 border-b bg-white rounded-t-xl">
          <div className="flex items-center gap-2">
            {userAvatar && <img src={userAvatar} alt={userName || userId} className="w-8 h-8 rounded-full" />}
            <span className="font-semibold text-sm text-blue-600">{userName || userId}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMinimized(v => !v)} className="text-gray-400 hover:text-blue-500 text-xl" title="Minimizar">
              <HiOutlineMinus />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-2xl" title="Cerrar">
              <HiOutlineX />
            </button>
          </div>
        </div>
        {!minimized && (
          <ChatWindow otherUserId={userId} otherUserName={userName} otherUserAvatar={userAvatar} />
        )}
      </div>
    </Modal>
  );
};

export default ChatUserModal;
