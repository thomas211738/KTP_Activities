import React, {useEffect} from "react";
import { StyleSheet, Text, TextInput, Modal, View, Pressable } from "react-native";

const AddLinkedinModal = (props) => {
    const [linkedin, setLinkedin] = React.useState('');
    useEffect(() => {
        setLinkedin(props.LinkedIn);
      }, [props.LinkedIn]);


    return(
        <Modal animationType="fade" transparent={true} visible={props.visible} onRequestClose={props.onCancel}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <View style={styles.title}>
                    <Text style={styles.modalTitle}>Add linkedin</Text>
                    <Text style={styles.subTitle}>Allow others to find your linkedin from the people page</Text>
                    </View>
                    
                    <View style={styles.boxView}>
                        <Text style={styles.boxTitle}>linkedin Username</Text>
                        <TextInput style={styles.boxEntry} onChangeText={setLinkedin} value={linkedin} placeholderTextColor="white" />
                    </View>

                    <View style={styles.buttonsView}>
                        <Pressable onPress={props.onCancel} style={styles.cancelButton}>
                            <Text>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={() => props.onPost(linkedin)} style={styles.postButton}>
                            <Text>Add</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    modalView: {
        backgroundColor: 'white',
        width: '80%',
        height: '40%',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        borderRadius: 25
    },
    title:{
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginHorizontal: 10
    },
    modalTitle: {
        fontWeight: 'bold',
        fontSize: 24,
        textAlign: 'center' // Add this line to center the text
    },
    boxView: {
        alignItems: 'center',
        width: '100%'
    },
    boxTitle: {
        color: 'black',
        fontWeight: 'bold'
    },
    boxEntry: {
        backgroundColor: '#3D3D3D',
        height: 40,
        padding: 10,
        borderRadius: 6,
        marginTop: 4,
        color: 'white',
        width: "90%",
    },
    subTitle: { 
        fontSize: 16, 
        color: 'gray', 
        marginTop: 10, 
        textAlign: 'center' // Add this line to center the text
    },
    buttonsView: {
        width: '90%',
        flexDirection: 'row',
        justifyContent: 'space-evenly'
    },
    cancelButton: {
        alignItems: 'center',
        backgroundColor: "lightgray", 
        padding: 15,
        borderRadius: 5,
        marginBottom: 10
    },
    postButton: {
        alignItems: 'center',
        backgroundColor: 'lightblue',
        padding: 15,
        borderRadius: 5,
        marginBottom: 10
    }
});

export default AddLinkedinModal;