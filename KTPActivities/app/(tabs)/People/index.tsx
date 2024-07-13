
import { View, Text, ScrollView, StyleSheet} from 'react-native'
import React from 'react'

const index = () => {
  return (
    <View style={styles.container}>
        <ScrollView keyboardDismissMode='on-drag' contentInsetAdjustmentBehavior='automatic'>
            <Text>Profile Page</Text>
            <Text>Profile Page</Text>
            <Text>Profile Page</Text>
            <Text>Profile Page</Text>
            <Text>Profile Page</Text>
            <Text>Profile Page</Text>
            <Text>Profile Page</Text>
        </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    

})

export default index