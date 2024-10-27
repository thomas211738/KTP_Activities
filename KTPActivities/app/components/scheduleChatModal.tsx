import React from "react";
import { StyleSheet, Text, TextInput, Modal, View, Pressable } from "react-native";

const ScheduleChatModal = (props) => {
    const [subject, setSubject] = React.useState('');
    const [message, setMessage] = React.useState('');

    return(
        <Modal animationType="fade" transparent={true} visible={props.visible} onRequestClose={props.onCancel}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Schedule Coffee Chat</Text>
                    <View style={styles.boxView}>
                        <Text style={styles.boxTitle}>Subject</Text>
                        <TextInput style={styles.boxEntry} onChangeText={setSubject} value={subject} placeholder="Subject" placeholderTextColor="white" />
                    </View>
                    <View style={styles.boxView}>
                        <Text style={styles.boxTitle}>Message</Text>
                        <TextInput style={[styles.boxEntry, {height: 160}]} multiline onChangeText={setMessage} value={message} placeholder="Message" placeholderTextColor="white" />
                    </View>
                    <View style={styles.buttonsView}>
                        <Pressable onPress={props.onCancel} style={styles.cancelButton}>
                            <Text>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={() => props.onSend(subject, message)} style={styles.sendButton}>
                            <Text>Send</Text>
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
    sendButton: {
        alignItems: 'center',
        backgroundColor: 'lightblue',
        padding: 15,
        borderRadius: 5,
        marginBottom: 10
    }
});

export default ScheduleChatModal;