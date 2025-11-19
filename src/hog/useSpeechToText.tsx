import { useEffect, useRef, useState } from "react";
import Voice from "@react-native-voice/voice";
import { ensureAllPermissions } from "../utils/permission";
import { ttsEvent, ttsBusy } from "../utils/tts";

let globalSTTLock = false;

export function useSpeechToText({ active = true, onResult, waiting = false }) {
  const [text, setText] = useState("");

  const recognizingRef = useRef(false);
  const pauseByTTS = useRef(false);

  const activeRef = useRef(active);
  const onResultRef = useRef(onResult);
  const waitingRef = useRef(waiting);

  useEffect(() => {
    activeRef.current = active;
    onResultRef.current = onResult;
    waitingRef.current = waiting;
  }, [active, onResult, waiting]);

  useEffect(() => {
    const init = async () => await ensureAllPermissions();
    init();

    // ====== TTS Event ======
    ttsEvent.addListener("tts-start", async () => {
      pauseByTTS.current = true;
      await pauseSTT();
    });

    ttsEvent.addListener("tts-end", async () => {
      pauseByTTS.current = false;

      setTimeout(() => {
        if (activeRef.current && !waitingRef.current) {
          startSTT();
        }
      }, 800);
    });

    // ====== STT Callbacks ======

    Voice.onSpeechStart = () => {
      recognizingRef.current = true;
      console.log("🎙️ STT aktif");
    };

    Voice.onSpeechEnd = () => {
      recognizingRef.current = false;

      if (activeRef.current && !waitingRef.current) {
        setTimeout(() => startSTT(), 900);
      }
    };

    Voice.onSpeechResults = (event) => {
      const result = event.value?.[0] || "";
      console.log("🗣️ Hasil:", result);

      setText(result);
      if (result && onResultRef.current) onResultRef.current(result);
    };

    Voice.onSpeechError = () => {
      recognizingRef.current = false;

      if (activeRef.current && !waitingRef.current) {
        setTimeout(() => startSTT(), 1200);
      }
    };

    // ====== cleanup ======
    return () => {
      Voice.destroy().catch(() => {});
      Voice.removeAllListeners();
      ttsEvent.removeAllListeners();
    };
  }, [active, waiting]);

  // ===== FUNCTIONS =====

  async function startSTT() {
    if (globalSTTLock) return;
    if (ttsBusy) return;
    if (waitingRef.current) return;
    if (recognizingRef.current) return;

    globalSTTLock = true;

    try {
      await Voice.destroy();
      await new Promise((r) => setTimeout(r, 300));
      await Voice.start("id-ID");
      console.log("🎙️ STT STARTED");
    } catch (e) {
      console.error("❌ error start STT:", e);
    }

    globalSTTLock = false;
  }

  async function pauseSTT() {
    if (!recognizingRef.current) return;

    try {
      await Voice.cancel();
      recognizingRef.current = false;
      console.log("⏸️ STT PAUSED");
    } catch (e) {
      console.error("❌ error pause STT:", e);
    }
  }

  return { text };
}
