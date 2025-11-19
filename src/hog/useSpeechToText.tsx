import { useEffect, useRef, useState } from "react";
import Voice from "@react-native-voice/voice";
import { ensureAllPermissions } from "../utils/permission";
import { ttsEvent, ttsBusy, ttsCooldown } from "../utils/tts";

let globalSTTLock = false;

export function useSpeechToText({ active = true, onResult }) {
  const [text, setText] = useState("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState(null);
  const recognizingRef = useRef(false);
  const pauseByTTS = useRef(false);
  const initialized = useRef(false);
  const activeRef = useRef(active);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    activeRef.current = active;
    onResultRef.current = onResult;
  }, [active, onResult]);

  useEffect(() => {

    if (initialized.current) return;
    initialized.current = true;

    console.log("🟢 useSpeechToText mounted");

   (async () => {
     const ok = await ensureAllPermissions();
     console.log("🎙️ Permission granted:", ok);
    })();

     const resumeSTT = async () => {
      if (!pauseByTTS.current) {
        console.log("🔊 TTS-END, tapi STT tidak di-pause oleh TTS. Abaikan.");
        return;
      }

      console.log("🔊 TTS selesai, menunggu cooldown...");
      pauseByTTS.current = false;

      await new Promise(r => setTimeout(r, 2500));

     if (ttsBusy) {
        console.log("⏸️ Masih ttsBusy, coba lagi 1.5 detik...");
        await new Promise(r => setTimeout(r, 1500));
        if (!ttsBusy && activeRef.current && !recognizingRef.current) {
          console.log("🎙️ [Retry] Mulai STT setelah ttsBusy berakhir");
          await start();
        } else {
          console.log("🕓 [Retry] Masih tidak aman, STT tetap off");
        }
        return;
      }

      if (!recognizingRef.current && activeRef.current) {
        console.log("🎙️ Mulai lagi STT setelah jeda aman");
        await start();
      }
    };
    
    ttsEvent.addListener('tts-start', async () => {
      console.log("🔇 [TTS-START] STT harus berhenti.");
      pauseByTTS.current = true;
      await stop();
    });

    ttsEvent.addListener('tts-end', resumeSTT);


    Voice.onSpeechStart = () => {
      if (recognizingRef.current) {
       console.warn("⚠️ STT masih aktif, abaikan start baru");
       return;
      }
      console.log("✅ Voice.onSpeechStart (STT AKTIF)");
      recognizingRef.current = true;
      setIsRecognizing(true);
    };

    Voice.onSpeechEnd = async () => {
      console.log("🎤 Sesi STT berakhir");
      recognizingRef.current = false;
      setIsRecognizing(false);

      if (activeRef.current && !ttsBusy && !pauseByTTS.current) {
       console.log("🔁 Restart STT otomatis (bukan karena TTS)");
       await new Promise(r => setTimeout(r, 1500)); 
       start();
      } else {
        console.log("⏹️ Sesi STT berakhir, tidak restart (karena TTS atau hook 'active=false')");
      }
    };

    Voice.onSpeechResults = (event) => {
      const result = event.value?.[0] || "";
      console.log("🗣️ [EVENT] Hasil STT:", result);
      setText(result);
      if (result.trim() && onResultRef.current) onResultRef.current(result);
    };

    Voice.onSpeechPartialResults = (event) => {
      if (event.value?.length) console.log("💬 Request:", event.value[0]);
    };

    Voice.onSpeechError = (err) => {
      console.error("❌ Speech error:", JSON.stringify(err, null, 2));
      recognizingRef.current = false;
      setIsRecognizing(false);
      setError(err);

      setTimeout(() => {
       if (activeRef.current && !ttsBusy && !pauseByTTS.current) {
        console.log("🔁 Restart STT setelah error aman");
        start()
       }
      }, 1000);
    };

    return () => {
      console.log("🔴 useSpeechToText unmounted — hapus listener");
      try {
       ttsEvent.removeAllListeners('tts-start');
       ttsEvent.removeAllListeners('tts-end');
       Voice.removeAllListeners(); 
       Voice.destroy().then(() => console.log("🧹 Voice destroyed"));
      } catch (err) {
       console.warn("⚠️ Gagal hapus listener:", err);
      }
    };
  }, []); 

  useEffect(() => {
    const timer = setTimeout(() => {
      if (active && !recognizingRef.current) {
        console.log("🎙️ [HOOK] Active = true, mulai STT");
        start();
      } else if (!active && recognizingRef.current) {
        console.log("🛑 [HOOK] Active = false, hentikan STT");
        stop();
      }
    }, 300); 

    return () => clearTimeout(timer);
  }, [active]);

  async function start() {
    if (globalSTTLock) {
      console.log("⏳ [LOCK] Operasi 'start' lain sedang berjalan, abaikan.");
      return;
    }

    try {
      globalSTTLock = true; 

      if (ttsBusy || ttsCooldown) {
       console.log("⏳ TTS masih aktif / cooldown, STT tidak boleh mulai");
       return; 
      }
      if (recognizingRef.current) {
       console.log("⚠️ STT masih aktif, abaikan start baru");
       return; 
      }

      console.log("🎙️ Mulai STT (id-ID)");

      await Voice.destroy(); 
      await new Promise((r) => setTimeout(r, 400));
      await Voice.start("id-ID");
      console.log("✅ Voice.start() sukses");

  } catch (e) {
      console.error("❌ Speech start error:", e);
      recognizingRef.current = false; 
      setIsRecognizing(false);
      setError(e);
  } finally {
      globalSTTLock = false; 
  }
  }

  async function stop() {
    try {
      if (!recognizingRef.current) {
        console.log("🛑 STT sudah berhenti, abaikan.");
        return;
      }
      console.log("🛑 [STOP] Meminta penghentian STT...");
      await Voice.stop();
      await Voice.destroy(); 
      console.log("🛑 STT dihentikan (destroyed)");
    } catch (e) {
      console.error("❌ Speech stop/destroy error:", e);
      recognizingRef.current = false;
      setIsRecognizing(false);
      setError(e);
    }
  }

  return { text, isRecognizing, error, start, stop };
}