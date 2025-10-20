import React from 'react'
import { Text } from 'react-native'
import { Button, RadialGradientBackground } from '../../components'

const Splash = ({navigation} : {navigation : any}) => {
  return (
      <RadialGradientBackground>
        <Text>Intro</Text>
        <Button onPress={() => navigation.navigate('FirstNameSignUp')} label="Registrasi" />
        <Button onPress={() => navigation.navigate('UsernameLogin')} label="Login"/>
      </RadialGradientBackground>
  )
}

export default Splash