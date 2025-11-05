import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, StyleSheet, Text, View, ScrollView } from 'react-native';
import CameraStream, { CameraStreamHandle } from '../../components/CameraStream';
import { ensureAllPermissions } from '../../utils/permission';
import { initTTS, speak } from '../../utils/tts';
import { getCurrentLocation } from '../../utils/Location';
import { ttsState } from '../../utils/tts';
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

// 🎙️ Komponen terpisah agar STT tidak restart tiap re-render
const SpeechManager = React.memo(({ active, onResult }: { active: boolean; onResult: (text: string) => void }) => {
  useSpeechToText({ active, onResult });
  return null;
});


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

  const [showMenu, setShowMenu] = useState(false);

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

      // 🔑 Ambil token akses
      const token = await AsyncStorage.getItem('access_token');

      // 📤 Buat payload
      const payload = {
        text: speechText,
        image: imageB64,
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

  // 📡 Init Socket.IO client
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const setupSocket = async () => {
      const s = await initSocket(() => {
        console.log("⚙️ Socket siap digunakan");
        setSocketReady(true);
      });

      socketRef.current = s;

      let pendingSpeech = "";
      s.on("response_token", (data) => {
        if (data.token) {
          pendingSpeech += data.token;
          setLastText((prev) => prev + data.token);
        }
      });

      //s.on("ack_location", (data) => {
        //console.log("📍 Lokasi berhasil diperbarui:", data);
      //});

      //s.on("error", (data) => {
        //console.log("💥 Error dari server:", data.error);
        //setLastText((prev) => prev + data.error);
      //});

      s.on("end", async () => {
        console.log("🗣️ Semua token diterima, mulai TTS sekali saja");
        await Tts.stop();
        await speak(pendingSpeech);
        pendingSpeech = "";
        setWaitingResponse(false);
      });

      // mulai interval setelah socket siap
      interval = setInterval(async () => {
        try {
          if (!s || !s.connected) return;

          const coords = await getCurrentLocation();
          const token = await AsyncStorage.getItem('access_token');

          if (
            coords?.latitude &&
            coords?.longitude &&
            (!lastLocation ||
              Math.abs(coords.latitude - lastLocation.latitude) > 0.0001 ||
              Math.abs(coords.longitude - lastLocation.longitude) > 0.0001)
          ) {
            s.emit("update_location", {
              access_token: token,
              latitude: coords.latitude,
              longitude: coords.longitude,
            });
            console.log("📤 Update lokasi:", coords.latitude, coords.longitude);
            setLastLocation(coords);
          }
        } catch (err) {
          console.warn("⚠️ Gagal update lokasi:", err);
        }
      }, 10000);
    };

    setupSocket();

    return () => {
      clearInterval(interval);
      socketRef.current?.disconnect();
    };
  }, []);

  // 🎧 Sinkronkan mic dengan status TTS
  useEffect(() => {
    const sub = ttsState.addListener('change', (busy) => {
      if (busy) {
        console.log('🔇 [Home] TTS mulai bicara → matikan mic');
        setMicOn(false);
      } else {
        console.log('🎙️ [Home] TTS selesai bicara → nyalakan mic kembali setelah delay');
        setTimeout(() => {
          setMicOn(true);
        }, 1000); // buffer kecil, karena tts.tsx sudah kasih 3 detik
      }
    });

    return () => sub.remove();
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

  const handleLogout = async () => {
    Alert.alert(
      "Konfirmasi",
      "Yakin ingin logout?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem('access_token');
            setShowMenu(false);
            Alert.alert("Berhasil Logout", "Silakan login kembali.");
            // Di sini nanti bisa arahkan ke halaman login jika pakai navigation
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Smart Assistant (Socket.IO Streaming)</Text>

        <View style={styles.headerRow}>
          <Text style={styles.title}>Smart Assistant (Socket.IO Streaming)</Text>
          <Button title="☰" onPress={() => setShowMenu(!showMenu)} />
        </View>

        {showMenu && (
          <View style={styles.menuBar}>
            <Button title="Logout" color="#c0392b" onPress={handleLogout} />
          </View>
        )}

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

      <SpeechManager
        active={micOn && permitted && socketReady && !waitingResponse}
        onResult={onSpeechResult}
      />

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

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  menuBar: {
    backgroundColor: '#f4f4f4',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },

});
