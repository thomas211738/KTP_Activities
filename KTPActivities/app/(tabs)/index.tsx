import { View, Button } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native';





const index = () => {
    const mynavigation = useNavigation();
  return (
    <View>
    <Button title="Rush" onPress={() => mynavigation.navigate('(rush)')} />
    <Button title="Pledge" onPress={() => mynavigation.navigate('(pledge)')} />
    <Button title="Brother" onPress={() => mynavigation.navigate('(brother)')} />
    <Button title="Eboard" onPress={() => mynavigation.navigate('(eboard)')} />
    <Button title="Super" onPress={() => mynavigation.navigate('(super)')} />
  
    </View>
    
  )
}

export default index