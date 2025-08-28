import { View, Text, SafeAreaView, Image, StatusBar, Button, StyleSheet, Platform, ScrollView} from 'react-native'
import React from 'react'
import GoogleButton from './components/googleButton';
import { RootSiblingParent } from 'react-native-root-siblings';
import AndroidAuth from './components/androidAuth';


export default function SignInScreen({ promptAsync }) {
    
    return (
        <RootSiblingParent>
            <SafeAreaView style = {home.container}>
              {/* <Animated.ScrollView entering={FadeIn}> */}
              <View style = {home.container}>
              <Image source={require('../img/ktplogopng.png')} style={home.logo} />
                <Text style={home.text}>
                Ready to join <Text style={{fontWeight: 'bold'}}>Boston University</Text>'s premier <Text style={{fontWeight: 'bold'}}>Professional Technology Fraternity</Text>?
                </Text>

              </View>

            
                  <View style={{bottom: 40}}>
                  {Platform.OS === "ios" ? (
                    <GoogleButton promptAsync={() => promptAsync()} />
                  ) : (
                    <AndroidAuth/>
                  )}
                  </View>

              
              
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
      padding: 12,
      paddingTop: 0,
      color: 'black',
      textAlign: 'center',
      fontSize: 16,
    },

  });

