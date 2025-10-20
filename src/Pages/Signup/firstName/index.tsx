import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Button, RadialGradientBackground, TextInputComponent as Input } from '../../../components'
import { useRegister } from '../../../Context/RegisterContext'

const FirstNameSignUp = ({navigation}) => {

  const {setField, data} = useRegister();
  const [firstName, setFirstName] = React.useState(data.first_name || "");

  const handleNext = () => {
    setField('first_name', firstName);
    navigation.navigate('LastNameSignUp');
  }

  return (
    <RadialGradientBackground>
      <Text>FirstNameSignUp</Text>
      <Input 
        label="Nama Depan"
        placeholder="Masukkan nama depan"
        value={firstName}
        onChangeText={setFirstName}
      />
      <Button onPress={handleNext} label="Lanjut"/>
    </RadialGradientBackground>
  )
}

export default FirstNameSignUp

const styles = StyleSheet.create({})