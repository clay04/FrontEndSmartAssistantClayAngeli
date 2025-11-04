import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, Image, StyleSheet, Text, View, ScrollView } from 'react-native';
import CameraStream, { CameraStreamHandle } from '../../components/CameraStream';
import { ensureAllPermissions } from '../../utils/permission';
import { initTTS, speak } from '../../utils/tts';
import { useMicUtterance } from '../../hog/useMicUtterence';
import { getCurrentLocation } from '../../utils/Location';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RadialGradientBackground } from '../../components';

const WS_ENDPOINT = 'ws://192.168.110.196:5000/voice/ws'; // WebSocket backend

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
    console.warn('⚠️ Gagal resize image, pakai original:', e);
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
  useMicUtterance({
    enabled: micOn && permitted,
    onUtterance: async (audioUri, base64) => {
      if (!camRef.current?.isReady()) return;

      try {
        const photoUri = await camRef.current.takePicture();
        const compressed = await compressImage(photoUri);
        const base64Image = await fileToBase64(compressed);

        const payload = JSON.stringify({
          type: 'voice',
          audio: base64,
          image: base64Image,
          location: lastLocation,
        });

        ws.current?.send(payload);
        setLastPhoto(photoUri);
        setWaitingResponse(true);
      } catch (e) {
        console.warn('🎤 Gagal kirim data:', e);
      }
    },
  });

  // 🌍 ambil lokasi
  const loadLocation = useCallback(async () => {
    const loc = await getCurrentLocation();
    setLastLocation(loc);
  }, []);

  // 🚀 init permission + TTS + WS
  useEffect(() => {
    (async () => {
      const ok = await ensureAllPermissions();
      setPermitted(ok);
      await initTTS();
      await loadLocation();

      ws.current = new WebSocket(WS_ENDPOINT);
      ws.current.onopen = () => console.log('🌐 WS Connected');
      ws.current.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data?.text) {
            setLastText(data.text);
            speak(data.text);
          }
        } catch (e) {
          console.warn('WS parse error:', e);
        }
        setWaitingResponse(false);
      };
      ws.current.onerror = (e) => console.error('WS error:', e);
      ws.current.onclose = () => console.log('🔌 WS Closed');
    })();

    return () => ws.current?.close();
  }, [loadLocation]);

  return (
    <RadialGradientBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Smart Assistant</Text>

        {/* Kamera */}
        <View style={styles.cameraBox}>
          {permitted ? (
            <CameraStream ref={camRef} />
          ) : (
            <View style={styles.permissionBox}>
              <Text style={{ color: '#ccc' }}>Menunggu izin kamera...</Text>
            </View>
          )}
        </View>

        {/* Loading, hasil foto, dan teks respon */}
        {waitingResponse && <ActivityIndicator color="#fff" size="small" />}
        {lastPhoto && <Image source={{ uri: lastPhoto }} style={styles.photo} />}
        {lastText ? <Text style={styles.response}>{lastText}</Text> : null}

        {/* Tombol Mic */}
        <View style={styles.buttonWrapper}>
          <Button
            title={micOn ? 'Matikan Mic' : 'Nyalakan Mic'}
            onPress={() => setMicOn(!micOn)}
            color={micOn ? '#b43aff' : '#4e9bff'}
          />
        </View>

        <Text style={styles.footer}>v1.0 — WebSocket: {WS_ENDPOINT}</Text>
      </ScrollView>
    </RadialGradientBackground>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 15,
  },
  cameraBox: {
    width: 300,
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1.5,
    borderColor: '#a58ad1',
    marginBottom: 15,
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginVertical: 10,
  },
  response: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#fff',
  },
  buttonWrapper: {
    marginVertical: 10,
  },
  footer: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 15,
  },
});
