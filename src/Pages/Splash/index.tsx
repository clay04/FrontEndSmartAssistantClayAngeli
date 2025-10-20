import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Button, Gap, RadialGradientBackground } from '../../components'

const Splash = ({navigation} : {navigation : any}) => {
  return (
      <RadialGradientBackground>
        <View style={styles.container}>
          <Gap height={100}/>
          <Text style={styles.label}>Selamat Datang</Text>
          <Gap height={35}/>
          <View>
            <Text style={styles.label2}>Di Smart</Text>
            <Text style={styles.label2}>Assistant Bagi</Text>
            <Text style={styles.label2}>Penyandang</Text>
            <Text style={styles.label2}>Tunanetra</Text>
          </View>
          <Gap height={80}/>
          <View>
            <Text style={styles.label3}>Silahkan Tekan lanjut untuk melanjutkan</Text>
          </View>
          <Gap height={18}/>

          <Button 
            onPress={() => navigation.navigate('FirstNameSignUp')} 
            label="Lanjut" 
            backgroundColor="#7A45FF" 
            width={68} 
            borderRadius={10}
            fontFamily="Onest-Bold"
          />

          <Gap height={100}/>
          <Button onPress={() => navigation.navigate('UsernameLogin')} label="Login jika sudah memiliki akun"/>  
        </View>
      </RadialGradientBackground>
  )
}

export default Splash

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 26,
    fontFamily: 'Onest-Bold',
    marginBottom: 24,
    color: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label2: {
    fontSize: 30,
    fontFamily: 'Onest-Bold',
    color: '#fff',
  },
  label3: {
    fontSize: 16,
    fontFamily: 'Onest-Regular',
    color: '#fff',}
})