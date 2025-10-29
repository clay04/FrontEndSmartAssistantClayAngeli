import { useEffect, useRef, useState } from "react";
import Voice from "@react-native-voice/voice";
import { ensureAllPermissions } from "../utils/permission";

export function useSpeechToText({ active = true, onResult }) {
  const [text, setText] = useState("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState(null);
  const recognizingRef = useRef(false);
  const restartTimer = useRef<NodeJS.Timeout | null>(null);

  // 🎧 Setup listener hanya sekali
  useEffect(() => {
    console.log("🟢 useSpeechToText mounted");

    (async () => {
      const ok = await ensureAllPermissions();
      console.log("🎙️ Permission granted:", ok);
    })();

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

      // 🔄 Restart otomatis dengan jeda pendek
      if (active) {
        console.log("⏳ Menunggu 1 detik sebelum restart STT...");
        setTimeout(() => {
          if (!recognizingRef.current) {
            start(); // panggil ulang hanya jika belum mulai lagi
          }
        }, 1500);
      }
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

      if (active) {
        clearTimeout(restartTimer.current);
        restartTimer.current = setTimeout(() => {
          if (!recognizingRef.current) start();
        }, 2000); // kasih napas 2 detik
      }
    };

    // 🧹 Cleanup saat benar-benar unmount aplikasi
    return () => {
      console.log("🔴 useSpeechToText unmounted — hapus listener");
      Voice.removeAllListeners();
      Voice.destroy().then(() => console.log("Voice Destory"));
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
