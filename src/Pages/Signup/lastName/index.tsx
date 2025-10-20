import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Button, RadialGradientBackground, TextInputComponent as Input } from '../../../components'
import { useRegister } from '../../../Context/RegisterContext';

const LastNameSignUp = ({navigation}) => {

  const {setField, data} = useRegister();
  const [lastName, setLastName] = React.useState(data.last_name || "");

  const handleNext = () => {
    setField('last_name', lastName);
    navigation.navigate('UsernameSignUp');
  }

  return (
    <RadialGradientBackground>
      <Text>LastNameSignUp</Text>
      <Input 
        label="Nama Belakang"
        placeholder="Masukkan nama belakang"
        value={lastName}
        onChangeText={setLastName}
        />
      <Button onPress={handleNext} label="Lanjut"/>
    </RadialGradientBackground>
  )
}

export default LastNameSignUp

const styles = StyleSheet.create({})