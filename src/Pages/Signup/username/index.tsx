import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Button, RadialGradientBackground } from '../../../components'

const UsernameSignUp = ({navigation}) => {
  return (
    <RadialGradientBackground>
      <Text>UsernameSignUp</Text>
      <Button onPress={() => navigation.navigate('PasswordSignUp')} label="Lanjut"/>
    </RadialGradientBackground>
  )
}

export default UsernameSignUp

const styles = StyleSheet.create({})