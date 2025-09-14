import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { Camera } from 'react-native-vision-camera';

export async function ensureAllPermissions(): Promise<boolean> {
  try {
    // CAMERA (Vision Camera)
    const camStatus = await Camera.getCameraPermissionStatus();
    if (camStatus !== 'granted') {
      const req = await Camera.requestCameraPermission();
      if (req !== 'granted') {
        Alert.alert('Izin Kamera', 'Aplikasi perlu akses kamera.');
        return false;
      }
    }

    // MICROPHONE
    const mic = await requestMicPerm();
    if (!mic) {
      Alert.alert('Izin Mikrofon', 'Aplikasi perlu akses mikrofon.');
      return false;
    }

    // STORAGE pada Android < 33
    if (Platform.OS === 'android' && Platform.Version < 33) {
      const storageGranted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);
      const ok =
        storageGranted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
        storageGranted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED;
      if (!ok) {
        console.warn('Storage permission not fully granted.');
      }
    }

    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Permission Lokasi",
          message: "Aplikasi membutuhkan akses lokasi untuk Contextual Assistant",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return true;
  } catch (e) {
    console.warn('Permission error', e);
    return false;
  }
}

export async function requestMicPerm(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    return res === PermissionsAndroid.RESULTS.GRANTED;
  } else {
    // iOS: pastikan Info.plist ada NSMicrophoneUsageDescription
    return true;
  }
}
