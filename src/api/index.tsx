import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

<<<<<<< HEAD
const API_BASE_URL = "http://192.168.1.35:5000"; // Replace with your API base URL
=======
const API_BASE_URL = "http://192.168.242.131:5000"; // Replace with your API base URL
>>>>>>> fd70eeb9ece659c34ce8f674716f6ca21ef7f566

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type" : "application/json",
    },
    
})

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});



export default api;