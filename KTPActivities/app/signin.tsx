import { View, Text, SafeAreaView, Image, StatusBar, Button, StyleSheet, Platform, ScrollView} from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native';
import GoogleButton from './components/googleButton';
import { RootSiblingParent } from 'react-native-root-siblings';
import AndroidAuth from './components/androidAuth';
import Animated, {FadeIn} from 'react-native-reanimated';

export default function SignInScreen({ promptAsync }) {
    const mynavigation = useNavigation();
    
    return (
        <RootSiblingParent>
            <SafeAreaView style = {home.container}>
            {/* <Animated.ScrollView entering={FadeIn}> */}
              <View style = {home.container}>
              <Image source={require('../img/ktplogopng.png')} style={home.logo} />
              <Text style={home.text}>Ready to join Boston University's premier professional technology fraternity?</Text>
              </View>
            
                {Platform.OS === "ios" ? (
                  <GoogleButton promptAsync={() => promptAsync()} />
                ) : (
                  <AndroidAuth/>
                )}

            {/* </Animated.ScrollView> */}
            </SafeAreaView>

        </RootSiblingParent>
  );
}

const home = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#134b91',
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

