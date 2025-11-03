import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, StyleSheet, Text, View, ScrollView } from 'react-native';
import CameraStream, { CameraStreamHandle } from '../../components/CameraStream';
import { ensureAllPermissions } from '../../utils/permission';
import { initTTS, speak } from '../../utils/tts';
import { getCurrentLocation } from '../../utils/Location';
import { initSocket, getSocket } from '../../socket';

import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSpeechToText } from '../../hog/useSpeechToText';
import Tts from 'react-native-tts';

// 🔧 Helper: file → base64
async function fileToBase64(uri: string): Promise<string> {
  const path = uri.replace('file://', '');
  return RNFS.readFile(path, 'base64');
}

// 🔧 Helper: kompres foto biar nggak kegedean
async function compressImage(uri: string): Promise<string> {
  try {
    const resized = await ImageResizer.createResizedImage(uri, 512, 512, 'JPEG', 80);
    return resized.uri;
  } catch (e) {
    console.warn("⚠️ Gagal resize image:", e);
    return uri;
  }
}

const Home: React.FC = () => {
  const camRef = useRef<CameraStreamHandle>(null);
  const socket = useRef<any>(null);

  const [permitted, setPermitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [waitingResponse, setWaitingResponse] = useState(false);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const [lastText, setLastText] = useState<string>('');
  const [micOn, setMicOn] = useState<boolean>(true);
  const [lastLocation, setLastLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const [socketReady, setSocketReady] = useState(false);
  const socketRef = useRef<any>(null);

  // 🎤 Kirim audio + foto ke backend via Socket.IO
  const onSpeechResult = useCallback(async (speechText: string) => {
    console.log('🗣️ Hasil STT:', speechText);

    try {
      const s = socketRef.current;
      if (!socketRef.current || !socketRef.current.connected) {
        console.warn('❌ Socket.IO belum siap atau belum terkoneksi');
        return;
      }

      // Kirim text ke server
      s.emit("user_message", { message: speechText });

      // 📸 Ambil snapshot
      let imageB64: string | null = null;
      if (camRef.current?.isReady()) {
        const snap = await camRef.current.takeSnapshot();
        setLastPhoto(snap ?? null);

        if (snap) {
          const resizedUri = await compressImage(snap);
          imageB64 = await fileToBase64(resizedUri);
        }
      }

      // 📍 Ambil lokasi
      let coords = null;
      try {
        coords = await getCurrentLocation();
        setLastLocation(coords);
        console.log("📍 Lokasi:", coords?.latitude, coords?.longitude);
      } catch (e) {
        console.warn('⚠️ Gagal ambil lokasi:', e);
      }

      // 🔑 Ambil token akses
      const token = await AsyncStorage.getItem('access_token');

      // 📤 Buat payload
      const payload = {
        text: speechText,
        image: imageB64,
        latitude: coords?.latitude || lastLocation?.latitude || null,
        longitude: coords?.longitude || lastLocation?.longitude || null,
        access_token: token,
      };

      socketRef.current.emit('voice_message', payload);
      console.log('📦 Mengirim payload:', payload);

      setSending(true);
      setWaitingResponse(true);
    } catch (err) {
      console.error('❌ Gagal kirim data:', err);
    } finally {
      setSending(false);
    }
  }, [lastLocation]);

  // 🎙️ Inisialisasi Speech-to-Text
  useSpeechToText({
    active: micOn && permitted && socketReady && !waitingResponse,
    onResult: onSpeechResult,
  });

  // 📡 Init Socket.IO client
  useEffect(() => {
    const setupSocket = async () => {
      const s = await initSocket(() => {
        console.log("⚙️ Socket siap digunakan");
        setSocketReady(true);
      });

      socketRef.current = s;

      s.on("response_token", (data) => {
        console.log("📥 Dapat response:", data);
        Tts.stop()
        Tts.speak(data.token)
        setLastText((prev) => prev + data.token);
      });

      s.on("error", (data) => {
        console.log("💥 Error dari server:", data.error);
        setLastText((prev) => prev + data.error);
      });

      s.on("end", () => {
        console.log("Sesi selesai");
        setWaitingResponse(false);
      });
    };

    setupSocket();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // 🎤 Inisialisasi Kamera + Mic + TTS
  const init = useCallback(async () => {
    const ok = await ensureAllPermissions();
    setPermitted(ok);
    await initTTS('id-ID');
    if (!ok) Alert.alert('Izin dibutuhkan', 'Aktifkan izin kamera & mikrofon.');
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Smart Assistant (Socket.IO Streaming)</Text>

        <CameraStream ref={camRef} />

        <View style={styles.row}>
          <Text style={[styles.badge, { backgroundColor: micOn ? '#dff7df' : '#ffecec' }]}>
            Mic: {micOn ? 'ON (streaming)' : 'OFF'}
          </Text>
        </View>

        <View style={styles.row}>
          <Button title={micOn ? 'Matikan Mic' : 'Nyalakan Mic'} onPress={() => setMicOn(v => !v)} />
          <View style={{ width: 12 }} />
          <Button
            title="Ambil Foto Sekarang"
            onPress={async () => {
              if (!camRef.current?.isReady()) {
                Alert.alert('Kamera belum siap', 'Tunggu kamera aktif dulu.');
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
            <Text style={{ marginLeft: 8 }}>Mengirim ke server...</Text>
          </View>
        )}

        {waitingResponse && (
          <View style={styles.row}>
            <ActivityIndicator color="blue" />
            <Text style={{ marginLeft: 8 }}>Menunggu respons AI...</Text>
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
