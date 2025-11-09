import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import CameraStream, { CameraStreamHandle } from '../../components/CameraStream';
import { ensureAllPermissions } from '../../utils/permission';
import { initTTS, speak} from '../../utils/tts';

import { getCurrentLocation } from '../../utils/Location';
import { ttsState } from '../../utils/tts';
import { initSocket, getSocket } from '../../socket';

import Ionicons from 'react-native-vector-icons/Ionicons';

import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSpeechToText } from '../../hog/useSpeechToText';
import Tts from 'react-native-tts';
import { Gap, RadialGradientBackground } from '../../components';

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

const Home: React.FC = ({navigation}: {navigation: any}) => {
  const camRef = useRef<CameraStreamHandle>(null);
  const socket = useRef<any>(null);

  const [permitted, setPermitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [waitingResponse, setWaitingResponse] = useState(false);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const [lastText, setLastText] = useState<string>('');
  const [micOn, setMicOn] = useState<boolean>(true);
  const [manualMicOff, setManualMicOff] = useState(false);
  const [lastLocation, setLastLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const [socketReady, setSocketReady] = useState(false);
  const socketRef = useRef<any>(null);

  const [showMenu, setShowMenu] = useState(false);
  const [greeting, setGreeting] = useState('');

  const endStreamTimer = useRef<NodeJS.Timeout | null>(null);

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

  useSpeechToText({
    active: micOn && permitted && socketReady && !waitingResponse,
    onResult: onSpeechResult,
  });

  // 📡 Init Socket.IO client
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const setupSocket = async () => {
      const s = await initSocket(() => {
        console.log("⚙️ Socket siap digunakan");
        setSocketReady(true);
      });

      socketRef.current = s;

      //let pendingSpeech = "";
      s.on("response_token", (data) => {
        console.log("📥 Dapat response:", data);

        if (endStreamTimer.current) { clearTimeout(endStreamTimer.current); }

        Tts.stop()
        speak(data.token)
        setLastText((prev) => prev + data.token);

        endStreamTimer.current = setTimeout(() => {
          console.log("⏰ Stream END timeout! Memaksa sesi selesai.");
          setWaitingResponse(false);
        }, 3000); // 3 detik
      });

      //s.on("ack_location", (data) => {
        //console.log("📍 Lokasi berhasil diperbarui:", data);
      //});

      //s.on("error", (data) => {
        //console.log("💥 Error dari server:", data.error);
        //Tts.stop()
        //Tts.speak(data.error)
        //setLastText((prev) => prev + data.error);
      //});

      s.on("end", () => {

        if (endStreamTimer.current) { clearTimeout(endStreamTimer.current); }

        console.log("Sesi selesai");
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
      }, 20000);
    };

    setupSocket();

    return () => {
      clearInterval(interval);
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
            navigation.navigate('UsernameLogin')
          }
        }
      ]
    );
  };

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setGreeting('Selamat Pagi');
      else if (hour >= 12 && hour < 17) setGreeting('Selamat Siang');
      else if (hour >= 17 && hour < 20) setGreeting('Selamat Sore');
      else setGreeting('Selamat Malam');
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60 * 1000); // update tiap menit

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const sub = ttsState.addListener('change', (busy) => {
      console.log("Busy", busy);
      if (busy) {
        setTimeout(() => setMicOn(false), 100);
        console.log('🔇 [Home] TTS mulai bicara → matikan mic');
        if (micOn) setMicOn(false);
      } else {
        console.log('🎙️ [Home] TTS selesai bicara → nyalakan mic kembali setelah delay');
        setTimeout(() => {
          if (!manualMicOff) { // hanya nyalakan lagi kalau user tidak matikan manual
            setMicOn(true);
          } else {
            console.log('🙅‍♀️ Mic tetap off karena dimatikan manual');
          }
        }, 2500);
      }
    });

    return () => sub.remove();
  }, [micOn, manualMicOff]);

  return (
    <RadialGradientBackground>
      <Gap height={15}/>
      <ScrollView>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{greeting}</Text>
            <Text style={styles.user}>Pengguna</Text>
          </View>
          <TouchableOpacity onPress={() => setShowMenu(!showMenu)} >
            <Ionicons 
              name={'menu'}
              size={30}
              color={'#fff'}
            />
          </TouchableOpacity>
        </View>

        {showMenu && (
          <View style={styles.menuBar}>
            <Button title="Logout" color="#c0392b" onPress={handleLogout} />
          </View>
        )}

        <CameraStream ref={camRef} />

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

        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.micButton,
              { backgroundColor: micOn ? '#ffffff13' : '#00000016' },
            ]}
            onPress={() => setMicOn(v => {
                const newState = !v;
                setManualMicOff(!newState);
                return newState;
              }
            )}
          >
            <Ionicons
              name={micOn ? 'mic' : 'mic-off'}
              size={55}
              color={micOn ? '#0f5132' : '#a33'}
            />
          </TouchableOpacity>
        </View>

      </ScrollView>

    </RadialGradientBackground>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 20, marginBottom: 5, color:'#ffffff', fontFamily: 'Onest-Bold' },
  user: { fontSize: 18, marginBottom: 12, color:'#ffffff', fontFamily: 'Onest-Medium' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 30, justifyContent:'center' },
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
    backgroundColor: '#f4f4f417',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#dddddd3e',
  },

  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

});
