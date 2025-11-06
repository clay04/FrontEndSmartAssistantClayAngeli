import { useEffect, useRef, useState } from "react";
import Voice from "@react-native-voice/voice";
import { ensureAllPermissions } from "../utils/permission";
import { ttsEvent } from "../utils/tts";
import { ttsBusy } from "../utils/tts";

export function useSpeechToText({ active = true, onResult }) {
  const [text, setText] = useState("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState(null);
  const recognizingRef = useRef(false);
  const pauseByTTS = useRef(false);
  const initialized = useRef(false);

  // 🎧 Setup listener hanya sekali
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    console.log("🟢 useSpeechToText mounted");

    (async () => {
      const ok = await ensureAllPermissions();
      console.log("🎙️ Permission granted:", ok);
    })();

    const stopSTT = async () => {
      if (recognizingRef.current) {
        console.log("🔇 pause, TTS aktif");
        pauseByTTS.current = true;
        try {
          await Voice.stop()
          await Voice.destroy()
        } catch(err) {
          console.log('Gagal Stop STT', err)
        }
        recognizingRef.current = false;
        setIsRecognizing(false);
      }
    };

    const resumeSTT = async () => {
      if (pauseByTTS.current && active) {
        console.log("🔊 TTS selesai, tahan dulu sebelum STT");
        pauseByTTS.current = true;

        // Tahan minimal 3 detik setelah tts-end baru boleh hidup lagi
        await new Promise(r => setTimeout(r, 3500));

        if (ttsBusy) {
          console.log("⏸️ Masih ttsBusy, STT skip sementara");
          await stopSTT();
          return;
        }

        if (!recognizingRef.current && active) {
          console.log("🎙️ Mulai lagi STT setelah jeda aman");
          await start();
        }
      }
    };

    ttsEvent.addListener("tts-start", stopSTT);
    ttsEvent.addListener("tts-end", resumeSTT);

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

      if (active && !ttsBusy) {
        console.log("🔁 Restart STT otomatis setelah sesi selesai");
        await new Promise(r => setTimeout(r, 2000));
        start();
      }
    };

    Voice.onSpeechResults = (event) => {
      const result = event.value?.[0] || "";
      console.log("🗣️ [EVENT] Hasil STT:", result);
      setText(result);
      if (result.trim() && onResult) onResult(result);
    };

    Voice.onSpeechPartialResults = (event) => {
      if  (event.value?.length) console.log("💬 Request:", event.value[0]);
    };

    Voice.onSpeechError = (err) => {
      console.error("❌ Speech error:", JSON.stringify(err, null, 2));
      recognizingRef.current = false;
      setIsRecognizing(false);
      setError(err);

      // biar gak langsung nyala lagi waktu error karena feedback
      setTimeout(() => {
        if (active && !ttsBusy) {
          console.log("🔁 Restart STT setelah error aman");
          setIsRecognizing(true);
          start()
        }
      }, 1000);
    };

    // 🧹 Cleanup hanya saat unmount permanen
    return () => {
      console.log("🔴 useSpeechToText unmounted — hapus listener");

      try {
        ttsEvent.removeAllListeners("tts-start");
        ttsEvent.removeAllListeners("tts-end");
        Voice.removeAllListeners("onSpeechStart");
        Voice.removeAllListeners("onSpeechEnd");
        Voice.removeAllListeners("onSpeechResults");
        Voice.removeAllListeners("onSpeechPartialResults");
        Voice.removeAllListeners("onSpeechRecognized");
        Voice.removeAllListeners("onSpeechError");

        Voice.destroy().then(() => console.log("🧹 Voice destroyed"));
      } catch (err) {
        console.warn("⚠️ Gagal hapus listener:", err);
      }
    };
  }, [onResult]);

  // 🔄 Auto start/stop STT
  useEffect(() => {
    // kalau STT masih aktif, jangan restart setiap kali active berubah
    if (active && !recognizingRef.current) {
      console.log("🎙️ [HOOK] Active = true → mulai STT");
      start();
    } else if (!active && recognizingRef.current) {
      console.log("🛑 [HOOK] Active = false → hentikan STT");
      stop();
    }
  }, [active]);

  async function start() {
    try {
      if (ttsBusy) {
        console.log("⏳ Tidak bisa mulai STT karena TTS masih bicara");
        stop();
        return;
      }

      if (recognizingRef.current) {
        console.log("⚠️ STT masih aktif, abaikan start baru");
        return;
      }

      console.log("🎙️ Mulai STT (id-ID)");
      recognizingRef.current = true;
      setIsRecognizing(true);

      await Voice.destroy(); // pastikan session lama ditutup
      await new Promise((r) => setTimeout(r, 1500)); // kasih jeda lebih panjang sebelum start

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
      recognizingRef.current = false;
      setIsRecognizing(false);
      console.log("🛑 STT dihentikan");
    } catch (e) {
      console.error("❌ Speech stop error:", e);
      setError(e);
    }
  }

  return { text, isRecognizing, error, start, stop };
}
