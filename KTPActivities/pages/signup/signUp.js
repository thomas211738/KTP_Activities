import React from 'react';
import { StyleSheet, Text, View, Button, ScrollView, SafeAreaView, Image, TextInput } from 'react-native';

//SIGNUP PAGE
const SignupPage = ({ navigation }) => {
  const [text1, setText1] = React.useState('');
  const [text2, setText2] = React.useState('');
  const [text3, setText3] = React.useState('');
  const [text4, setText4] = React.useState('');
  const [text5, setText5] = React.useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.top}>
          <Image source={require('../../img/ktplogopng.png')} style={styles.logo} />
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            Let's get started on creating your account.
          </Text>
        </View>
        <View style={styles.middle}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>First Name</Text>
            <TextInput
              style={styles.boxEntry}
              onChangeText={setText1}
              value={text1}
              placeholder="Enter your first name"
              placeholderTextColor="white"
              color="white"
            />
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Last Name</Text>
            <TextInput
              style={styles.boxEntry}
              onChangeText={setText2}
              value={text2}
              placeholder="Enter your last name"
              placeholderTextColor="white"
              color="white"
            />
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>BU Email</Text>
            <TextInput
              style={styles.boxEntry}
              onChangeText={setText3}
              value={text3}
              placeholder="Enter your @bu.edu email"
              placeholderTextColor="white"
              color="white"
            />
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Create Password</Text>
            <TextInput
              style={styles.boxEntry}
              onChangeText={setText4}
              value={text4}
              placeholder="Enter your password"
              placeholderTextColor="white"
              color="white"
            />
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Confirm Password</Text>
            <TextInput
              style={styles.boxEntry}
              onChangeText={setText5}
              value={text5}
              placeholder="Re-enter your password"
              placeholderTextColor="white"
              color="white"
            />
          </View>
        </View>
        <View style={styles.bottom}>
          <View style={styles.button}>
            <Button
              title="Continue"
              color="black"
              onPress={() => navigation.navigate('Upcoming Events')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5E89B2',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  top: {
    alignItems: 'center',
    marginVertical: 20,
  },
  middle: {
    paddingHorizontal: 20,
  },
  box: {
    marginVertical: 10,
  },
  boxTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
  boxEntry: {
    backgroundColor: '#3D3D3D',
    height: 40,
    padding: 10,
    borderRadius: 6,
    marginTop: 4,
    color: 'white',
  },
  bottom: {
    alignItems: 'center',
    padding: 12,
  },
  logo: {
    width: 100,
    height: 100,
  },
  button: {
    marginTop: 30,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 300,
    padding: 6,
  },
});

export default SignupPage;
