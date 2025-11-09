import { useEffect, useRef, useState } from "react";
import Voice from "@react-native-voice/voice";
import { ensureAllPermissions } from "../utils/permission";
// IMPOER ttsBusy dan ttsCooldown dari tts.js
import { ttsEvent, ttsBusy, ttsCooldown } from "../utils/tts";

// Tambahkan lock global untuk mencegah 'start' ganda
let globalSTTLock = false;

export function useSpeechToText({ active = true, onResult }) {
  const [text, setText] = useState("");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState(null);
  const recognizingRef = useRef(false);
  const pauseByTTS = useRef(false);
  const initialized = useRef(false); // Tambahkan ini
  const activeRef = useRef(active);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    activeRef.current = active;
    onResultRef.current = onResult;
  }, [active, onResult]);

  // 🎧 Setup listener hanya sekali
  useEffect(() => {
    // Tambahkan penjaga ini
    if (initialized.current) return;
    initialized.current = true;

    console.log("🟢 useSpeechToText mounted");

   (async () => {
     const ok = await ensureAllPermissions();
     console.log("🎙️ Permission granted:", ok);
    })();

    // ==========================================================
    // 1. PERBAIKAN: Fungsi 'resumeSTT' yang lebih aman
    // ==========================================================
     const resumeSTT = async () => {
      // Cek dulu apakah STT memang di-pause oleh TTS
      if (!pauseByTTS.current) {
        console.log("🔊 TTS-END, tapi STT tidak di-pause oleh TTS. Abaikan.");
        return;
      }

      console.log("🔊 TTS selesai, menunggu cooldown...");
      pauseByTTS.current = false; // Reset flag

      // Tunggu 2 detik (1.5s cooldown TTS + 0.5s buffer)
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

      if (!recognizingRef.current && activeRef.current) { // Cek 'active' prop terbaru
        console.log("🎙️ Mulai lagi STT setelah jeda aman");
        await start();
      }
    };
    
    // ==========================================================
    // 2. PERBAIKAN: Listener 'tts-start'
    // ==========================================================
    ttsEvent.addListener('tts-start', async () => {
      console.log("🔇 [TTS-START] STT harus berhenti.");
      pauseByTTS.current = true; // Tandai bahwa STT berhenti karena TTS
      await stop(); // Panggil fungsi stop baru Anda yang sudah ada destroy()
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

    // ==========================================================
    // 3. PERBAIKAN: 'onSpeechEnd' yang cerdas
    // ==========================================================
    Voice.onSpeechEnd = async () => {
      console.log("🎤 Sesi STT berakhir");
      recognizingRef.current = false;
      setIsRecognizing(false);

      // Cek apakah STT boleh auto-restart
      if (activeRef.current && !ttsBusy && !pauseByTTS.current) {
        console.log("🔁 Restart STT otomatis (bukan karena TTS)");
        // Beri jeda sedikit sebelum restart
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

    // ==========================================================
    // 4. PERBAIKAN: 'onSpeechError' yang cerdas
    // ==========================================================
    Voice.onSpeechError = (err) => {
      console.error("❌ Speech error:", JSON.stringify(err, null, 2));
      recognizingRef.current = false;
      setIsRecognizing(false);
      setError(err);

      setTimeout(() => {
        // Jangan restart jika error terjadi karena TTS
        if (activeRef.current && !ttsBusy && !pauseByTTS.current) {
          console.log("🔁 Restart STT setelah error aman");
          start()
        }
      }, 1000);
    };

    // 🧹 Cleanup saat benar-benar unmount aplikasi
    return () => {
      console.log("🔴 useSpeechToText unmounted — hapus listener");
      try {
        ttsEvent.removeAllListeners('tts-start');
        ttsEvent.removeAllListeners('tts-end');
        Voice.removeAllListeners(); // Hapus semua listener Voice
        Voice.destroy().then(() => console.log("🧹 Voice destroyed"));
      } catch (err) {
        console.warn("⚠️ Gagal hapus listener:", err);
      }
    };
  }, []); // Tambahkan 'active' di dependency array

  // 🔄 Auto start/stop STT
  useEffect(() => {
    // Beri buffer sedikit
    const timer = setTimeout(() => {
      if (active && !recognizingRef.current) {
        console.log("🎙️ [HOOK] Active = true, mulai STT");
        start();
      } else if (!active && recognizingRef.current) {
        console.log("🛑 [HOOK] Active = false, hentikan STT");
        stop();
      }
    }, 300); // 0.3 detik buffer

    return () => clearTimeout(timer);
  }, [active]);

  // ==========================================================
  // 5. PERBAIKAN: Fungsi 'start' dengan global lock
  // ==========================================================
  async function start() {
    if (globalSTTLock) {
      console.log("⏳ [LOCK] Operasi 'start' lain sedang berjalan, abaikan.");
      return;
    }

    try {
      globalSTTLock = true; 

      if (ttsBusy || ttsCooldown) {
        console.log("⏳ TTS masih aktif / cooldown, STT tidak boleh mulai");
        return; // finally akan me-release lock
      }
      if (recognizingRef.current) {
        console.log("⚠️ STT masih aktif, abaikan start baru");
        return; // finally akan me-release lock
      }

      console.log("🎙️ Mulai STT (id-ID)");
      // Jangan set state di sini, biarkan onSpeechStart yang handle
      // recognizingRef.current = true;
      // setIsRecognizing(true);

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

  // ==========================================================
  // 6. PERBAIKAN: Fungsi 'stop' yang kuat
  // ==========================================================
  async function stop() {
    try {
      if (!recognizingRef.current) {
        console.log("🛑 STT sudah berhenti, abaikan.");
        return;
      }
      console.log("🛑 [STOP] Meminta penghentian STT...");
      // Jangan set state di sini, biarkan onSpeechEnd yg handle
      await Voice.stop();
      await Voice.destroy(); 
      console.log("🛑 STT dihentikan (destroyed)");
    } catch (e) {
      console.error("❌ Speech stop/destroy error:", e);
      // Jika gagal, paksa set state
      recognizingRef.current = false;
      setIsRecognizing(false);
      setError(e);
    }
  }

  return { text, isRecognizing, error, start, stop };
}