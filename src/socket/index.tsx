import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";

const SOCKET_URL = "http://10.68.51.131:5000"; // Pastikan IP laptop kamu

let socket = null;

export const initSocket = async (onReady) => {
  // Kalau sudah konek, pakai saja
  if (socket && socket.connected) {
    console.log("⚙️ Socket sudah terhubung:", socket.id);
    onReady && onReady();
    return socket;
  }

  // Ambil token user
  const token = await AsyncStorage.getItem("access_token");

  // Buat koneksi baru
  socket = io(SOCKET_URL, {
    transports: ["websocket"],      // Gunakan WebSocket langsung
    reconnection: true,             // Aktifkan auto reconnect
    reconnectionDelay: 1000,        // Delay antar reconnect
    reconnectionAttempts: 10,       // Batas reconnect
    timeout: 20000,                 // Timeout koneksi
    query: { token },               // Kirim token (opsional)
  });

  // Event: konek
  socket.on("connect", () => {
    console.log("✅ Socket.IO connected:", socket.id);
    onReady && onReady();
  });

  // Event: disconnect
  socket.on("disconnect", (reason) => {
    console.warn("❌ Socket.IO disconnected:", reason);
  });

  // Event: gagal konek
  socket.on("connect_error", (error) => {
    console.error("🚨 Socket.IO connect error:", error.message);
  });

  // Event: reconnect attempt
  socket.on("reconnect_attempt", (attempt) => {
    console.log(`🔁 Mencoba reconnect ke server... (${attempt})`);
  });

  return socket;
};

export const getSocket = () => socket;
