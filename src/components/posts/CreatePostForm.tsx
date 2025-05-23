import React, { useState } from 'react';
import { Image, Video, FileAudio, FileText, Mic, Send } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { PostType, usePostStore } from '../../store/postStore';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

interface CreatePostFormProps {
  onSuccess?: () => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onSuccess }) => {
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  let recordingInterval: NodeJS.Timeout;

  const { user } = useAuthStore();
  const { addPost } = usePostStore();

  // Subir archivo a Supabase Storage
  const uploadFile = async (file: File, folder: string) => {
    setUploadProgress(0);
    setPreviewUrl(URL.createObjectURL(file));
    setIsSubmitting(true);
    // Simulación de progreso (Supabase no da progreso nativo)
    const fakeProgress = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 90) {
          clearInterval(fakeProgress);
          return p;
        }
        return p + 10;
      });
    }, 100);
    const ext = file.name.split('.').pop();
    const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('media').upload(filePath, file);
    clearInterval(fakeProgress);
    setUploadProgress(100);
    setIsSubmitting(false);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  // Subir blob de audio
  const uploadAudioBlob = async (blob: Blob) => {
    setUploadProgress(0);
    setAudioPreviewUrl(URL.createObjectURL(blob));
    setIsSubmitting(true);
    const fakeProgress = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 90) {
          clearInterval(fakeProgress);
          return p;
        }
        return p + 10;
      });
    }, 100);
    const filePath = `audio/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webm`;
    const { error } = await supabase.storage.from('media').upload(filePath, blob);
    clearInterval(fakeProgress);
    setUploadProgress(100);
    setIsSubmitting(false);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: PostType) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || isSubmitting || isRecording) return;
    setPostType(type);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    try {
      const url = await uploadFile(selectedFile, type);
      setMediaUrl(url);
      toast.success('Archivo subido correctamente');
    } catch (err) {
      toast.error('Error al subir archivo');
    } finally {
      setUploadProgress(0);
    }
  };

  // Grabación de voz mejorada
  const handleStartRecording = async () => {
    if (isSubmitting) return;
    setIsRecording(true);
    setRecordingTime(0);
    setAudioPreviewUrl(null);
    setAudioBlob(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      setAudioBlob(blob);
      setAudioPreviewUrl(URL.createObjectURL(blob));
      setIsRecording(false);
      clearInterval(recordingInterval);
    };
    recorder.start();
    // Temporizador
    recordingInterval = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    mediaRecorder?.stop();
    clearInterval(recordingInterval);
  };

  const handleUploadRecordedAudio = async () => {
    if (!audioBlob || isSubmitting) return;
    try {
      const url = await uploadAudioBlob(audioBlob);
      setMediaUrl(url);
      setPostType('audio');
      toast.success('Nota de voz subida');
      setAudioBlob(null);
      setAudioPreviewUrl(null);
    } catch {
      toast.error('Error al subir nota de voz');
    } finally {
      setUploadProgress(0);
    }
  };

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
      setAudioBlob(null);
      setAudioPreviewUrl(null);
      setRecordingTime(0);
      toast.success('¡Publicación creada exitosamente!');
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Error al crear la publicación');
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
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
              {previewUrl && postType === 'image' && (
                <div className="mt-2 relative rounded-lg overflow-hidden">
                  <img 
                    src={previewUrl} 
                    alt="Previsualización" 
                    className="w-full h-auto max-h-[300px] object-cover rounded-lg"
                  />
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-primary-100">
                      <div className="h-2 bg-primary-600" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
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
              {audioPreviewUrl && postType === 'audio' && !isRecording && (
                <div className="mt-2 flex flex-col items-start">
                  <audio src={audioPreviewUrl} controls className="w-full" />
                  <button type="button" onClick={handleUploadRecordedAudio} className="btn btn-primary mt-2">Subir nota de voz</button>
                  <button type="button" onClick={() => { setAudioBlob(null); setAudioPreviewUrl(null); }} className="btn btn-secondary mt-2">Cancelar</button>
                </div>
              )}
              {isRecording && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-red-600 font-bold">● Grabando</span>
                  <span>{recordingTime}s</span>
                  <button type="button" onClick={handleStopRecording} className="btn btn-danger ml-2">Detener</button>
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
          <div className="flex items-center space-x-4">
            <label>
              <input type="file" accept="image/*" hidden onChange={e => handleFileChange(e, 'image')} />
              <button type="button" className={`p-2 rounded-full ${postType === 'image' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`} disabled={isSubmitting || isRecording}>
                <Image className="h-5 w-5" />
              </button>
            </label>
            <label>
              <input type="file" accept="video/*" hidden onChange={e => handleFileChange(e, 'video')} />
              <button type="button" className={`p-2 rounded-full ${postType === 'video' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`} disabled={isSubmitting || isRecording}>
                <Video className="h-5 w-5" />
              </button>
            </label>
            <label>
              <input type="file" accept="audio/*" hidden onChange={e => handleFileChange(e, 'audio')} />
              <button type="button" className={`p-2 rounded-full ${postType === 'audio' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`} disabled={isSubmitting || isRecording}>
                <FileAudio className="h-5 w-5" />
              </button>
            </label>
            <label>
              <input type="file" accept=".pdf,.doc,.docx,.txt,.odt" hidden onChange={e => handleFileChange(e, 'document')} />
              <button type="button" className={`p-2 rounded-full ${postType === 'document' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`} disabled={isSubmitting || isRecording}>
                <FileText className="h-5 w-5" />
              </button>
            </label>
            <button
              type="button"
              className={`p-2 rounded-full ${postType === 'audio' && isRecording ? 'bg-red-200 text-red-600' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={isSubmitting}
            >
              <Mic className="h-5 w-5" />
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
      </form>
    </div>
  );
};

export default CreatePostForm;