import { Alert, StyleSheet, Text } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react'
import { Button, RadialGradientBackground, TextInputComponent as Input } from '../../../components'
import { useRegister } from '../../../Context/RegisterContext';
import api from '../../../api';

const PasswordSignUp = ({navigation}) => {

  const {setField, data} = useRegister();
  const [password, setPassword] = React.useState(data.password || "");

  const handleRegister = async () => {
    try {
      setField('password', password);
      const payload = {...data, password}

      const res = await api.post('/auth/register', payload);
      const token = res.data.access_token;
      const refresh_token = res.data.refresh_token;

      await AsyncStorage.setItem("access_token", token);
      await AsyncStorage.setItem("refresh_token", refresh_token);

      Alert.alert('Success', 'Registration successful')
      
      navigation.reset({index: 0, routes: [{name: 'Home'}]});

    } catch (err) {
      console.log(err);
      Alert.alert('Error', err.response?.data.error || 'Registration failed');
    } 
  }

  return (
    <RadialGradientBackground>
      <Text>PasswordSignUp</Text>
      <Input 
        label="Password"
        placeholder="Masukkan password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button onPress={handleRegister} label="Selesai"/>
    </RadialGradientBackground>
  )
}

export default PasswordSignUp

const styles = StyleSheet.create({})