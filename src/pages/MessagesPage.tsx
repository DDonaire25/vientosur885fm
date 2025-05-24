import React, { useState, useEffect } from 'react';
import { Search, Plus, Phone, Video, Send, Image, Smile, MoreVertical, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuthStore } from '../store/authStore';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  isOnline: boolean;
}

const sampleConversations: Conversation[] = [
  {
    id: '1',
    participantId: '2',
    participantName: 'María González',
    participantAvatar: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=100',
    lastMessage: '¿Cuándo es la próxima exposición?',
    lastMessageTimestamp: '2025-05-19T14:22:00Z',
    unreadCount: 2,
    isOnline: true
  },
  {
    id: '2',
    participantId: '3',
    participantName: 'Carlos Moreno',
    participantAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
    lastMessage: 'Me encantaría colaborar en tu próximo proyecto',
    lastMessageTimestamp: '2025-05-18T09:15:00Z',
    unreadCount: 0,
    isOnline: false
  },
  {
    id: '3',
    participantId: '4',
    participantName: 'Laura Díaz',
    participantAvatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
    lastMessage: 'Gracias por compartir tu portfolio',
    lastMessageTimestamp: '2025-05-17T18:43:00Z',
    unreadCount: 0,
    isOnline: true
  }
];

const sampleMessages: Record<string, Message[]> = {
  '1': [
    {
      id: '101',
      senderId: '2',
      receiverId: '1',
      content: 'Hola, me encantó tu última exposición',
      timestamp: '2025-05-19T14:10:00Z',
      isRead: true
    },
    {
      id: '102',
      senderId: '1',
      receiverId: '2',
      content: '¡Gracias! Estoy muy contento con la recepción',
      timestamp: '2025-05-19T14:15:00Z',
      isRead: true
    },
    {
      id: '103',
      senderId: '2',
      receiverId: '1',
      content: '¿Cuándo es la próxima exposición?',
      timestamp: '2025-05-19T14:22:00Z',
      isRead: false
    }
  ]
};

const MessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const { user } = useAuthStore();
  const messageInputRef = React.useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Simular carga de conversaciones
    const loadConversations = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConversations(sampleConversations);
      setIsLoading(false);
    };
    
    loadConversations();
  }, []);
  
  useEffect(() => {
    if (activeConversation) {
      // Cargar mensajes para la conversación activa
      setMessages(sampleMessages[activeConversation.id] || []);
    }
  }, [activeConversation]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeConversation || !user) return;
    
    const newMsg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      senderId: user.id,
      receiverId: activeConversation.participantId,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isRead: false
    };
    
    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
    
    // Actualizar última mensaje en la conversación
    setConversations(prev => 
      prev.map(conv => 
        conv.id === activeConversation.id 
          ? { 
              ...conv, 
              lastMessage: newMessage.trim(),
              lastMessageTimestamp: new Date().toISOString()
            } 
          : conv
      )
    );
  };
  
  const handleEmojiSelect = (emoji: any) => {
    if (messageInputRef.current) {
      const input = messageInputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue =
        newMessage.slice(0, start) +
        (emoji.native || emoji.skins?.[0]?.native || '') +
        newMessage.slice(end);
      setNewMessage(newValue);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + 2, start + 2);
      }, 0);
    } else {
      setNewMessage(newMessage + (emoji.native || emoji.skins?.[0]?.native || ''));
    }
    setShowEmojiPicker(false);
  };
  
  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatConversationTime = (timestamp: string) => {
    const msgDate = new Date(timestamp);
    const today = new Date();
    
    if (msgDate.toDateString() === today.toDateString()) {
      return formatMessageTime(timestamp);
    }
    
    if (msgDate.getDate() === today.getDate() - 1) {
      return 'Ayer';
    }
    
    return msgDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };
  
  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <LoadingSpinner message="Cargando mensajes..." />
      </div>
    );
  }
  
  return (
    <div className={`pb-16 ${!activeConversation ? '' : 'hidden md:block'}`}>
      {/* Conversation List */}
      <div className={`${activeConversation ? 'hidden md:block' : ''}`}>
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mensajes</h2>
          <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
            <Plus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="mb-4 relative">
          <Search className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No se encontraron conversaciones</p>
            </div>
          ) : (
            filteredConversations.map(conversation => (
              <motion.div
                key={conversation.id}
                className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/70 cursor-pointer"
                whileHover={{ x: 2 }}
                onClick={() => setActiveConversation(conversation)}
              >
                <div className="flex items-center">
                  <div className="relative">
                    <div className="avatar h-12 w-12 mr-3">
                      <img 
                        src={conversation.participantAvatar} 
                        alt={conversation.participantName} 
                        className="avatar-img"
                      />
                    </div>
                    {conversation.isOnline && (
                      <div className="absolute right-3 bottom-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {conversation.participantName}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                        {formatConversationTime(conversation.lastMessageTimestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {conversation.lastMessage}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="ml-2 flex-shrink-0 bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      
      {/* Active Conversation */}
      {activeConversation && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-20 md:relative md:z-auto pb-16">
          {/* Conversation Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-3">
            <div className="flex items-center">
              <button 
                className="md:hidden p-2 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setActiveConversation(null)}
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <div className="avatar h-10 w-10 mr-3">
                <img 
                  src={activeConversation.participantAvatar} 
                  alt={activeConversation.participantName} 
                  className="avatar-img"
                />
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {activeConversation.participantName}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {activeConversation.isOnline ? 'En línea' : 'Fuera de línea'}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Phone className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Video className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Messages */}
          <div className="p-4 overflow-y-auto h-[calc(100vh-180px)]">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No hay mensajes aún</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Envía un mensaje para comenzar la conversación
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map(message => {
                  const isMine = message.senderId === user?.id;
                  
                  return (
                    <div 
                      key={message.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        isMine 
                          ? 'bg-primary-600 text-white rounded-tr-none'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none'
                      }`}>
                        <p>{message.content}</p>
                        <p className={`text-xs mt-1 text-right ${
                          isMine ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatMessageTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Message Input */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
            <form onSubmit={handleSendMessage} className="flex items-center relative">
              <button 
                type="button"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mr-2"
              >
                <Image className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <input 
                ref={messageInputRef}
                type="text"
                placeholder="Escribe un mensaje..."
                className="flex-1 input"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                type="button"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mx-2"
                onClick={() => setShowEmojiPicker((v) => !v)}
                aria-label="Insertar emoji"
                tabIndex={-1}
              >
                <Smile className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2 rounded-full bg-primary-600 text-white disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
              {showEmojiPicker && (
                <div className="absolute z-50 bottom-12 right-0">
                  <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="auto" />
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;