import { View, Text, TextInput, StyleSheet, Button} from 'react-native'
import React, {useState} from 'react'
import Toast from 'react-native-root-toast';
import { RootSiblingParent } from 'react-native-root-siblings';
import { router } from 'expo-router';
import { ValidateUser } from './components/auth';
import { setUserInfo } from './components/userInfoManager';
import { setAllUsersInfo } from './components/allUsersManager';



const testing = () => {
    const [testCode, setTestCode] = useState('');

    const validatecode = async (testCode) => {
        if (testCode === 'qqE6yawLjFBcuA'){
            const validation = await ValidateUser("testktpapp@gmail.com");
            setUserInfo(validation.user); 
            setAllUsersInfo(validation.allUsers);
            router.push({pathname: '(tabs)/Calendar'})
        } else{
            Toast.show('Error: incorrect test code', {
                duration: Toast.durations.SHORT,
                position: Toast.positions.BOTTOM,
                shadow: true,
                animation: true,
                hideOnPress: true,
                delay: 0,
                backgroundColor: 'red',
                textColor: 'white',
                opacity: 1,
              });
        }
        
    }




  return (
    <RootSiblingParent>

    <View style={styles.view}>
        <Text style={styles.text}>Please enter the testing code</Text>
      <TextInput
        style={styles.boxEntry}
        onChangeText={setTestCode}
        value={testCode}
        placeholderTextColor="white"
    />
    <Button title='Submit' onPress={() => validatecode(testCode)}></Button>
        
    </View>
    </RootSiblingParent>

  )
}

const styles = StyleSheet.create({
    view:{
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold',
    },
    boxEntry: {
      backgroundColor: '#3D3D3D',
      height: 40,
      width: 200,
      padding: 10,
      borderRadius: 6,
      marginTop: 4,
      color: 'white',
    },
   

  });

export default testing