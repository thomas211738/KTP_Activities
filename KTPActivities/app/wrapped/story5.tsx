import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Story5 = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is the Fifth Story</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Story5;
