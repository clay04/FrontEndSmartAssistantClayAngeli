import { Alert, StyleSheet, Text } from 'react-native'
import React, { useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Button, RadialGradientBackground, TextInputComponent as Input } from '../../../components'
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

            Alert.alert('Success', 'Login successful')

            navigation.reset({index: 0, routes: [{name: 'Home'}]});
        } catch (err: any) {
            console.log(err);
            Alert.alert('Error', err.response?.data.error || 'Login failed');
        }
    }

  return (
    <RadialGradientBackground>
      <Text>PasswordLogin</Text>
      <Input 
        label='Password'
        placeholder='Masukkan password'
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button onPress={handleLogin} label='Selesai'
      />
    </RadialGradientBackground>
  )
}

export default PasswordLogin

const styles = StyleSheet.create({})