import { Platform } from "react-native";

export type UploadPayload = {
  photoPath?: string | null;
  audioPath?: string | null;
};

export async function uploadToBackend(
  endpoint: string,
  { photoPath, audioPath }: UploadPayload,
): Promise<any> {
  const form = new FormData();

  if (photoPath) {
    console.log("📸 SNAP path:", photoPath);   // <-- cek path sebelum upload
    form.append('image', {
        uri: photoPath,
        type: 'image/jpeg',
        name: `photo_${Date.now()}.jpg`,
    } as any);
    } else {
    console.warn("⚠️ No photoPath provided");
    }


  if (audioPath) {
    console.log("🎤 AUDIO path:", audioPath);
    form.append('audio', {
      uri: Platform.OS === 'android' ? audioPath.startsWith('file://') ? audioPath : `file://${audioPath}` : audioPath,
      type: 'audio/m4a',
      name: `voice_${Date.now()}.m4a`,
    } as any);
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      //'Content-Type': 'multipart/form-data', // ✅ wajib
    },
    body: form,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }

  return res.json();
}