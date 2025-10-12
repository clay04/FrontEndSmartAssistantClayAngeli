import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Button, RadialGradientBackground } from '../../../components'

const LastNameSignUp = ({navigation}) => {
  return (
    <RadialGradientBackground>
      <Text>LastNameSignUp</Text>
      <Button onPress={() => navigation.navigate('UsernameSignUp')} label="Lanjut"/>
    </RadialGradientBackground>
  )
}

export default LastNameSignUp

const styles = StyleSheet.create({})