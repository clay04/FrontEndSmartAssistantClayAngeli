import Tts from 'react-native-tts';
import { EventEmitter } from 'fbemitter'; // 👈 untuk event lokal
import { NativeEventEmitter } from 'react-native';

const ttsNative = new NativeEventEmitter(Tts);
export const ttsEvent = new EventEmitter(); // 👈 tidak tergantung native module

let inited = false;
let ttsBusy = false;

export async function initTTS(preferredLang = 'id-ID') {
  if (inited) return;

  try {
    const voices = (await Tts.voices()) || [];
    const idVoice =
      voices.find((v: any) => (v.language || '').toLowerCase().startsWith('id') && !v.notInstalled) ||
      voices.find((v: any) => (v.language || '').toLowerCase().includes('id') && !v.notInstalled);

    if (idVoice) {
      if (idVoice.language) await Tts.setDefaultLanguage(idVoice.language);
      if (idVoice.id) await Tts.setDefaultVoice(idVoice.id);
    } else {
      try { await Tts.setDefaultLanguage(preferredLang); } catch {}
    }

    await Tts.setDefaultRate(1.0, true);
    await Tts.setDefaultPitch(1.0);

    // 🎧 Dengarkan event dari NativeEventEmitter lalu teruskan ke fbemitter lokal
    ttsNative.addListener('tts-start', () => {
      if (ttsBusy) return;
      ttsBusy = true;
      console.log('TTS Bicara');
      ttsEvent.emit('tts-start');
    });

    ttsNative.addListener('tts-finish', () => {
      if (!ttsBusy) return;
      console.log('TTS Selesai');
      ttsBusy = false;
      ttsEvent.emit('tts-end');
    });

    ttsNative.addListener('tts-cancel', () => {
      if (!ttsBusy) return;
      console.log('TTS Batal');
      ttsBusy = false;
      ttsEvent.emit('tts-end');
    });

    inited = true;
  } catch (e) {
    console.warn('TTS init failed', e);
  }
}

export function speak(text: string) {
  if (!text) return;
  Tts.stop();
  Tts.speak(text);
  console.log("🗣️ Speaking:", text);
}
