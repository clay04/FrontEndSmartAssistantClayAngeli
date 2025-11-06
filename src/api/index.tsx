import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_BASE_URL = "http://10.121.122.131:5000/"; // Replace with your API base URL

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