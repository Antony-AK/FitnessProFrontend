export const speak = (text, lang = "en") => {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  // ❌ Remove emojis & symbols for speech
  const cleanText = text.replace(
    /([\u{1F300}-\u{1FAFF}]|[\u2600-\u26FF])/gu,
    ""
  );

  const utterance = new SpeechSynthesisUtterance(cleanText);

  const langMap = {
    en: "en-IN",
    hi: "hi-IN",

    // ⚠️ Tamil fallback (browser limitation)
    ta: "en-IN"
  };

  utterance.lang = langMap[lang] || "en-IN";
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
};


export const stopSpeak = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};