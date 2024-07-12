import { View, Text, SafeAreaView, Image, StatusBar, Button, StyleSheet} from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native';
import GoogleButton from './components/googleButton';
import { RootSiblingParent } from 'react-native-root-siblings';




export default function SignInScreen({ promptAsync }) {
    const mynavigation = useNavigation();
    
    return (
        <RootSiblingParent>
            <SafeAreaView style = {home.container}>
            <View style = {home.container}>
            <Image source={require('../img/ktplogopng.png')} style={home.logo} />
            <Text style={home.text}>Ready to join Boston University's premier professional technology fraternity?</Text>
            <StatusBar style="auto" />
            </View>
            {/* <View style = {home.Button}>
            <Link href="/signup"> Signup </Link>
            </View>
            <View style={{ flexDirection: 'row', margin: 5}}>
            <Button title="Login" onPress={() => mynavigation.navigate('(tabs)')} />
            </View> */}

            <GoogleButton promptAsync={() => promptAsync()} />
            </SafeAreaView>
        </RootSiblingParent>
  );
}

const home = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#5E89B2',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: {
      width: 200,
      height: 200,
    },
    text: {
      fontWeight: 'bold',
      padding: 12,
      borderRadius: 8, 
      color: '#fff',
      textAlign: 'center',
    },
    Button: {
      marginTop: 12,
      borderRadius: 8,
      width: 300,
      padding: 6,
    },
    loginButton: {
      fontWeight: 'bold',
      textDecorationLine: 'underline',
      color: '#fff',
    }
  });

