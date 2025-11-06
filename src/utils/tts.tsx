import Tts from 'react-native-tts';
import { EventEmitter } from 'fbemitter';

export const ttsEvent = new EventEmitter();   // buat komunikasi STT
export const ttsState = new EventEmitter();   // buat kontrol mic di Home

let inited = false;
export let ttsBusy = false;

function setTTSBusy(state: boolean) {
  ttsBusy = state;
  ttsState.emit('change', ttsBusy);
}

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

    // ✅ Gunakan event bawaan react-native-tts
    Tts.addEventListener('tts-start', () => {
      if (ttsBusy) return;
      console.log('🗣️ [TTS] Mulai bicara');
      setTTSBusy(true);
      ttsEvent.emit('tts-start');
    });

    Tts.addEventListener('tts-finish', () => {
      if (!ttsBusy) return;
      console.log('✅ [TTS] Selesai bicara');
      setTTSBusy(false);
      ttsEvent.emit('tts-end');
    });

    Tts.addEventListener('tts-cancel', () => {
      if (!ttsBusy) return;
      console.log('🚫 [TTS] Dibatalkan');
      setTTSBusy(false);
      ttsEvent.emit('tts-end');
    });

    inited = true;
  } catch (e) {
    console.warn('⚠️ Gagal inisialisasi TTS:', e);
  }
}

export async function speak(text: string) {
  if (!text) return;
  try {
    if (ttsBusy) {
      await Tts.stop();
      await new Promise(r => setTimeout(r, 200));
    }
    console.log('🎤 [TTS] Bicara:', text);
    await Tts.speak(text);
  } catch (e) {
    console.warn('⚠️ Gagal speak:', e);
  }
}
