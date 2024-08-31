import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Image} from 'react-native';

const GoogleButton = ({ promptAsync }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={() => promptAsync()}>
      <Image
        source={require('./../../img/google_icon.png')} 
        style={styles.icon}
      />
      <Text style={styles.buttonText}>Sign in with Google</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#dedede',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    margin: 10,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GoogleButton;
