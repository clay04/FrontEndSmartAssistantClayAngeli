import { View, ActivityIndicator } from 'react-native'
import React, {useEffect, useState} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const AuthLoading = ({navigation}: {navigation: any}) => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLogin = async () => {
            const token = await AsyncStorage.getItem('access_token');

            if (token) {
                navigation.reset({
                    index: 0,
                    routes: [{name: 'Home'}],
                });
            } else {
                navigation.reset({
                    index: 0,
                    routes: [{name: 'Splash'}],
                })
            }
            setLoading(false);
        }
        checkLogin();
    }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#7C4DFF" />
    </View>
  )
}

export default AuthLoading;