import { StyleSheet, Text } from 'react-native'
import React, { useState } from 'react'
import { RadialGradientBackground, Button, TextInputComponent as Input} from '../../../components'
import { useLogin } from '../../../Context/LoginContext';

const UsernameLogin = ({navigation}: {navigation: any}) => {

  const {setField, data} = useLogin();
  const [username, setUsername] = useState(data.username || "");

  const handleNext = () => {
    setField('username', username);
    navigation.navigate('PasswordLogin');
  }

  return (
    <RadialGradientBackground>
        <Text>UsernameLogin</Text>
        <Input 
          label='username'
          placeholder='Masukkan username'
          value={username}
          onChangeText={setUsername}
        />
        <Button onPress={handleNext} label='Lanjut'/>
    </RadialGradientBackground>
  )
}

export default UsernameLogin

const styles = StyleSheet.create({})