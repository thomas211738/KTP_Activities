import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, SafeAreaView, Image, TouchableOpacity} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const App = () => {
  return(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
        name="Home"
        component={HomeScreen}
        options={{title: 'Welcome'}}
        />
        <Stack.Screen name="Login" component={LoginPage}/>
        <Stack.Screen name="Signup" component={SignupPage}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const HomeScreen = ({navigation}) => {
  return (
    <SafeAreaView style = {home.container}>
    <View style = {home.container}>
      <Image source={require('./img/ktplogopng.png')} style={home.logo} />
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

const LoginPage = ({navigation}) => {
  return (
    <View style={login.container}>
      <Text>Welcome to the Login page!</Text>
    </View>
  );
}

const SignupPage = ({navigation}) => {
  return (
    <View style={signup.container}>
      <Text>Welcome to the Signup page!</Text>
    </View>
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
    backgroundColor: '#fff',
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

const login = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const signup = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App
