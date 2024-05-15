import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button} from 'react-native';
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const HomeScreen = ({navigation}) => {
  return (
    <View style={styles.container}>
      <Text>This is the KTP App!</Text>
      <Button 
        title="Move to Login Page"
        onPress = {() =>
          navigation.navigate('Login')
        }
      />
      <StatusBar style="auto" />
    </View>
  );
}

const LoginPage = ({navigation}) => {
  return (
    <View style={styles.container}>
      <Text>Welcome to the Login page!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App
