import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { RadialGradientBackground } from '../../../components';
import { useRegister } from '../../../Context/RegisterContext';

const FirstNameSignUp = ({ navigation }) => {
  const { setField, data } = useRegister();
  const [firstName, setFirstName] = React.useState(data.first_name || '');

  const handleNext = () => {
    if (!firstName.trim()) {
      alert('Silakan isi nama depan terlebih dahulu.');
      return;
    }
    setField('first_name', firstName);
    navigation.navigate('LastNameSignUp');
  };

  return (
    <RadialGradientBackground>
      <View style={styles.container}>
        {/* Judul halaman */}
        <Text style={styles.smallTitle}>Daftar Akun</Text>
        <Text style={styles.mainTitle}>Silahkan Masukan{'\n'}Nama depan anda</Text>

        {/* Input field */}
        <TextInput
          style={styles.input}
          placeholder="Nama depan"
          placeholderTextColor="#b9aee5"
          value={firstName}
          onChangeText={setFirstName}
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

export default FirstNameSignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 30,
    paddingBottom: 240, // jarak dari bawah sesuai layout kamu
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