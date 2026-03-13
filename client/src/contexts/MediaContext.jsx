import { createContext, useContext, useState, useCallback, useRef } from 'react';

const MediaContext = createContext(null);

export function MediaProvider({ children }) {
  const [mediaStream, setMediaStream] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const videoRef = useRef(null);

  const requestPermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 } },
        audio: true,
      });
      setMediaStream(stream);
      setPermissionsGranted(true);
      return stream;
    } catch {
      setPermissionsGranted(false);
      return null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
      setPermissionsGranted(false);
    }
  }, [mediaStream]);

  return (
    <MediaContext.Provider
      value={{ mediaStream, permissionsGranted, requestPermissions, stopStream, videoRef }}
    >
      {children}
    </MediaContext.Provider>
  );
}

export const useMedia = () => {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error('useMedia must be used inside MediaProvider');
  return ctx;
};
