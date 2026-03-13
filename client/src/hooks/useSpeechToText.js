import { useState, useRef, useCallback, useEffect } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const useSpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported] = useState(!!SpeechRecognition);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text + ' ';
        } else {
          interim += text;
        }
      }

      if (final) {
        setTranscript((prev) => prev + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      const errorMessage = `Speech recognition error: ${event.error}`;
      setError(errorMessage);
      isListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) return;
    setTranscript('');
    setInterimTranscript('');
    try {
      recognitionRef.current.start();
    } catch {
      // Already started in unexpected state
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListeningRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // Already stopped
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
};
