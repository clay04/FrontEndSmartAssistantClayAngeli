import Tts from 'react-native-tts';
import { EventEmitter } from 'fbemitter';
import { NativeEventEmitter } from 'react-native';

const ttsNative = new NativeEventEmitter(Tts);
export const ttsEvent = new EventEmitter();
export const ttsState = new EventEmitter(); // tambahkan event global untuk mic control

let inited = false;
export let ttsBusy = false;

function setTTSBusy(state) {
  ttsBusy = state;
  ttsState.emit('change', ttsBusy); // broadcast perubahan state
}

let listeners = [];

export async function initTTS(preferredLang = 'id-ID') {
  if (inited) return;

  try {
    const voices = (await Tts.voices()) || [];
    const idVoice =
      voices.find(v => (v.language || '').toLowerCase().startsWith('id') && !v.notInstalled) ||
      voices.find(v => (v.language || '').toLowerCase().includes('id') && !v.notInstalled);

    if (idVoice) {
      if (idVoice.language) await Tts.setDefaultLanguage(idVoice.language);
      if (idVoice.id) await Tts.setDefaultVoice(idVoice.id);
    } else {
      try { await Tts.setDefaultLanguage(preferredLang); } catch {}
    }

    await Tts.setDefaultRate(1.0, true);
    await Tts.setDefaultPitch(1.0);

    listeners.forEach(l => l.remove());
    listeners = [];

    listeners.push(
      ttsNative.addListener('tts-start', () => {
        if (ttsBusy) return;
        setTTSBusy(true);
        console.log('🗣️ [TTS] Mulai bicara');
        ttsEvent.emit('tts-start');
      })
    );

    listeners.push(
      ttsNative.addListener('tts-finish', () => {
        if (!ttsBusy) return;
        console.log('🗣️ [TTS] Selesai bicara');
        setTimeout(() => {
          setTTSBusy(false);
          console.log('🕓 [TTS] Diam total → kirim tts-end');
          ttsEvent.emit('tts-end');
        }, 3000); // jeda agar suara benar-benar selesai
      })
    );

    listeners.push(
      ttsNative.addListener('tts-cancel', () => {
        if (!ttsBusy) return;
        console.log('🗣️ [TTS] Dibatalkan');
        setTimeout(() => {
          setTTSBusy(false);
          console.log('🕓 [TTS] Delay selesai, kirim tts-end');
          ttsEvent.emit('tts-end');
        }, 3000);
      })
    );

    inited = true;
  } catch (e) {
    console.warn('TTS init failed', e);
  }
}

export async function speak(text: string) {
  if (!text) return;
  try {
    if (ttsBusy) {
      await Tts.stop();
      await new Promise(r => setTimeout(r, 300));
    }
    console.log('🎤 Memulai speak():', text);
    Tts.speak(text);
  } catch (e) {
    console.warn('⚠️ Gagal mulai TTS:', e);
  }
}
