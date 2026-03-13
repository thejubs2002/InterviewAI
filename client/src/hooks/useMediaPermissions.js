import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

export const useMediaPermissions = () => {
  const [mediaStream, setMediaStream] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const requestPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Request both video and audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 } },
        audio: true,
      });

      setMediaStream(stream);
      setAudioStream(stream);
      setPermissionsGranted(true);
      toast.success('Camera and microphone access granted');
      return stream;
    } catch (err) {
      const errorMsg = err.name === 'NotAllowedError'
        ? 'Camera and microphone access denied'
        : err.name === 'NotFoundError'
        ? 'No camera or microphone found'
        : 'Failed to access camera/microphone';
      
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const stopStream = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
      setAudioStream(null);
      setPermissionsGranted(false);
    }
  }, [mediaStream]);

  const startRecording = useCallback(() => {
    if (!audioStream) return null;

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(audioStream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    return mediaRecorder;
  }, [audioStream]);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) return resolve(null);

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: 'audio/webm',
        });
        resolve(blob);
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  return {
    mediaStream,
    audioStream,
    permissionsGranted,
    loading,
    error,
    requestPermissions,
    stopStream,
    startRecording,
    stopRecording,
  };
};
