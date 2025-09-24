import { useEffect, useRef, useState } from 'react';
import AudioRecord from 'react-native-audio-record';

type MicOptions = {
  segmentMs?: number;
  enabled?: boolean;
  onSegment?: (uri: string) => void;
};

export function useMicSegmenter({
  segmentMs = 5000,
  enabled = false,
  onSegment,
}: MicOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  async function startOnce() {
    try {
      setIsRecording(true);

      // 🔧 Konfigurasi rekaman → hasil .wav valid
      AudioRecord.init({
        sampleRate: 16000,   // sesuai kebutuhan STT
        channels: 1,
        bitsPerSample: 16,
        wavFile: `segment_${Date.now()}.wav`,
      });

      await AudioRecord.start();

      timerRef.current = setTimeout(async () => {
        try {
          const out = await AudioRecord.stop(); // 👉 out = path file wav
          setIsRecording(false);

          if (onSegment && out) {
            onSegment(out);
          }

          if (enabled) startOnce(); // rekursif
        } catch (e) {
          console.error('Stop recorder error:', e);
          setIsRecording(false);
        }
      }, segmentMs);
    } catch (e) {
      console.error('Start recorder error:', e);
      setIsRecording(false);
    }
  }

  useEffect(() => {
    if (enabled) startOnce();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      try {
        AudioRecord.stop();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, segmentMs]);

  return { isRecording };
}
