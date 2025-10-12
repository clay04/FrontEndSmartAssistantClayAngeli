import Tts from 'react-native-tts';

let inited = false;

export async function initTTS(preferredLang = 'id-ID') {
  if (inited) return;
  try {
    const voices = (await Tts.voices()) || [];
    // pilih voice yang bahasa-nya mulai dengan 'id' jika ada
    const idVoice = voices.find((v: any) => (v.language || '').toLowerCase().startsWith('id') && !v.notInstalled)
      || voices.find((v: any) => (v.language || '').toLowerCase().includes('id') && !v.notInstalled);

    if (idVoice) {
      if (idVoice.language) await Tts.setDefaultLanguage(idVoice.language);
      if (idVoice.id) await Tts.setDefaultVoice(idVoice.id);
    } else {
      // coba set language secara langsung (akan gagal kalau engine tidak punya)
      try { await Tts.setDefaultLanguage(preferredLang); } catch {}
    }

    await Tts.setDefaultRate(1.0, true);
    await Tts.setDefaultPitch(1.0);
  } catch (e) {
    console.warn('TTS init failed', e);
  } finally {
    inited = true;
  }
}

export function speak(text: string) {
  if (!text) return;
  Tts.stop();
  Tts.speak(text);
  console.log("🗣️ Speaking:", text);
}
