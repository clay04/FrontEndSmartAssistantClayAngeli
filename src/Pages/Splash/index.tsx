import React from 'react'
import { Text, View } from 'react-native'
import { Button, RadialGradientBackground } from '../../components'

const Splash = ({navigation}) => {
  return (
      <RadialGradientBackground>
        <Text>Intro</Text>
        <Button onPress={() => navigation.navigate('FirstNameSignUp')} label="Lanjut">
        </Button>
      </RadialGradientBackground>
  )
}

export default Splash