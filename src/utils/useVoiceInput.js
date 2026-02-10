import React,{ useState } from "react";

export const useVoiceInput = ({ onResult, onError }) => {
  const [listening, setListening] = useState(false);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return {
      startListening: () =>
        alert("Voice input not supported in this browser"),
      listening: false,
    };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  const startListening = (lang = "en-IN") => {
    try {
      recognition.lang = lang;
      setListening(true);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setListening(false);
        onResult(transcript);
      };

      recognition.onerror = (event) => {
        setListening(false);
        onError?.(event);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
    } catch (err) {
      setListening(false);
      onError?.(err);
    }
  };

  return {
    startListening,
    listening,
  };
};
