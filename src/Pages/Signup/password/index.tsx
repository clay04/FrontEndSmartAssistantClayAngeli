import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Button, RadialGradientBackground } from '../../../components'

const PasswordSignUp = ({navigation}) => {
  return (
    <RadialGradientBackground>
      <Text>PasswordSignUp</Text>
      <Button onPress={() => navigation.navigate('Home')} label="Selesai"/>
    </RadialGradientBackground>
  )
}

export default PasswordSignUp

const styles = StyleSheet.create({})