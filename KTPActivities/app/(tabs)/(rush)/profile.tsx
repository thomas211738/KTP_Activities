import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

export default function Tab() {
  return (
    <View style={styles.container}>
      <Text>rush Tab profile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});