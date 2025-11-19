import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { RadialGradientBackground } from '../../../components'
import { useLogin } from '../../../Context/LoginContext'
import api from '../../../api'

const PasswordLogin = ({navigation}: {navigation: any}) => {

    const {setField, data} = useLogin();
    const [password, setPassword] = useState(data.password || "");

    const handleLogin = async () => {
        try {
            setField('password', password);
            const payload = {...data, password}

            const res = await api.post('/auth/login', payload);
            const token = res.data.access_token;
            const refresh_token = res.data.refresh_token;

            await AsyncStorage.setItem("access_token", token);
            await AsyncStorage.setItem("refresh_token", refresh_token);
            await AsyncStorage.setItem("username", payload.username);

            Alert.alert('Success', 'Login successful')

            navigation.reset({index: 0, routes: [{name: 'Home'}]});
        } catch (err: any) {
            console.log(err);
            Alert.alert('Error', err.response?.data.error || 'Login failed');
        }
    }

  return (
     <RadialGradientBackground>
      <View style={styles.container}>
        <Text style={styles.smallTitle}>Login</Text>

        <Text style={styles.mainTitle}>
          Silahkan masukan{'\n'}Password anda
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#b9aee5"
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.subText}>Silakan tekan lanjut untuk melanjutkan</Text>

        <View style={styles.buttonWrapper}>
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Lanjut</Text>
          </TouchableOpacity>
        </View>
      </View>
    </RadialGradientBackground>
  )
}

export default PasswordLogin

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 30,
    paddingBottom: 240,
  },
  smallTitle: {
    color: '#E0D7F8',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: 40,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#a58ad1',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 15,
  },
  subText: {
    color: '#e6dbff',
    fontSize: 13,
    marginTop: 10,
    marginBottom: 10,
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'flex-end',
  },
  button: {
    backgroundColor: '#7C4DFF',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});