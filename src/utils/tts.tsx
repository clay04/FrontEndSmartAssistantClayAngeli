import Tts from 'react-native-tts';
import { EventEmitter } from 'fbemitter';
import { NativeEventEmitter } from 'react-native';

const ttsNative = new NativeEventEmitter(Tts);
export const ttsEvent = new EventEmitter();
export const ttsState = new EventEmitter();

let inited = false;
export let ttsBusy = false; // 👈 Ekspor ini
export let ttsCooldown = false; // 👈 Tambahkan ini

// Buat fungsi untuk mengontrol state
function setTTSBusy(state: boolean) {
  ttsBusy = state;

  if (!state) {
    // Jika TTS baru saja SELESAI
    // Beri waktu cooldown 1.5 detik sebelum STT boleh hidup lagi
    ttsCooldown = true;
    setTimeout(() => {
      console.log("🆒 Cooldown TTS selesai, STT boleh aktif");
      ttsCooldown = false;
    }, 2500); // 1.5 detik
  }
}


export async function initTTS(preferredLang = 'id-ID') {
  if (inited) return;

  try {
    // ... (kode initTTS Anda yang lain sudah benar) ...
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
    // ... (kode initTTS Anda yang lain sudah benar) ...


    // 🎧 Dengarkan event dari NativeEventEmitter lalu teruskan ke fbemitter lokal
    ttsNative.addListener('tts-start', () => {
      if (ttsBusy) return;
      console.log('🗣️ [TTS] Mulai bicara');
      setTTSBusy(true); // 👈 Gunakan fungsi setter
      ttsEvent.emit('tts-start');
    });

    ttsNative.addListener('tts-finish', () => {
      if (!ttsBusy) return;
      console.log('✅ [TTS] Selesai bicara');
      setTTSBusy(false); // 👈 Gunakan fungsi setter
      ttsEvent.emit('tts-end');
    });

    ttsNative.addListener('tts-cancel', () => {
      if (!ttsBusy) return;
      console.log('🚫 [TTS] Dibatalkan');
      setTTSBusy(false); // 👈 Gunakan fungsi setter
      ttsEvent.emit('tts-end');
    });

    inited = true;
  } catch (e) {
    console.warn('TTS init failed', e);
  }
}

export async function speak(text: string) { // 👈 Jadikan async
  if (!text) return;

  try {
    // Panggil setTTSBusy secara manual di sini untuk
    // memastikan 'ttsBusy' true SEBELUM 'Tts.speak' dipanggil
    setTTSBusy(true); 
    ttsEvent.emit('tts-start'); // Emit manual agar STT langsung mati

    await Tts.stop();
    await new Promise(r => setTimeout(r, 100)); // jeda singkat
    console.log("🗣️ Speaking:", text);
    Tts.speak(text);
  } catch (e) {
    console.warn('⚠️ Gagal speak:', e);
    setTTSBusy(false); // Pastikan di-reset jika error
    ttsEvent.emit('tts-end');
  }
}