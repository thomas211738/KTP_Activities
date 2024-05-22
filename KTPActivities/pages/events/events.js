
import React from 'react';
import { StyleSheet, Text, View,} from 'react-native';

const InformationPage = ({navigation}) => {
    return (
      <View style={information.container}>
        <Text>Welcome to the information page!</Text>
      </View>
    );
  }
  const information = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default InformationPage;