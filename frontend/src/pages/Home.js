import React, { useState, useEffect, useRef } from "react";

/**
 * CLEAN FRONTEND-ONLY LAVENDER LANDING PAGE
 * No backend calls
 * No authentication
 * No tokens
 * No upload endpoints
 * Microphone → Web Speech API
 * Record button → gives you the audio blob locally
 */

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

export default function Landing() {
  const [input, setInput] = useState("");
  const [translated, setTranslated] = useState("");
  const [source, setSource] = useState("auto");
  const [target, setTarget] = useState("en");

  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
    rec.lang = "en-US";
    rec.interimResults = false;

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + text : text));
    };

    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recognitionRef.current = rec;
  }, []);

  // ---------------------------
  // RECORD AUDIO (LOCAL ONLY)
  // ---------------------------
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);

      audioChunksRef.current = [];
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);

      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        console.log("Audio blob captured:", blob);

        // HERE IS WHERE YOU WILL LATER SEND THE BLOB TO GEMINI/VAPI
        // For now, we just log it.
      };

      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (err) {
      alert("Microphone error. Check permissions.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  // ---------------------------
  // "TRANSLATE" FRONTEND-ONLY
  // ---------------------------
  function fakeTranslate() {
    if (!input.trim()) return;
    setTranslated(`(Pretend translation → ${target})\n\n${input}`);
  }

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <div style={page}>
      <div style={topStripe} />

      <div style={container}>
        <header style={header}>
          <h1 style={title}>
            <span style={titleAccent}>Lingua</span>Franca
          </h1>
          <p style={subtitle}>Speak freely — understand clearly.</p>
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
                <button onClick={fakeTranslate} style={primaryBtn}>
                  Translate
                </button>
                <button onClick={() => setTranslated("")} style={ghostBtn}>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer style={footer}>Made with ❤️ — LinguaFranca</footer>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const page = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #fbf8ff 0%, #f3e8ff 100%)",
  paddingBottom: 40,
};

const topStripe = {
  height: 46,
  background:
    "linear-gradient(90deg, rgba(107,70,193,0.95), rgba(140,102,255,0.85))",
  width: "100%",
  boxShadow: "0 4px 20px rgba(107,70,193,0.08)",
};

const container = {
  maxWidth: 1100,
  margin: "24px auto",
  padding: "0 16px",
};

const header = { textAlign: "center", marginBottom: 20 };

const title = {
  fontSize: 46,
  margin: 0,
  fontWeight: 800,
  background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
  WebkitBackgroundClip: "text",
  color: "transparent",
};

const titleAccent = { color: "#6b46c1", marginRight: 6 };

const subtitle = { marginTop: 8, color: "#5b4d80", fontSize: 15 };

const card = {
  background: "#fff",
  padding: 20,
  borderRadius: 14,
  boxShadow: "0 10px 40px rgba(99, 102, 241, 0.08)",
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
