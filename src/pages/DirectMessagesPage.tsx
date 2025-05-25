import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import AudioRecorder from '../components/ui/AudioRecorder';
import VideoRecorder from '../components/ui/VideoRecorder';
import { Link } from 'react-router-dom';
import { MoreVertical, Search, Smile } from 'lucide-react';

const tabs = ['Primario', 'General', 'Solicitudes'];

const DirectMessagesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState('General');
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [sticker, setSticker] = useState<string | null>(null);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Cargar conversaciones
  useEffect(() => {
    if (!user) return;
    setLoadingConvs(true);
    const fetchConversations = async () => {
      const { data: allMsgs } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      if (!allMsgs) {
        setConversations([]);
        setLoadingConvs(false);
        return;
      }
      // Agrupar por usuario
      const userMap: Record<string, any> = {};
      for (const msg of allMsgs) {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!userMap[otherId]) {
          const { data: userData } = await supabase.from('usuarios').select('nombre_usuario,avatar_url').eq('id', otherId).single();
          userMap[otherId] = {
            user_id: otherId,
            username: userData?.nombre_usuario || 'Usuario',
            avatar: userData?.avatar_url || '/default-avatar.png',
            last_message: msg.content,
            last_time: msg.created_at,
            unread_count: 0,
          };
        }
        if (new Date(msg.created_at) > new Date(userMap[otherId].last_time)) {
          userMap[otherId].last_message = msg.content;
          userMap[otherId].last_time = msg.created_at;
        }
        if (msg.receiver_id === user.id && !msg.read) {
          userMap[otherId].unread_count += 1;
        }
      }
      setConversations(Object.values(userMap).sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime()));
      setLoadingConvs(false);
    };
    fetchConversations();
  }, [user]);

  // Cargar mensajes de la conversación seleccionada
  useEffect(() => {
    if (!user || !selectedConversation) return;
    setLoadingMsgs(true);
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedConversation.user_id}),and(sender_id.eq.${selectedConversation.user_id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      setMessages(data || []);
      setLoadingMsgs(false);
      // Marcar como leídos
      await supabase.from('messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', selectedConversation.user_id)
        .eq('read', false);
    };
    fetchMessages();
  }, [user, selectedConversation]);

  // Buscar usuarios
  const handleUserSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchLoading(true);
    const { data } = await supabase
      .from('usuarios')
      .select('id, nombre_usuario, nombre_completo, avatar_url')
      .ilike('nombre_usuario', `%${searchQuery}%`);
    setSearchResults(data || []);
    setSearchLoading(false);
  };

  // Enviar mensaje
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedConversation || (!messageInput.trim() && !selectedFile && !audioUrl && !videoUrl && !sticker)) return;
    let content = messageInput.trim();
    let file_url = null;
    let audio_url = null;
    let video_url = null;
    let sticker_url = null;
    // Subir archivo si existe
    if (selectedFile) {
      const { data, error } = await supabase.storage.from('chat-files').upload(`messages/${Date.now()}_${selectedFile.name}`, selectedFile);
      if (!error && data) file_url = data.path;
    }
    if (audioUrl) audio_url = audioUrl;
    if (videoUrl) video_url = videoUrl;
    if (sticker) sticker_url = sticker;
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedConversation.user_id,
      content,
      file_url,
      audio_url,
      video_url,
      sticker_url,
      read: false,
    });
    setMessageInput('');
    setSelectedFile(null);
    setAudioUrl(null);
    setVideoUrl(null);
    setSticker(null);
    // Recargar mensajes
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedConversation.user_id}),and(sender_id.eq.${selectedConversation.user_id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  return (
    <div className="flex h-[80vh] bg-white rounded-lg shadow overflow-hidden">
      {/* Panel izquierdo: lista de conversaciones */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 font-bold text-lg">Tu bandeja</div>
        <div className="flex space-x-2 px-4 mb-2">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`px-3 py-1 rounded-full text-sm font-medium ${selectedTab === tab ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setSelectedTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="px-4 mb-2">
          <form onSubmit={handleUserSearch} className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Buscar usuario..."
              className="w-full px-3 py-2 rounded bg-gray-100 focus:outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              disabled={loadingConvs}
            />
            <button type="submit" className="btn btn-primary flex items-center justify-center" title="Buscar">
              <Search className="h-5 w-5" />
            </button>
          </form>
          {searchLoading && <div>Buscando...</div>}
          <div className="space-y-2">
            {searchResults.map(user => (
              <div
                key={user.id}
                className="block cursor-pointer"
                tabIndex={0}
                aria-label={`Abrir chat con ${user.nombre_completo || user.nombre_usuario}`}
                onClick={() => {
                  setSelectedConversation({
                    user_id: user.id,
                    username: user.nombre_usuario,
                    avatar: user.avatar_url || '/default-avatar.png',
                    last_message: '',
                    last_time: '',
                    unread_count: 0,
                  });
                  setSearchResults([]);
                  setSearchQuery('');
                }}
              >
                <div className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
              </div>
            ))}
            {!searchLoading && searchResults.length === 0 && searchQuery && <div>No se encontraron usuarios.</div>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-4 text-gray-400">Cargando...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-gray-400">No hay conversaciones.</div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.user_id}
                className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-100 ${selectedConversation?.user_id === conv.user_id ? 'bg-gray-200' : ''}`}
                onClick={() => setSelectedConversation(conv)}
              >
                <img src={conv.avatar} alt={conv.username} className="w-10 h-10 rounded-full mr-3" />
                <div className="flex-1">
                  <div className="font-semibold flex items-center">
                    {conv.username}
                    {conv.unread_count > 0 && <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block" />}
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-[180px]">{conv.last_message}</div>
                </div>
                <div className="text-xs text-gray-400 ml-2">{new Date(conv.last_time).toLocaleDateString()}</div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t">
          <button className="w-full bg-blue-500 text-white py-2 rounded font-semibold hover:bg-blue-600 transition">Enviar mensaje</button>
        </div>
      </div>
      {/* Panel derecho: área de mensajes */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <div className="flex flex-col h-full">
            <div className="border-b px-6 py-4 font-bold text-lg flex items-center">
              <img
                src={selectedConversation.avatar}
                alt="avatar"
                className="w-8 h-8 rounded-full mr-3"
              />
              {selectedConversation.username}
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
              {loadingMsgs ? (
                <div className="text-gray-400">Cargando mensajes...</div>
              ) : messages.length === 0 ? (
                <div className="text-gray-400">No hay mensajes aún.</div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`flex ${user && msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-lg shadow text-sm ${user && msg.sender_id === user.id ? 'bg-blue-500 text-white' : 'bg-white border'}`}>
                      {msg.content && <div>{msg.content}</div>}
                      {msg.file_url && <a href={supabase.storage.from('chat-files').getPublicUrl(msg.file_url).publicURL} target="_blank" rel="noopener noreferrer" className="block text-blue-500">Archivo adjunto</a>}
                      {msg.audio_url && <audio controls src={msg.audio_url} className="mt-2" />}
                      {msg.video_url && <video controls src={msg.video_url} className="mt-2 max-w-xs" />}
                      {msg.sticker_url && <img src={msg.sticker_url} alt="sticker" className="h-12 mt-2" />}
                      <div className="text-xs text-gray-300 mt-1 text-right">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form
              className="flex items-center p-4 border-t bg-white gap-2"
              onSubmit={handleSendMessage}
            >
              {/* Menú de acciones */}
              <div className="relative">
                <button
                  type="button"
                  className="p-2"
                  title="Más acciones"
                  onClick={() => setShowMenu(v => !v)}
                >
                  <MoreVertical className="h-6 w-6 text-gray-500" />
                </button>
                {showMenu && (
                  <div className="absolute left-0 bottom-12 z-10 mb-2 w-44 bg-white border rounded shadow-lg flex flex-col animate-fade-in-up">
                    <label htmlFor="file-input" className="cursor-pointer px-4 py-2 hover:bg-gray-100" title="Adjuntar archivo" onClick={() => setShowMenu(false)}>📎 Adjuntar archivo</label>
                    <button type="button" className="px-4 py-2 text-left hover:bg-gray-100" title="Grabar audio" onClick={() => { setShowAudioRecorder(v => !v); setShowMenu(false); }}>🎤 Grabar audio</button>
                    <button type="button" className="px-4 py-2 text-left hover:bg-gray-100" title="Grabar video" onClick={() => { setShowVideoRecorder(v => !v); setShowMenu(false); }}>📹 Grabar video</button>
                    <button type="button" className="px-4 py-2 text-left hover:bg-gray-100" title="Sticker like" onClick={() => { setSticker('/stickers/like.png'); setShowMenu(false); }}>👍 Enviar sticker</button>
                    <button type="button" className="px-4 py-2 text-left hover:bg-gray-100" title="Sticker love" onClick={() => { setSticker('/stickers/love.png'); setShowMenu(false); }}>❤️ Enviar sticker</button>
                    <button type="button" className="px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2" title="Emojis" onClick={() => { setShowEmojiPicker(v => !v); }}>
                      <Smile className="h-5 w-5" /> <span>Emojis</span>
                    </button>
                  </div>
                )}
                {/* Emoji picker hacia arriba */}
                {showEmojiPicker && (
                  <div className="absolute left-0 bottom-44 z-20 mb-2 w-60 bg-white border rounded shadow-lg animate-fade-in-up p-2 flex flex-wrap gap-1" style={{maxHeight:'180px',overflowY:'auto'}}>
                    {["😀","😂","😍","😎","😭","😡","👍","🙏","🎉","❤️","🔥","🥳","😅","😇","😜","🤔","😱","😏","😬","😴","🤩","😢","😆","😋","😃"].map(e=>(
                      <button key={e} className="text-2xl p-1 hover:bg-gray-100 rounded" type="button" onClick={()=>{setMessageInput(m=>m+e);setShowEmojiPicker(false);setShowMenu(false);}}>{e}</button>
                    ))}
                  </div>
                )}
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
              {/* Campo de texto y enviar */}
              <input
                type="text"
                className="flex-1 px-4 py-2 rounded-full border bg-gray-100 focus:outline-none"
                placeholder="Escribe un mensaje..."
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                disabled={loadingMsgs}
              />
              <button
                type="submit"
                className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-600 transition"
                disabled={loadingMsgs || (!messageInput.trim() && !selectedFile && !audioUrl && !videoUrl && !sticker)}
              >
                Enviar
              </button>
              {showAudioRecorder && (
                <AudioRecorder onAudioReady={(url: string | null) => { setAudioUrl(url); setShowAudioRecorder(false); }} />
              )}
              {showVideoRecorder && (
                <VideoRecorder onVideoReady={(url: string | null) => { setVideoUrl(url); setShowVideoRecorder(false); }} />
              )}
            </form>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="rounded-full border-4 border-gray-200 p-6 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" /></svg>
            </div>
            <div className="text-xl font-bold mb-2">Tus mensajes</div>
            <div className="text-gray-500 mb-4">Envía fotos y mensajes privados a un amigo o grupo</div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded font-semibold hover:bg-blue-600 transition">Enviar mensaje</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessagesPage;
