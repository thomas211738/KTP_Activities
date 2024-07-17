import React from "react";
import { StyleSheet, Text, TextInput, Modal, View, Pressable } from "react-native";

const AddInterestModal = (props) => {
    const [interest, setInterest] = React.useState('');

    return(
        <Modal animationType="fade" transparent={true} visible={props.visible} onRequestClose={props.onCancel}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Add New Interest</Text>
                    <View style={styles.boxView}>
                        <Text style={styles.boxTitle}>Interest</Text>
                        <TextInput style={styles.boxEntry} onChangeText={setInterest} value={interest} placeholderTextColor="white" />
                    </View>
                    <View style={styles.buttonsView}>
                        <Pressable onPress={props.onCancel} style={styles.cancelButton}>
                            <Text>Cancel</Text>
                        </Pressable>
                        <Pressable 
                            onPress={() => {
                                if (interest) {
                                    props.onPost(interest);
                                }
                            }} 
                            style={[styles.postButton, !interest && styles.disabledButton]}
                            disabled={!interest}
                        >
                            <Text>Post</Text>
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
        width: '70%',
        height: '50%',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        borderRadius: 25
    },
    modalTitle: {
        fontWeight: 'bold',
        fontSize: 24
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
    },
    disabledButton: {
        backgroundColor: 'gray'
    }
});

export default AddInterestModal;
