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
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('📍 Lokasi saat ini:', latitude, longitude);
          resolve({ latitude, longitude });
        },
        (error) => {
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
