
import React from 'react';
import { StyleSheet, Text, View} from 'react-native';


//LOGIN PAGE
const LoginPage = ({navigation}) => {
    return (
      <View style={login.container}>
        <Text>Welcome to the Login page!</Text>
      </View>
    );
  }
  const login = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default LoginPage