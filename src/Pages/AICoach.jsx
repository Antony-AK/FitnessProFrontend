import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send } from "lucide-react";
import { AI_COACH_DATA } from "../data/aiCoachQA";
import { speak } from "../utils/speak";
import { useAuth } from "../context/AuthContext";
import { Mic } from "lucide-react";
import { useVoiceInput } from "../utils/useVoiceInput";



export default function AICoach() {
  const { user } = useAuth();
  const [aiThinking, setAiThinking] = useState(false);
  const token = localStorage.getItem("titan_token");


  const getWelcomeMessage = (user) => {
    if (!user || !user.profile) {
      return "Hi! I'm your AI fitness coach 💪 How can I help you today?";
    }

    const name = user.name || "there";
    const goal = user.profile.goal || "your fitness goals";
    const level = user.profile.activity_level || "your level";

    return `Hi ${name}! 👋  
I’m your personal AI fitness coach 💪  

🎯 Goal  
${goal}  

🔥 Activity Level  
${level}  

Ask me about workouts, diet, recovery, or form tips - I’ve got you covered 💜`;
  };


  const storageKey = `ai_coach_messages_${user?.email || "guest"}`;

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) return JSON.parse(saved);

    return [
      {
        role: "assistant",
        content: getWelcomeMessage(user),
      },
    ];
  });

  useEffect(() => {
    if (!user?._id) return;

    fetch(`http://localhost:5000/api/ai/coach/history/${user._id}`)
      .then(res => res.json())
      .then(history => {
        if (Array.isArray(history) && history.length > 0) {
          setMessages(history);
        }
        // else: keep welcome message
      })
      .catch(console.error);
  }, [user]);






  const detectLanguage = (text) => {
    if (/[\u0B80-\u0BFF]/.test(text)) return "ta"; // Tamil
    if (/[\u0900-\u097F]/.test(text)) return "hi"; // Hindi

    const lower = text.toLowerCase();

    if (["hai", "mujhe", "dard", "pain"].some(w => lower.includes(w))) {
      return "hi"; // Hinglish
    }

    if (["iruku", "valikuthu", "romba", "enna"].some(w => lower.includes(w))) {
      return "ta"; // Thanglish
    }

    return "en";
  };


  const { startListening, listening } = useVoiceInput({
    onResult: (text) => {
      setInput(text);
      sendMessage(text);
    },
    onError: (event) => {
      if (event?.error === "no-speech") {
        speak("I couldn’t hear anything. Please try again.", "en");
      } else if (event?.error === "not-allowed") {
        speak("Microphone permission is blocked. Please allow it.", "en");
      } else {
        speak("Microphone issue detected. Try again.", "en");
      }
    },
  });


  const handleMic = () => {
    if (listening) return;

    speak("I'm listening", "en");

    const lang = detectLanguage(input || "");
    const langMap = {
      en: "en-IN",
      hi: "hi-IN",
      ta: "ta-IN",
    };

    startListening(langMap[lang] || "en-IN");
  };





  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    setAiThinking(true);

    try {
      const res = await fetch("http://localhost:5000/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          userId: user?._id,
          userProfile: user?.profile,
        })

      });

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.reply }
      ]);

      const lang = detectLanguage(text);
      speak(data.reply, lang);

    } catch {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "⚠️ Coach is resting. Try again!" }
      ]);
    } finally {
      setAiThinking(false);
    }
  };


  const normalize = (text) =>
    text
      .toLowerCase()
      .replace(/[^a-zA-Zஅ-ஹ ]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const similarity = (a, b) => {
    const A = normalize(a).split(" ");
    const B = normalize(b).split(" ");

    let match = 0;
    for (let word of A) {
      if (B.some(w => w.startsWith(word) || word.startsWith(w))) {
        match++;
      }
    }

    return match / Math.max(A.length, B.length);
  };


  const findBestAnswer = (userText) => {
    const user = normalize(userText);
    const isTamil = /[\u0B80-\u0BFF]/.test(userText);

    let best = null;
    let bestScore = 0;

    for (const q of AI_COACH_DATA.qa) {
      const target = isTamil
        ? normalize(q.question_ta || "")
        : normalize(q.question_en);

      const score = similarity(user, target);

      if (score > bestScore) {
        bestScore = score;
        best = q;
      }
    }

    return bestScore > 0.25 ? best : null;
  };


  return (
    <div className="h-screen flex flex-col bg-gray-50">

      {/* HEADER */}
      <div className="bg-white border-b border-purple-600/30 px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
          <Sparkles size={20} />
        </div>
        <div>
          <h1 className="font-semibold">AI Coach</h1>
          <p className="text-sm text-gray-500">
            Your personal fitness assistant
          </p>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} text={m.content} />
        ))}

        <div ref={bottomRef} />
      </div>

      {listening && (
        <p className="text-md -mt-10 text-red-500 px-6">🎤 Listening...</p>
      )}

      {aiThinking && (
        <p className="text-md -mt-10 text-purple-500 px-6">🤖 AI is thinking...</p>
      )}


      {/* QUICK PROMPTS */}
      <div className="border-t border-gray-200 bg-white">

        <div className="px-6 pb-3">
          <p className="text-xs text-gray-400 mb-2">Quick prompts:</p>
          <div className="flex gap-2 flex-wrap">
            {[
              "What workout should I do today?",
              "I have knee pain",
              "Suggest a healthy routine",
              "How to improve my form?",
              "எனக்கு முழங்கால் வலி இருக்கு",
              "mujhe knee pain hai",
            ].map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="px-4 py-1.5 text-sm rounded-full border bg-white hover:bg-gray-100 transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>



      {/* INPUT */}
      <div className="bg-white border-t border-purple-600/30 px-6 py-4">
        <div className="flex items-center gap-3">

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask your coach..."
            className="flex-1 px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleMic}
            disabled={listening}
            className={`w-12 h-12 rounded-xl flex items-center justify-center
    ${listening ? "bg-red-200 animate-pulse" : "bg-gray-200 hover:bg-gray-300"}
  `}
            title={listening ? "Listening..." : "Speak"}
          >
            <Mic size={18} />
          </button>

          <button
            onClick={() => sendMessage(input)}
            className="w-12 h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- MESSAGE BUBBLE ---------------- */

const MessageBubble = ({ role, text }) => {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[45%] px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? "bg-purple-600 text-white rounded-br-sm"
            : "bg-white shadow-sm rounded-bl-sm"
          }`}
      >
        {text}
      </div>
    </div>
  );
};
