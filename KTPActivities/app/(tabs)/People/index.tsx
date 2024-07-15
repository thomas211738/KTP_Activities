
import { View, Text, ScrollView, StyleSheet} from 'react-native'
import React from 'react'
import { getAllUsersInfo } from '../../components/allUsersManager'

const index = () => {
    const users = getAllUsersInfo();
  return (
    <View style={styles.container}>
        <ScrollView keyboardDismissMode='on-drag' contentInsetAdjustmentBehavior='automatic'>
            {users.map((user) => (
                <View>
                    <Text>{user.FirstName} {user.LastName}</Text>
                </View>
            ))}
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