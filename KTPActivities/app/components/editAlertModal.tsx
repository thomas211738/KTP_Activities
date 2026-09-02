import { View, Text, TextInput, StyleSheet, Modal, Pressable } from 'react-native';
import React from 'react';

// Accepts two prop patterns:
//   Legacy: { alertID, visible, onCancel, onPut }
//   New:    { alertName, description, visible, onCancel, onSave }
const EditAlertModal = (props: any) => {
  const [alertName, setAlertName] = React.useState(props.alertName || '');
  const [alertDescription, setAlertDescription] = React.useState(props.description || '');

  // Sync when pre-filled props change
  React.useEffect(() => {
    if (props.alertName !== undefined) setAlertName(props.alertName || '');
    if (props.description !== undefined) setAlertDescription(props.description || '');
  }, [props.alertName, props.description]);

  const handleSave = () => {
    if (props.onSave) props.onSave(alertName, alertDescription);
    else if (props.onPut) props.onPut(alertName, alertDescription);
  };

  return (
    <Modal animationType="fade" transparent visible={props.visible} onRequestClose={props.onCancel}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Edit Alert</Text>
          <View style={styles.boxView}>
            <Text style={styles.boxTitle}>Alert Title</Text>
            <TextInput style={styles.boxEntry} onChangeText={setAlertName} value={alertName} placeholderTextColor="white" />
          </View>
          <View style={styles.boxView}>
            <Text style={styles.boxTitle}>Description</Text>
            <TextInput style={[styles.boxEntry, { height: 120 }]} multiline onChangeText={setAlertDescription} value={alertDescription} placeholderTextColor="white" />
          </View>
          <View style={styles.buttonsView}>
            <Pressable onPress={props.onCancel} style={styles.cancelButton}><Text>Cancel</Text></Pressable>
            <Pressable onPress={handleSave} style={styles.postButton}><Text>Save</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalView: { backgroundColor: 'white', width: '85%', alignItems: 'center', justifyContent: 'space-evenly', borderRadius: 25, paddingVertical: 24, gap: 16 },
  modalTitle: { fontWeight: 'bold', fontSize: 24 },
  boxView: { alignItems: 'center', width: '100%' },
  boxTitle: { color: 'black', fontWeight: 'bold', marginBottom: 6 },
  boxEntry: { backgroundColor: '#3D3D3D', height: 40, padding: 10, borderRadius: 6, marginTop: 4, color: 'white', width: '90%' },
  buttonsView: { width: '90%', flexDirection: 'row', justifyContent: 'space-evenly' },
  cancelButton: { alignItems: 'center', backgroundColor: 'lightgray', padding: 15, borderRadius: 5 },
  postButton: { alignItems: 'center', backgroundColor: 'lightblue', padding: 15, borderRadius: 5 },
});

export default EditAlertModal;
