import React from 'react'
import {NavigationContainer} from '@react-navigation/native';
import Router from './src/router';
import RegisterProvider from './src/Context/RegisterContext';
import LoginProvider from './src/Context/LoginContext';

const App = () => {
  return (
    <RegisterProvider>
      <LoginProvider>
        <NavigationContainer>
          <Router />
        </NavigationContainer>
      </LoginProvider>
    </RegisterProvider>
  )
}

export default App