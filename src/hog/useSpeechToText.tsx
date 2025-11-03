import { useEffect, useRef, useState } from "react";
import Voice from "@react-native-voice/voice";
import { ensureAllPermissions } from "../utils/permission";
import { ttsEvent } from "../utils/tts";

export function useSpeechToText({ active = true, onResult }) {
  const [text, setText] = useState("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState(null);
  const recognizingRef = useRef(false);
  const pauseByTTS = useRef(false);

  // 🎧 Setup listener hanya sekali
  useEffect(() => {
    console.log("🟢 useSpeechToText mounted");

    (async () => {
      const ok = await ensureAllPermissions();
      console.log("🎙️ Permission granted:", ok);
    })();

    const stopSTT = async () => {
      if (recognizingRef.current) {
        console.log("pause, TTS aktif");
        pauseByTTS.current = true;
        await Voice.stop();
        recognizingRef.current = false;
        setIsRecognizing(false);
      }
    };

    const resumeSTT = async () => {
      if (pauseByTTS.current && active) {
        console.log("TTS Selesai, lanjut STT");
        pauseByTTS.current = false;
        await start();
      }
    }
    ttsEvent.addListener('tts-start', stopSTT)
    ttsEvent.addListener('tts-end', resumeSTT)

    Voice.onSpeechStart = () => {
      if (recognizingRef.current) {
        console.warn("⚠️ STT masih aktif, abaikan start baru");
        return;
      }
      recognizingRef.current = true;
      setIsRecognizing(true);
    };

    Voice.onSpeechEnd = async () => {
      console.log("🎤 Sesi STT berakhir");
      recognizingRef.current = false;
      setIsRecognizing(false);
    };

    Voice.onSpeechResults = (event) => {
      const result = event.value?.[0] || "";
      console.log("🗣️ [EVENT] Hasil STT:", result);
      setText(result);
      if (result.trim() && onResult) onResult(result);
    };

    Voice.onSpeechRecognized = (event) => {
      console.log("👂 [EVENT] Speech recognized:", event);
    };

    Voice.onSpeechPartialResults = (event) => {
      console.log("💬 [EVENT] Partial result:", event.value);
    };

    Voice.onSpeechError = (err) => {
      console.error("❌ [EVENT] Speech error:", err);
      recognizingRef.current = false;
      setIsRecognizing(false);
    };

    // 🧹 Cleanup saat benar-benar unmount aplikasi
    return () => {
      console.log("🔴 useSpeechToText unmounted — hapus listener");

      try {
        // 🧹 Hapus semua event TTS yang didaftarkan
        ttsEvent.removeAllListeners('tts-start');
        ttsEvent.removeAllListeners('tts-end');

        // 🧹 Hapus semua event Voice satu per satu
        Voice.removeAllListeners('onSpeechStart');
        Voice.removeAllListeners('onSpeechEnd');
        Voice.removeAllListeners('onSpeechResults');
        Voice.removeAllListeners('onSpeechPartialResults');
        Voice.removeAllListeners('onSpeechRecognized');
        Voice.removeAllListeners('onSpeechError');

        Voice.destroy().then(() => console.log("🧹 Voice destroyed"));
      } catch (err) {
        console.warn("⚠️ Gagal hapus listener:", err);
      }
    };
  }, [onResult]);

  // 🔄 Auto start/stop STT
  useEffect(() => {
    if (active) {
      console.log("🎙️ [HOOK] Active = true, mulai STT");
      start();
    } else {
      console.log("🛑 [HOOK] Active = false, hentikan STT");
      stop();
    }
  }, [active]);

  async function start() {
    try {
      if (recognizingRef.current) {
        console.log("⚠️ STT masih aktif, abaikan start baru");
        return;
      }

      recognizingRef.current = true;
      console.log("🎙️ Mulai STT (id-ID)");

      await Voice.destroy(); // pastikan bersih sebelum mulai
      await new Promise((r) => setTimeout(r, 400));

      await Voice.start("id-ID");
      console.log("✅ Voice.start() sukses");
    } catch (e) {
      console.error("❌ Speech start error:", e);
      recognizingRef.current = false;
      setError(e);
    }
  }


  async function stop() {
    try {
      await Voice.stop();
      console.log("🛑 STT dihentikan");
      setIsRecognizing(false);
    } catch (e) {
      console.error("❌ Speech stop error:", e);
      setError(e);
    }
  }

  return { text, isRecognizing, error, start, stop };
}
