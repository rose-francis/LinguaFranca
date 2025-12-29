import React, { useState, useEffect, useRef } from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";


const LANGUAGES = [
  { code: "auto", name: "Auto detect" },
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "ml", name: "Malayalam" },
  { code: "kn", name: "Kannada" },
  { code: "bn", name: "Bengali" },
  { code: "pa", name: "Punjabi" },
  { code: "ur", name: "Urdu" },
  { code: "ru", name: "Russian" },
];

const SPEECH_LANG_MAP = {
  en: "en-US",
  hi: "hi-IN",
  ta: "ta-IN",
  te: "te-IN",
  ml: "ml-IN",
  kn: "kn-IN",
  bn: "bn-IN",
  pa: "pa-IN",
  ur: "ur-PK",
  fr: "fr-FR",
  es: "es-ES",
  de: "de-DE",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  ar: "ar-SA",
  ru: "ru-RU",
};



export default function Landing() {
  const [input, setInput] = useState("");
  const [translated, setTranslated] = useState("");
  const [source, setSource] = useState("auto");
  const [target, setTarget] = useState("en");
  const [recording, setRecording] = useState(false);
  const [listening, setListening]=useState(false)

  const navigate=useNavigate();
  
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  async function handleLogout() {
  try {
  await axios.post("http://127.0.0.1:8000/logout", {}, { withCredentials: true });
} catch (err) {
  console.warn("Logout failed", err);
} finally {
  localStorage.removeItem("token");
  navigate("/signin");
}
}

  // ---------------------------
  // SPEECH-TO-TEXT (MIC)
  // ---------------------------
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      recognitionRef.current = null;
      return;
    }

    const rec = new SR();
    rec.lang = SPEECH_LANG_MAP[source] || "en-US";
    rec.interimResults = false;

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + text : text));
    };

    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recognitionRef.current = rec;
  }, [source]);

  // ---------------------------
  // RECORD AUDIO (LOCAL ONLY)
  // ---------------------------
  async function startRecording() {
  try {
    //  Start speech recognition
    if (recognitionRef.current) {
      setListening(true);
      recognitionRef.current.start();
    }

    //  Start audio recording
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);

    audioChunksRef.current = [];
    mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);

    mr.onstop = async () => {
  const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
  console.log("Audio blob captured:", blob);

  const formData = new FormData();
  formData.append("audio", blob, "speech.webm");
  formData.append("source", source === "auto" ? "en" : source);
  formData.append("target", target);

  try {
    const res = await fetch("http://localhost:8000/speech", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json();
      alert("Transcription failed: " + (errData.detail || "Unknown error"));
      return;
    }


    const data = await res.json();
    if (data.transcript) {
      setInput(data.transcript); // replace textarea with Gemini transcript
    } else {
      console.log("No transcript returned from Gemini");
    }
  } catch (err) {
    console.error("Error sending audio:", err);
    alert("Failed to send audio to backend");
  }
};


    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);

  } catch (err) {
    alert("Microphone error. Check permissions.");
  }
}


  function stopRecording() {
  // stop audio recording
  mediaRecorderRef.current?.stop();

  // stop speech recognition
  recognitionRef.current?.stop();

  setRecording(false);
  setListening(false);
  }

  // ---------------------------
  // "TRANSLATE" FRONTEND-ONLY
  // ---------------------------
async function handleTranslate() {
  if (!input.trim()) return;

  const res = await fetch("http://localhost:8000/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: input,
      source,
      target
    })
  });

  const data = await res.json();
  setTranslated(data.translatedText || "Translation error");
}


  // ---------------------------
  // UI
  // ---------------------------
  return (
    <div style={page}>
    
     <div style={topStripe} >
        <button style={Logbutton} onClick={handleLogout}>
          Logout
      </button>
      </div>

      <div style={container}>
        <header style={header}>
          <h1 style={title} className="text-gray-800">
            Lingua<span style={{color: "#6b46c1"}}>Franca</span>
          </h1>
          <p style={subtitle}>Speak freely, understand clearly.</p>
        </header>

        <main style={card}>
          <div style={panels}>
            {/* LEFT */}
            <div style={leftPanel}>
              <label style={label}>Enter text / speak</label>

              <textarea
                style={textarea}
                placeholder="Type or press mic…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />

              <div style={controls}>

                {/* RECORD BUTTON */}
                {!recording ? (
                  <button onClick={startRecording} style={secondaryBtn}>
                    Record
                  </button>
                ) : (
                  <button onClick={stopRecording} style={secondaryBtnActive}>
                    Stop & Save
                  </button>
                )}

                <button onClick={() => setInput("")} style={ghostBtn}>
                  Clear
                </button>

                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    style={select}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.name}
                      </option>
                    ))}
                  </select>

                  <div style={{ color: "#6b5bb6", fontWeight: 600 }}>→</div>

                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    style={select}
                  >
                    {LANGUAGES.map(
                      (l) =>
                        l.code !== "auto" && (
                          <option key={l.code} value={l.code}>
                            {l.name}
                          </option>
                        )
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div style={rightPanel}>
              <label style={label}>Translation</label>

              <textarea
                style={{ ...textarea, background: "#fbfaff" }}
                value={translated}
                readOnly
              />

              <div style={controls}>
                <button onClick={handleTranslate} style={primaryBtn}>
                  Translate
                </button>
                <button onClick={() => setTranslated("")} style={ghostBtn}>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer style={footer}>Made with 💜 — LinguaFranca</footer>
      </div>
      </div>
    
  
  );
}

/* ---------------- STYLES ---------------- */

const page = {
  minHeight: "100vh",
  backgroundColor: "#ebdefa"
};

const topStripe = {
      height: "60px",
      backgroundColor: "#6b46c1",
      position: "relative",
      marginBottom:50,
};

const container = {
  maxWidth: 1100,
  margin: "24px auto",
  padding: "0 16px",
};

const header = { textAlign: "center", marginBottom: 20, marginTop:20 };

const title = {
  fontSize: 46,
  margin: 0,
  fontWeight: 800,
  background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
  WebkitBackgroundClip: "text",
};


const subtitle = { marginTop: 8, color: "#5b4d80", fontSize: 15 };

const card = {
  background: "#fff",
  padding: 20,
  borderRadius: 14,
  boxShadow: "0 10px 40px rgba(99, 102, 241, 0.08)",
};

const Logbutton = {
  padding: "10px 18px",
  position: "absolute",
  top: "12px",
  right: "16px",
  backgroundColor: "#ffffff",
  color: "#6b46c1",
  border: "2px solid #e9d5ff",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: 700,
  zIndex: 1000,
};


const panels = {
  display: "flex",
  gap: 18,
};

const leftPanel = { flex: 1 };
const rightPanel = { flex: 1 };

const label = { color: "#5b4d80", fontSize: 13, marginBottom: 8 };

const textarea = {
  width: "100%",
  minHeight: 140,
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(107,70,193,0.12)",
  fontSize: 15,
  resize: "vertical",
};

const controls = { display: "flex", alignItems: "center", marginTop: 12, gap: 10 };

const micBtn = (active) => ({
  width: 44,
  height: 44,
  borderRadius: "50%",
  background: active ? "#6b46c1" : "#9f7aea",
  border: "none",
  cursor: "pointer",
  fontSize: 20,
  boxShadow: "0 6px 18px rgba(99, 102, 241, 0.12)",
  color: "white",
});

const secondaryBtn = {
  padding: "10px 12px",
  borderRadius: 10,
  background: "#e9d5ff",
  border: "none",
  cursor: "pointer",
};

const secondaryBtnActive = {
  ...secondaryBtn,
  background: "#d6bbff",
};

const ghostBtn = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid rgba(107,70,193,0.12)",
  background: "white",
  cursor: "pointer",
};

const primaryBtn = {
  padding: "10px 14px",
  borderRadius: 12,
  background: "#6b46c1",
  color: "white",
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
};

const select = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(107,70,193,0.12)",
  background: "white",
};

const footer = {
  marginTop: 20,
  textAlign: "center",
  color: "#6b5bb6",
};
