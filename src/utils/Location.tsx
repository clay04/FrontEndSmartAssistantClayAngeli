import axios from "axios";
import React from "react";
import { Platform, PermissionsAndroid } from "react-native";
import Geolocation from "react-native-geolocation-service";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export async function getCurrentLocation(): Promise<Coordinates | null> {
  return new Promise(async (resolve, reject) => {
    try {
      // Pastikan izin lokasi sudah granted
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (!granted) {
          reject(new Error('Izin lokasi belum diberikan'));
          return;
        }
      }

      Geolocation.getCurrentPosition(
        async (position) => {
            try{
                const { latitude, longitude } = position.coords;
                console.log('📍 Lokasi saat ini:', latitude, longitude);

                await axios.post('http://192.168.10.131:5000/location/status', { latitude, longitude});
                resolve({ latitude, longitude });
            } catch (error) {
                reject(error);
            }
        },
        error => {
          console.warn('❌ Gagal mendapatkan lokasi:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    } catch (err) {
      reject(err);
    }
  });
}