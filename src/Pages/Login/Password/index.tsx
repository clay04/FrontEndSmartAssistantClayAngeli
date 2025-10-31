import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { RadialGradientBackground } from '../../../components';
import { useNavigation, useRoute } from '@react-navigation/native';

const PasswordLogin = () => {
  const [password, setPassword] = useState('');
  const navigation = useNavigation();
  const route = useRoute();
  const { username } = (route.params || {}) as { username?: string };

  const handleNext = () => {
    if (!password.trim()) {
      alert('Silakan isi password terlebih dahulu.');
      return;
    }

    // arahkan ke Home (atau screen lain sesuai flow)
    // kirim username & password sebagai params
    navigation.navigate('Home' as never, { username, password } as never);
  };

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
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Lanjut</Text>
          </TouchableOpacity>
        </View>
      </View>
    </RadialGradientBackground>
  );
};

export default PasswordLogin;

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