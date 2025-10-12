import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Button, RadialGradientBackground } from '../../../components'

const FirstNameSignUp = ({navigation}) => {
  return (
    <RadialGradientBackground>
      <Text>FirstNameSignUp</Text>
      <Button onPress={() => navigation.navigate('LastNameSignUp')} label="Lanjut"/>
    </RadialGradientBackground>
  )
}

export default FirstNameSignUp

const styles = StyleSheet.create({})