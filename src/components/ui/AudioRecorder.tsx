import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface AudioRecorderProps {
  onAudioReady: (audioUrl: string | null) => void;
  folder?: string;
}

const AudioRecorder = forwardRef<any, AudioRecorderProps>(({ onAudioReady, folder = 'media' }, ref) => {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timer, setTimer] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const intervalId = useRef<NodeJS.Timeout | null>(null);

  // Iniciar grabación
  const startRecording = async () => {
    console.log('[AudioRecorder] startRecording called');
    setTimer(0);
    setProgress(0);
    setUploading(false);
    setShowProgress(false);
    if (window.navigator.vibrate) window.navigator.vibrate([50, 30, 50]);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new window.MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunks.current = [];
    mediaRecorder.ondataavailable = (e) => {
      audioChunks.current.push(e.data);
    };
    mediaRecorder.onstop = async () => {
      console.log('[AudioRecorder] onstop called');
      const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
      setShowProgress(true);
      await uploadAudio(blob);
    };
    mediaRecorder.start();
    setRecording(true);
    intervalId.current = setInterval(() => setTimer(t => t + 1), 1000);
    console.log('[AudioRecorder] recording started');
  };

  // Detener grabación
  const stopRecording = () => {
    console.log('[AudioRecorder] stopRecording called');
    if (mediaRecorderRef.current && recording) {
      setRecording(false);
      if (intervalId.current) clearInterval(intervalId.current);
      mediaRecorderRef.current.stop();
      console.log('[AudioRecorder] mediaRecorder.stop() called');
    }
  };

  // Cancelar grabación
  const cancelRecording = () => {
    console.log('[AudioRecorder] cancelRecording called');
    setRecording(false);
    setUploading(false);
    setProgress(0);
    setTimer(0);
    setShowProgress(false);
    onAudioReady(null);
    if (intervalId.current) clearInterval(intervalId.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      console.log('[AudioRecorder] mediaRecorder.stop() called from cancel');
    }
  };

  // Subir audio a Supabase
  const uploadAudio = async (blob: Blob) => {
    console.log('[AudioRecorder] uploadAudio called');
    setUploading(true);
    setProgress(0);
    try {
      const filePath = `${folder}/audio_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webm`;
      for (let i = 1; i <= 90; i += 10) {
        await new Promise(res => setTimeout(res, 60));
        setProgress(i);
      }
      const { error } = await supabase.storage.from('media').upload(filePath, blob);
      setProgress(100);
      setUploading(false);
      setShowProgress(false);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
      console.log('[AudioRecorder] upload success, url:', urlData.publicUrl);
      onAudioReady(urlData.publicUrl);
    } catch (err) {
      setUploading(false);
      setProgress(0);
      setShowProgress(false);
      onAudioReady(null);
      toast.error('Error al subir audio');
      console.error('[AudioRecorder] upload error', err);
    }
  };

  useImperativeHandle(ref, () => ({
    startRecording,
    stopRecording,
    cancelRecording,
    isRecording: () => recording,
    isUploading: () => uploading,
  }));

  return (
    <div className="space-y-2">
      {recording && (
        <div className="flex flex-col items-center gap-2">
          <div className="relative p-6 rounded-full bg-red-100 text-red-600 shadow-lg border-4 border-red-300">
            <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
            <span className="font-bold text-lg animate-pulse">●</span>
          </div>
          <span className="text-red-600 font-mono animate-pulse">{timer}s</span>
        </div>
      )}
      {showProgress && (
        <div className="w-full bg-gray-200 rounded h-2">
          <div
            className="bg-primary-500 h-2 rounded"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
});

export default AudioRecorder;
