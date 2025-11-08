import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { RadialGradientBackground } from '../../../components';
import { useRegister } from '../../../Context/RegisterContext';

const LastNameSignUp = ({ navigation }) => {
  const { setField, data } = useRegister();
  const [lastName, setLastName] = React.useState(data.last_name || '');

  const handleNext = () => {
    if (!lastName.trim()) {
      alert('Silakan isi nama belakang terlebih dahulu.');
      return;
    }
    setField('last_name', lastName);
    navigation.navigate('UsernameSignUp');
  };

  return (
    <RadialGradientBackground>
      <View style={styles.container}>
        {/* Judul halaman */}
        <Text style={styles.smallTitle}>Daftar Akun</Text>
        <Text style={styles.mainTitle}>Silahkan Masukan{'\n'}Nama belakang anda</Text>

        {/* Input field */}
        <TextInput
          style={styles.input}
          placeholder="Nama belakang"
          placeholderTextColor="#b9aee5"
          value={lastName}
          onChangeText={setLastName}
        />

        {/* Petunjuk */}
        <Text style={styles.subText}>Silahkan Tekan lanjut untuk melanjutkan</Text>

        {/* Tombol Lanjut */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Lanjut</Text>
          </TouchableOpacity>
        </View>
      </View>
    </RadialGradientBackground>
  );
};

export default LastNameSignUp;

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