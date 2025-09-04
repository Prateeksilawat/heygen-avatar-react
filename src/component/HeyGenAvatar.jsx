import { useRef, useState } from "react";
import StreamingAvatar, {
  TaskType,
  StreamingEvents,
  AvatarQuality,
} from "@heygen/streaming-avatar";

const HeyGenAvatar = () => {
  const videoRef = useRef(null);
  const [avatar, setAvatar] = useState(null);
  const [session, setSession] = useState(null);
  const [inputText, setInputText] = useState("");
  const [isVoiceChat, setIsVoiceChat] = useState(false);

  const apiKey = import.meta.env.VITE_HEYGEN_API_KEY;

  // 🔑 Fetch temporary access token
  const fetchAccessToken = async () => {
    const res = await fetch("https://api.heygen.com/v1/streaming.create_token", {
      method: "POST",
      headers: { "x-api-key": apiKey },
    });
    const { data } = await res.json();
    return data.token;
  };

  // 🎬 Start session
  const startSession = async () => {
    try {
      const token = await fetchAccessToken();
      const avatarInstance = new StreamingAvatar({ token });
      setAvatar(avatarInstance);

      avatarInstance.on(StreamingEvents.STREAM_READY, (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.detail;
          videoRef.current.onloadedmetadata = async () => {
            try {
              await videoRef.current.play();
              console.log("🎥 Avatar stream playing with audio");
            } catch (err) {
              console.warn("⚠️ Autoplay blocked, waiting for user gesture:", err);
            }
          };
        }
      });

      avatarInstance.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log("Stream disconnected");
        if (videoRef.current) videoRef.current.srcObject = null;
      });

      const sessionData = await avatarInstance.createStartAvatar({
        avatarName: "Wayne_20240711", // 👈 replace with your avatar ID
        quality: AvatarQuality.High,
      });

      setSession(sessionData);
      console.log("✅ Session started:", sessionData.session_id);
    } catch (err) {
      console.error("⚠️ Error starting session:", err);
    }
  };

  // 🛑 End session
  const endSession = async () => {
    if (avatar) {
      if (isVoiceChat) {
        await stopVoiceChat();
      }
      await avatar.stopAvatar();
      if (videoRef.current) videoRef.current.srcObject = null;
      setAvatar(null);
      setSession(null);
      console.log("👋 Session ended");
    }
  };

  // 💬 Speak typed text
  const speakText = async () => {
    if (!avatar || !session || !inputText) return;
    try {
      await avatar.speak({ text: inputText, task_type: TaskType.REPEAT });
      setInputText("");
    } catch (err) {
      console.error("⚠️ Error making avatar speak:", err);
    }
  };

  // 🎤 Start voice chat
  const startVoiceChat = async () => {
    if (!avatar || !session) return;
    try {
      await avatar.startVoiceChat({
        sessionId: session.session_id,
        audio: true, // capture mic
      });
      setIsVoiceChat(true);
      console.log("🎤 Voice chat started");
    } catch (err) {
      console.error("⚠️ Error starting voice chat:", err);
    }
  };

  // 🔇 Stop voice chat
  const stopVoiceChat = async () => {
    if (!avatar || !session) return;
    try {
      await avatar.stopVoiceChat({ sessionId: session.session_id });
      setIsVoiceChat(false);
      console.log("🔇 Voice chat stopped");
    } catch (err) {
      console.warn("⚠️ Error stopping voice chat:", err);
    }
  };

  return (
    <main
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}
    >
      <h1>HeyGen Avatar (React + Voice Talk)</h1>

      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={false}
        controls
        style={{ borderRadius: "12px",height:"400px",width:"400px" }}
      />

      {/* Controls */}
      <div>
        <button onClick={startSession} disabled={!!session}>
          Start Session
        </button>
        <button onClick={endSession} disabled={!session} style={{ marginLeft: "0.5rem" }}>
          End Session
        </button>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <input
          type="text"
          placeholder="Type something..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{ marginRight: "0.5rem" }}
        />
        <button onClick={speakText} disabled={!session || !inputText}>
          Speak
        </button>
      </div>

      {/* 🎤 Voice Chat Toggle */}
      <div style={{ marginTop: "1rem" }}>
        {!isVoiceChat ? (
          <button onClick={startVoiceChat} disabled={!session}>
            🎤 Start Voice Chat
          </button>
        ) : (
          <button onClick={stopVoiceChat} disabled={!session}>
            🔇 Stop Voice Chat
          </button>
        )}
      </div>
    </main>
  );
};

export default HeyGenAvatar;
