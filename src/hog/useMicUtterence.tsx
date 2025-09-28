import { useEffect, useRef, useState } from "react";
import AudioRecord from "react-native-audio-record";
import RNFS from "react-native-fs";
import { fromByteArray, toByteArray } from "base64-js";

type Status = "idle" | "listening";

interface MicUtteranceOptions {
  enabled: boolean;
  onUtterance: (fileUri: string, base64: string) => void | Promise<void>;
}

const SAMPLE_RATE = 16000;
const SILENCE_THRESHOLD = 0.01;   // ambang bicara
const SILENCE_DURATION = 1000;    // 1 detik diam -> stop
const MIN_UTTERANCE_MS = 700;     // utterance minimal 0.7 detik

function rmsFromPCM(base64PCM: string): number {
  try {
    const pcmBytes = toByteArray(base64PCM); // decode base64 → Uint8Array
    const samples = new Int16Array(
      pcmBytes.buffer,
      pcmBytes.byteOffset,
      pcmBytes.length / 2
    );

    let sumSquares = 0;
    for (let i = 0; i < samples.length; i++) {
      const norm = samples[i] / 32768;
      sumSquares += norm * norm;
    }

    const rms = Math.sqrt(sumSquares / samples.length);
    return rms;
  } catch (err) {
    console.warn("PCM decode error:", err);
    return 0;
  }
}

export function useMicUtterance({ enabled, onUtterance }: MicUtteranceOptions) {
  const [status, setStatus] = useState<Status>("idle");
  const [volumeLevel, setVolumeLevel] = useState(0);

  const utteranceChunks = useRef<string[]>([]);
  const lastVoiceTime = useRef<number>(0);
  const utteranceStart = useRef<number | null>(null);
  const vadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      console.log("🎤 Mic disabled");
      return;
    }

    AudioRecord.init({
      sampleRate: SAMPLE_RATE,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6,
    });

    AudioRecord.start();
    console.log("🎤 Mic started (VAD aktif)");

    AudioRecord.on("data", handlePCM);

    return () => {
      console.log("🛑 Mic stopped");
      AudioRecord.stop();
      if (vadTimeoutRef.current) clearTimeout(vadTimeoutRef.current);
    };
  }, [enabled]);

  async function handlePCM(base64PCM: string) {
    if (!enabled) return;

    const volume = rmsFromPCM(base64PCM);
    setVolumeLevel(volume);

    if (volume > SILENCE_THRESHOLD) {
      // ada suara
      if (vadTimeoutRef.current) clearTimeout(vadTimeoutRef.current);

      if (status === "idle") {
        console.log("🎙️ Mulai utterance");
        setStatus("listening");
        utteranceChunks.current = [];
        utteranceStart.current = Date.now();
      }

      utteranceChunks.current.push(base64PCM);
      lastVoiceTime.current = Date.now();

      // reset timer deteksi diam
      vadTimeoutRef.current = setTimeout(() => {
        stopUtterance();
      }, SILENCE_DURATION);
    }
  }

  function encodeWav(samples: Uint8Array, sampleRate: number): Uint8Array {
        const buffer = new ArrayBuffer(44 + samples.length);
        const view = new DataView(buffer);

        const writeString = (offset: number, str: string) => {
            for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
            }
        };

        const numChannels = 1;
        const bitsPerSample = 16;

        writeString(0, "RIFF");
        view.setUint32(4, 36 + samples.length, true);
        writeString(8, "WAVE");
        writeString(12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
        view.setUint16(32, numChannels * bitsPerSample / 8, true);
        view.setUint16(34, bitsPerSample, true);
        writeString(36, "data");
        view.setUint32(40, samples.length, true);

        new Uint8Array(buffer).set(samples, 44);
        return new Uint8Array(buffer);
    }


  async function stopUtterance() {
    if (status !== "listening") return;

    const duration = Date.now() - (utteranceStart.current || 0);
    if (duration < MIN_UTTERANCE_MS) {
        console.log("❌ Utterance terlalu pendek, diabaikan");
        setStatus("idle");
        utteranceChunks.current = [];
        return;
    }

    console.log("⏹️ Utterance selesai, proses...");

    try {
        // ✅ decode semua chunk lalu gabung ke Uint8Array
        const pcmBuffers = utteranceChunks.current.map((b64) => toByteArray(b64));
        const totalLength = pcmBuffers.reduce((a, b) => a + b.length, 0);
        const merged = new Uint8Array(totalLength);

        let offset = 0;
        for (const buf of pcmBuffers) {
        merged.set(buf, offset);
        offset += buf.length;
        }

        // ⚠️ bungkus jadi WAV
        const wavBytes = encodeWav(merged, SAMPLE_RATE);
        const base64Audio = fromByteArray(wavBytes);

        const wavFile = RNFS.CachesDirectoryPath + `/utt_${Date.now()}.wav`;
        await RNFS.writeFile(wavFile, base64Audio, "base64");

        await onUtterance(wavFile, base64Audio);
        } catch (err) {
            console.error("Utterance processing error:", err);
        } finally {
            setStatus("idle");
            utteranceChunks.current = [];
            utteranceStart.current = null;
        }
    }


  return { status, volumeLevel };
}
