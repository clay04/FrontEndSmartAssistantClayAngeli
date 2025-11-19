import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { 
    FirstNameSignUp, 
    Home, 
    LastNameSignUp, 
    PasswordLogin, 
    PasswordSignUp, 
    Splash, 
    UsernameLogin, 
    UsernameSignUp
 } from "../Pages";
import AuthLoading from "../components/molecules/AuthLoading";

const Stack = createNativeStackNavigator();

const Router = () => {
    return (
        <Stack.Navigator
            screenOptions={{headerShown: false}}
            initialRouteName="AuthLoading"
        >
            <Stack.Screen 
                name="AuthLoading"
                component={AuthLoading}
            />

            <Stack.Screen 
                name="Splash"
                component={Splash}
                options={{ headerShown: false}}
            />

            <Stack.Screen 
                name="FirstNameSignUp"
                component={FirstNameSignUp}
                options={{ headerShown: false}}
            />

            <Stack.Screen 
                name="LastNameSignUp"
                component={LastNameSignUp}
                options={{ headerShown: false}}
            />

            <Stack.Screen 
                name="UsernameSignUp"
                component={UsernameSignUp}
                options={{ headerShown: false}}
            />

            <Stack.Screen 
                name="PasswordSignUp"
                component={PasswordSignUp}
                options={{ headerShown: false}}
            />

            <Stack.Screen 
                name="UsernameLogin"
                component={UsernameLogin}
                options={{ headerShown: false}}
            />

            <Stack.Screen 
                name="PasswordLogin"
                component={PasswordLogin}
                options={{ headerShown: false}}
            />

            <Stack.Screen 
                name="Home"
                component={Home}
                options={{ headerShown: false}}
            />

            
        </Stack.Navigator>
    )
}

export default Router;