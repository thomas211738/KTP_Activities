import { View, Text, SafeAreaView, Image, StatusBar, Button, StyleSheet, Platform, ScrollView} from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native';
import GoogleButton from './components/googleButton';
import { RootSiblingParent } from 'react-native-root-siblings';
import AndroidAuth from './components/androidAuth';
import Animated, {FadeIn} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';


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
      backgroundColor: 'white',
      alignItems: 'center',
      justifyContent: 'center',
    },
    home : {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
    },
    logo: {
      width: 200,
      height: 200,
    },
    text: {
      marginTop: -20,
      fontWeight: 'bold',
      padding: 12,
      paddingTop: 0,
      color: 'black',
      textAlign: 'center',
      fontSize: 15,
    },

  });

