import React from "react";
import { StyleSheet, Text, TextInput, Modal, View, Pressable, TouchableOpacity } from "react-native";

const POSITION_OPTIONS = [
  { label: 'Everyone (Rushees+)', value: 0 },
  { label: 'Pledges+',            value: 1 },
  { label: 'Brothers+',          value: 2 },
  { label: 'Eboard+',            value: 3 },
  { label: 'Alumni+',            value: 4 },
  { label: 'SuperAdmin only',    value: 5 },
];

const AddAlertModal = (props) => {
    const [alertName, setAlertName] = React.useState('');
    const [alertDescription, setAlertDescription] = React.useState('');
    const [position, setPosition] = React.useState(0);

    const handlePost = () => {
        props.onPost(alertName, alertDescription, position);
        setAlertName('');
        setAlertDescription('');
        setPosition(0);
    };

    return(
        <Modal animationType="fade" transparent={true} visible={props.visible} onRequestClose={props.onCancel}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Add New Alert</Text>
                    <View style={styles.boxView}>
                        <Text style={styles.boxTitle}>Alert Title</Text>
                        <TextInput style={styles.boxEntry} onChangeText={setAlertName} value={alertName} placeholder="Alert Title" placeholderTextColor="white" />
                    </View>
                    <View style={styles.boxView}>
                        <Text style={styles.boxTitle}>Description</Text>
                        <TextInput style={[styles.boxEntry, {height: 100}]} multiline onChangeText={setAlertDescription} value={alertDescription} placeholder="Alert Description" placeholderTextColor="white" />
                    </View>
                    <View style={styles.boxView}>
                        <Text style={styles.boxTitle}>Visible to</Text>
                        <View style={styles.positionRow}>
                            {POSITION_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[styles.positionChip, position === opt.value && styles.positionChipSelected]}
                                    onPress={() => setPosition(opt.value)}
                                >
                                    <Text style={[styles.positionChipText, position === opt.value && styles.positionChipTextSelected]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={styles.buttonsView}>
                        <Pressable onPress={props.onCancel} style={styles.cancelButton}>
                            <Text>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={handlePost} style={styles.postButton}>
                            <Text>Post</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    modalView: {
        backgroundColor: 'white',
        width: '85%',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        borderRadius: 25,
        paddingVertical: 24,
        gap: 16,
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
        fontWeight: 'bold',
        marginBottom: 6,
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
    positionRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    positionChip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#134b91',
    },
    positionChipSelected: {
        backgroundColor: '#134b91',
    },
    positionChipText: {
        fontSize: 13,
        color: '#134b91',
        fontWeight: '600',
    },
    positionChipTextSelected: {
        color: '#fff',
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
    },
    postButton: {
        alignItems: 'center',
        backgroundColor: 'lightblue',
        padding: 15,
        borderRadius: 5,
    }
});

export default AddAlertModal;
