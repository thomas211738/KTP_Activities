
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, Button, SafeAreaView, Image, TouchableOpacity} from 'react-native';


//HOME SCREEN
const HomeScreen = ({navigation}) => {
  return (
    <SafeAreaView style = {home.container}>
    <View style = {home.container}>
      <Image source={require('../../img/ktplogopng.png')} style={home.logo} />
      <Text style={home.text}>Ready to join Boston University's premier professional technology fraternity?</Text>
      <StatusBar style="auto" />
    </View>
    <View style = {home.Button}>
    <Button 
        title="Sign Up"
        color="black"
        onPress = {() =>
          navigation.navigate('Signup')
        }
      />
    </View>
    <View style={{ flexDirection: 'row', margin: 5}}>
    <Text style={{color: 'white'}}>Already have an account? </Text>
    <TouchableOpacity  onPress={() => navigation.navigate('Login')}>
        <Text style={home.loginButton}>Log In</Text>
    </TouchableOpacity>
    </View>
    </SafeAreaView>
    
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

export default HomeScreen