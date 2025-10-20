import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Button, RadialGradientBackground, TextInputComponent as Input } from '../../../components'
import { useRegister } from '../../../Context/RegisterContext';

const UsernameSignUp = ({navigation}) => {

  const {setField, data} = useRegister();
  const [username, setUsername] = React.useState(data.username || "");

  const handleNext = () => {
    setField('username', username);
    navigation.navigate('PasswordSignUp');
  }

  return (
    <RadialGradientBackground>
      <Text>UsernameSignUp</Text>
      <Input 
        label="Username"
        placeholder="Masukkan username"
        value={username}
        onChangeText={setUsername}
      />
      <Button onPress={handleNext} label="Lanjut"/>
    </RadialGradientBackground>
  )
}

export default UsernameSignUp

const styles = StyleSheet.create({})