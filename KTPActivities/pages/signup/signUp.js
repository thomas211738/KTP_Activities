
import React from 'react';
import { StyleSheet, Text, View, Button, SafeAreaView, Image, TextInput} from 'react-native';



//SIGNUP PAGE
const SignupPage = ({navigation}) => {
    const [text1, box1] = React.useState('');
    const [text2, box2] = React.useState('');
    const [text3, box3] = React.useState('');
    const [text4, box4] = React.useState('');
    const [text5, box5] = React.useState('');
    return (
      <SafeAreaView style={signup.container}>
          <View style={signup.top}>
            <Image source={require('../../img/ktplogopng.png')} style={signup.logo} />
            <Text style={{color: 'white', fontWeight: 'bold'}}>Let's get started on creating your account.</Text>
          </View>
          <View style={signup.middle}>
            <View style={signup.box}>
              <Text style={signup.boxTitle}>First Name</Text>
              <TextInput
                style={signup.boxEntry}
                onChangeText={box1}
                value={text1}
                placeholder="Enter your first name"
                placeholderTextColor="white"
                color="white"
              />
            </View>
            <View style={signup.box}>
            <Text style={signup.boxTitle}>Last Name</Text>
              <TextInput
                style={signup.boxEntry}
                onChangeText={box2}
                value={text2}
                placeholder="Enter your last name"
                placeholderTextColor="white"
                color="white"
              />
            </View>
            <View style={signup.box}>
            <Text style={signup.boxTitle}>BU Email</Text>
              <TextInput
                style={signup.boxEntry}
                onChangeText={box3}
                value={text3}
                placeholder="Enter your @bu.edu email"
                placeholderTextColor="white"
                color="white"
              />
            </View>
            <View style={signup.box}>
            <Text style={signup.boxTitle}>Create Password</Text>
              <TextInput
                style={signup.boxEntry}
                onChangeText={box4}
                value={text4}
                placeholder="Enter your password"
                placeholderTextColor="white"
                color="white"
              />
            </View>
            <View style={signup.box}>
            <Text style={signup.boxTitle}>Confirm Password</Text>
              <TextInput
                style={signup.boxEntry}
                onChangeText={box5}
                value={text5}
                placeholder="Re-enter your password"
                placeholderTextColor="white"
                color="white"
              />
            </View>
          </View>
          <View style={signup.bottom}>
          <View style={signup.button}>
            <Button 
              title="Continue"
              color="black"
              onPress = {() =>
                navigation.navigate('information')
            }
            />
            </View>
          </View>
      </SafeAreaView>
    );
  }
  
  const signup = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#5E89B2'
    },
    top: {
      flex: 1.5,
      alignItems: 'center',
  
    },
    middle: {
      flex: 4,
    },
    box: {
      flex: 1,
      borderRadius: 5,
      padding:20,
    },
    boxTitle: {
      color:'white',
      fontWeight: 'bold',
    },
    boxEntry: {
      backgroundColor: '#3D3D3D',
      height: 40,
      padding: 10,
      borderRadius: 6,
      marginTop: 4,
  
    },
    bottom: {
      flex: 1,
      alignItems: 'center',
      padding: 12,
    },
    logo: {
      width: 100,
      height: 100,
      marginTop: 30,
    },
    button: {
      marginTop: 30,
      backgroundColor: '#fff',
      borderRadius: 8,
      width: 300,
      padding: 6,
    }
  });

export default SignupPage