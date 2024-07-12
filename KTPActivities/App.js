import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();

import HomeScreen from './pages/signup/homeSignup';
import SignupPage from './pages/signup/signUp';
import InformationPage from './pages/events/events';
import Layout from './app/_layout'

const App = () => {
  return(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen}/>
        <Stack.Screen name="Login" component={Layout}/>
        <Stack.Screen name="Signup" component={SignupPage}/>
        <Stack.Screen name="Upcoming Events" component={InformationPage}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}


export default App


/*
NOTES:

- use react dom router for multiple different pages rather than navigation. Navigation allows for them to move backwards between pages. 

*/