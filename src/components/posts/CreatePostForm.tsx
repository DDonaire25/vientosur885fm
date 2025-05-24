import React, { useState, useRef } from 'react';
import { FileText, Mic, Send, Camera } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { PostType, usePostStore } from '../../store/postStore';
import { toast } from 'sonner';
import FileUploadWithPreview from '../ui/FileUploadWithPreview';
import AudioRecorder from '../ui/AudioRecorder';
import VideoRecorder from '../ui/VideoRecorder';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface CreatePostFormProps {
  onSuccess?: () => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onSuccess }) => {
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const audioRecorderRef = useRef<any>(null);
  const videoRecorderRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const { user } = useAuthStore();
  const { addPost } = usePostStore();

  // Limpiar estados tras publicar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Debes iniciar sesión para crear una publicación');
      return;
    }
    if (!content.trim() && !mediaUrl) {
      toast.error('Por favor, agrega contenido o un archivo');
      return;
    }
    setIsSubmitting(true);
    try {
      await addPost({
        userId: user.id,
        type: postType,
        content: content.trim(),
        mediaUrl: mediaUrl || undefined,
        isFavorite: false
      });
      setContent('');
      setMediaUrl('');
      setPostType('text');
      setPreviewUrl(null);
      setAudioPreviewUrl(null);
      toast.success('¡Publicación creada exitosamente!');
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Error al crear la publicación');
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Nuevo handler para integración con FileUploadWithPreview
  const handleFileSelect = (fileUrl: string | null) => {
    setMediaUrl(fileUrl || '');
    if (fileUrl) {
      // Detectar tipo por extensión
      if (fileUrl.match(/\.(jpg|jpeg|png|gif)$/i)) setPostType('image');
      else if (fileUrl.match(/\.(mp4|webm|mov)$/i)) setPostType('video');
      else if (fileUrl.match(/\.(mp3|wav|ogg)$/i)) setPostType('audio');
      else setPostType('document');
    } else {
      setPostType('text');
    }
  };

  // Nuevo handler para integración con AudioRecorder
  const handleAudioReady = (audioUrl: string | null) => {
    setMediaUrl(audioUrl || '');
    setPostType(audioUrl ? 'audio' : 'text');
  };

  // Nuevo handler para integración con VideoRecorder
  const handleVideoReady = (videoUrl: string | null) => {
    setMediaUrl(videoUrl || '');
    setPostType(videoUrl ? 'video' : 'text');
    setShowVideoRecorder(false);
  };

  // Handlers para grabación tipo WhatsApp
  const handleMicPress = () => {
    setShowAudioRecorder(true);
    setShowFileUpload(false);
    setShowVideoRecorder(false);
    setIsRecording(true);
    setTimeout(() => {
      audioRecorderRef.current?.startRecording();
    }, 50); // pequeño delay para asegurar montaje
  };
  const handleMicRelease = () => {
    if (isRecording) {
      audioRecorderRef.current?.stopRecording();
      setIsRecording(false);
    }
  };
  const handleMicCancel = () => {
    if (isRecording) {
      audioRecorderRef.current?.cancelRecording();
      setIsRecording(false);
    }
  };

  const handleCameraPress = () => {
    setShowVideoRecorder(true);
    setShowFileUpload(false);
    setShowAudioRecorder(false);
    setTimeout(() => {
      videoRecorderRef.current?.startRecording();
    }, 50);
  };
  const handleCameraRelease = () => {
    videoRecorderRef.current?.stopRecording();
  };
  const handleCameraCancel = () => {
    videoRecorderRef.current?.cancelRecording();
  };

  const handleEmojiSelect = (emoji: any) => {
    setContent(content + (emoji.native || emoji.skins?.[0]?.native || ''));
    setShowEmojiPicker(false);
  };

  return (
    <div className="feed-item mb-4">
      <form onSubmit={handleSubmit}>
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <div className="avatar">
              <img 
                src={user?.avatar} 
                alt={user?.displayName} 
                className="avatar-img"
              />
            </div>
            <div className="flex-1">
              <textarea
                placeholder="¿Qué está pasando?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`w-full p-2 text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 resize-none ${!content.trim() && isSubmitting ? 'border border-red-500' : ''}`}
                rows={3}
                aria-label="Contenido de la publicación"
                required={!mediaUrl}
                disabled={isSubmitting}
              />
              {/* Previsualización de archivos multimedia */}
              {previewUrl && postType === 'image' && (
                <div className="mt-2 relative rounded-lg overflow-hidden">
                  <img 
                    src={previewUrl} 
                    alt="Previsualización" 
                    className="w-full h-auto max-h-[300px] object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => { setPreviewUrl(null); setMediaUrl(''); }}
                    className="absolute top-2 right-2 bg-gray-900/70 text-white p-1 rounded-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
              {mediaUrl && postType === 'video' && (
                <div className="mt-2">
                  <video src={mediaUrl} controls className="w-full max-h-[300px] rounded-lg" />
                </div>
              )}
              {audioPreviewUrl && postType === 'audio' && !isSubmitting && (
                <div className="mt-2 flex flex-col items-start">
                  <audio src={audioPreviewUrl} controls className="w-full" />
                </div>
              )}
              {mediaUrl && postType === 'audio' && (
                <div className="mt-2">
                  <audio src={mediaUrl} controls className="w-full" />
                </div>
              )}
              {mediaUrl && postType === 'document' && (
                <div className="mt-2">
                  <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">Ver documento</a>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-2">
            {/* Botón emoji */}
            <button
              type="button"
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              onClick={() => setShowEmojiPicker((v) => !v)}
              aria-label="Insertar emoji"
              disabled={isSubmitting}
            >
              <span role="img" aria-label="emoji">😊</span>
            </button>
            {/* Botón clip para archivos */}
            <button
              type="button"
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              onClick={() => { setShowFileUpload((v) => !v); setShowAudioRecorder(false); setShowVideoRecorder(false); }}
              aria-label="Adjuntar archivo"
              disabled={isSubmitting}
            >
              <FileText className="h-5 w-5" />
            </button>
            {/* Botón micrófono para nota de voz */}
            <button
              type="button"
              className={`p-2 rounded-full ${showAudioRecorder ? 'bg-red-200 text-red-600' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
              onMouseDown={handleMicPress}
              onMouseUp={handleMicRelease}
              onMouseLeave={handleMicCancel}
              onTouchStart={handleMicPress}
              onTouchEnd={handleMicRelease}
              onTouchCancel={handleMicCancel}
              aria-label="Grabar nota de voz"
              disabled={isSubmitting}
            >
              <Mic className="h-5 w-5" />
            </button>
            {/* Botón cámara para nota de video */}
            <button
              type="button"
              className={`p-2 rounded-full ${showVideoRecorder ? 'bg-blue-200 text-blue-600' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
              onMouseDown={handleCameraPress}
              onMouseUp={handleCameraRelease}
              onMouseLeave={handleCameraCancel}
              onTouchStart={handleCameraPress}
              onTouchEnd={handleCameraRelease}
              onTouchCancel={handleCameraCancel}
              aria-label="Grabar nota de video"
              disabled={isSubmitting}
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>
          <button 
            type="submit"
            disabled={isSubmitting || (!content.trim() && !mediaUrl)}
            className="btn btn-primary py-1.5 px-4 rounded-full disabled:opacity-50 flex items-center"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isSubmitting ? 'Publicando...' : 'Post'}
          </button>
        </div>
        {/* Subida de archivos con previsualización y progreso, solo si showFileUpload */}
        {showFileUpload && (
          <div className="px-4 pb-2">
            <FileUploadWithPreview onFileSelect={handleFileSelect} />
          </div>
        )}
        {/* Grabación de voz controlada por ref, solo si showAudioRecorder */}
        {showAudioRecorder && (
          <div className="px-4 pb-2">
            <AudioRecorder ref={audioRecorderRef} onAudioReady={handleAudioReady} />
            {isRecording && (
              <div className="text-red-600 font-bold mt-2 flex items-center gap-2">
                <Mic className="h-4 w-4 animate-pulse" /> Grabando... Suelta para enviar, desliza fuera para cancelar
              </div>
            )}
          </div>
        )}
        {/* Grabación de video controlada por ref, solo si showVideoRecorder */}
        {showVideoRecorder && (
          <div className="px-4 pb-2">
            <VideoRecorder ref={videoRecorderRef} onVideoReady={handleVideoReady} />
            <div className="text-blue-600 font-bold mt-2 flex items-center gap-2">
              <Camera className="h-4 w-4 animate-pulse" /> Grabando video... Suelta para enviar, desliza fuera para cancelar
            </div>
          </div>
        )}
        {/* Selector de emoji */}
        {showEmojiPicker && (
          <div className="absolute z-50 mt-2">
            <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="auto" />
          </div>
        )}
      </form>
    </div>
  );
};

export default CreatePostForm;