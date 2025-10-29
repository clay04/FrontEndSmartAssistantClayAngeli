import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, StyleSheet, Text, View, ScrollView } from 'react-native';
import CameraStream, { CameraStreamHandle } from '../../components/CameraStream';
import { ensureAllPermissions } from '../../utils/permission';
import { initTTS, speak } from '../../utils/tts';
import { useMicUtterance } from '../../hog/useMicUtterence';
import { getCurrentLocation } from '../../utils/Location';

import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSpeechToText } from '../../hog/useSpeechToText';

const WS_ENDPOINT = 'ws://192.168.68.131:5000/voice/ws'; // WebSocket backend

// 🔧 Helper: file → base64
async function fileToBase64(uri: string): Promise<string> {
  const path = uri.replace('file://', '');
  return RNFS.readFile(path, 'base64');
}

// 🔧 Helper: kompres foto biar nggak kegedean
async function compressImage(uri: string): Promise<string> {
  try {
    const resized = await ImageResizer.createResizedImage(
      uri,
      512, // max width
      512, // max height
      'JPEG',
      80   // quality %
    );
    return resized.uri;
  } catch (e) {
    console.warn("⚠️ Gagal resize image, pakai original:", e);
    return uri;
  }
}

const Home: React.FC = () => {
  const camRef = useRef<CameraStreamHandle>(null);
  const ws = useRef<WebSocket | null>(null);

  const [permitted, setPermitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [waitingResponse, setWaitingResponse] = useState(false);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const [lastText, setLastText] = useState<string>('');
  const [micOn, setMicOn] = useState<boolean>(true);
  const [lastLocation, setLastLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // 🎤 Kirim audio + foto ke backend via WS
  const onSpeechResult = useCallback(async (speechText: string) => {
    console.log('🗣️ Hasil STT:', speechText);

    try {
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
        console.warn('❌ WebSocket belum siap');
        return;
      }

      // 📸 Ambil snapshot dari kamera
      let imageB64: string | null = null;
      if (camRef.current?.isReady()) {
        const snap = await camRef.current.takeSnapshot();
        setLastPhoto(snap ?? null);

        if (snap) {
          const resizedUri = await compressImage(snap);
          imageB64 = await fileToBase64(resizedUri);
        }
      }

      // 📍 Ambil lokasi terakhir
      let coords = null;
        try {
          coords = await getCurrentLocation();
          console.log("📍 Lokasi saat ini:", coords?.latitude, coords?.longitude);
        } catch (e) {
          console.warn('⚠️ Gagal mendapatkan lokasi:', e);
        }

      // 🔑 Ambil token akses
      const token = await AsyncStorage.getItem('access_token');

      // 📤 Buat payload dan kirim ke backend
      const payload = {
        type: 'request',
        text: speechText,
        image: imageB64,
        latitude: coords?.latitude || lastLocation?.latitude || null,
        longitude: coords?.longitude || lastLocation?.longitude || null,
        access_token: token,
      };

      const jsonStr = JSON.stringify(payload);
      //console.log('📦 Kirim payload:', jsonStr);

      ws.current.send(jsonStr);
      setSending(true);
      setWaitingResponse(true);
    } catch (err) {
      console.error('❌ Gagal kirim STT:', err);
    } finally {
      setSending(false);
    }
  }, [lastLocation]);

  // 🎙️ Inisialisasi Speech-to-Text
  useSpeechToText({
    active: micOn && permitted && !waitingResponse,
    onResult: onSpeechResult,
  });

  // 📡 Init WebSocket client
  useEffect(() => {
    const connectWS = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) {
          console.warn("❌ Tidak ada token akses, WS tidak diinisialisasi");
          return;
        }

        console.log("Token ditemukan, Menghubungkan ke WS...");
        ws.current = new WebSocket(WS_ENDPOINT + `?token=${token}`);

        ws.current.onopen = () => {
          console.log("✅ WebSocket connected");
          console.log("Token digunakan:", token)
        };

        ws.current.onmessage = (event) => {
          try{
            const msg = JSON.parse(event.data);
            console.log("📥 Pesan diterima:", msg);

            if (msg.token) {
              setLastText((prev) => prev + msg.token);
              if (msg.token.trim()) speak(msg.token);
            }

            if (msg.event === 'end') {
              console.log("🛑 Percakapan selesai");
              setWaitingResponse(false);
              setMicOn(true);
            }

            if (msg.error) {
              console.error("❗ Error dari server:", msg.error);
              Alert.alert("Error dari server", msg.error);
              setWaitingResponse(false);
            }
          } catch(e) {
            console.warn("⚠️ Gagal parsing pesan WS:", e);
          }
        };

        ws.current.onerror = (err: any) => {
          console.error("❌ WebSocket error:", err.message || err);
        };

        ws.current.onclose = (e) => {
          console.log(`❌ WebSocket closed (code: ${e.code}, reason: ${e.reason})`);
        };
      } catch (err) {
        console.error("❌ Gagal inisialisasi WebSocket:", err);
      }
    };

    connectWS();

    return () => {
      ws.current?.close();
    }

  }, []);

  // 🎤 Kamera + Mic + TTS
  const init = useCallback(async () => {
    const ok = await ensureAllPermissions();
    setPermitted(ok);
    await initTTS('id-ID');
    if (!ok) Alert.alert('Izin dibutuhkan', 'Aktifkan izin kamera dan mikrofon.');
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Smart Assistant (Realtime Streaming)</Text>

        <CameraStream ref={camRef} />

        <View style={styles.row}>
          <Text style={[styles.badge, { backgroundColor: micOn ? '#dff7df' : '#ffecec' }]}>
            Mic: {micOn ? 'ON (streaming)' : 'OFF'}
          </Text>
        </View>

        <View style={styles.row}>
          <Button title={micOn ? 'Matikan Mic' : 'Nyalakan Mic'} onPress={() => setMicOn((v) => !v)} />
          <View style={{ width: 12 }} />
          <Button
            title="Ambil Foto Sekarang"
            onPress={async () => {
              if (!camRef.current?.isReady()) {
                Alert.alert("Kamera belum siap", "Tunggu kamera aktif dulu.");
                return;
              }
              const snap = await camRef.current.takeSnapshot();
              setLastPhoto(snap ?? null);
            }}
          />
        </View>

        {sending && (
          <View style={styles.row}>
            <ActivityIndicator />
            <Text style={{ marginLeft: 8 }}>Mengirim ke backend...</Text>
          </View>
        )}

        {waitingResponse && (
          <View style={styles.row}>
            <ActivityIndicator color="blue"/>
            <Text style={{ marginLeft: 8 }}>Menunggu respons...</Text>
          </View>
        )}

        <View style={styles.previewRow}>
          {lastPhoto ? (
            <Image source={{ uri: lastPhoto }} style={styles.preview} />
          ) : (
            <View style={styles.placeholder}><Text>Belum ada snapshot</Text></View>
          )}
        </View>

        {!!lastText && (
          <View style={styles.responseBox}>
            <Text style={styles.responseLabel}>Respons (streaming):</Text>
            <Text>{lastText}</Text>
          </View>
        )}

        {lastLocation && (
          <View style={styles.responseBox}>
            <Text style={styles.responseLabel}>Lokasi Terakhir:</Text>
            <Text>Lat: {lastLocation.latitude}, Lon: {lastLocation.longitude}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#eee', fontSize: 12 },
  previewRow: { marginTop: 14, alignItems: 'center' },
  preview: { width: 240, height: 240, borderRadius: 8, resizeMode: 'cover' },
  placeholder: { width: 240, height: 240, borderRadius: 8, backgroundColor: '#f2f2f2', alignItems: 'center', justifyContent: 'center' },
  responseBox: { marginTop: 16, padding: 12, backgroundColor: '#f7f7f7', borderRadius: 8 },
  responseLabel: { fontWeight: '700', marginBottom: 6 },
});
