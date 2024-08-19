import { View, Text, TextInput, StyleSheet, Modal, Pressable } from 'react-native'
import React from 'react'
import axios from 'axios'
import { BACKEND_URL } from '@env';

const EditAlertModal = (props) => {
  const [alertName, setAlertName] = React.useState('');
  const [alertDescription, setAlertDescription] = React.useState('');

  React.useEffect(() => {
    axios.get(`${BACKEND_URL}/alerts/${props.alertID}`)
      .then((response) => {
        setAlertName(response.data.AlertName);
        setAlertDescription(response.data.Description);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [props.alertID]);

  return (
    <Modal animationType="fade" transparent={true} visible={props.visible} onRequestClose={props.onCancel}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Edit Alert</Text>
          <View style={styles.boxView}>
            <Text style={styles.boxTitle}>Alert Title</Text>
            <TextInput style={styles.boxEntry} onChangeText={setAlertName} value={alertName} placeholderTextColor="white" />
          </View>
          <View style={styles.boxView}>
            <Text style={styles.boxTitle}>Description</Text>
            <TextInput style={[styles.boxEntry, { height: 160 }]} multiline onChangeText={setAlertDescription} value={alertDescription} placeholderTextColor="white" />
          </View>
          <View style={styles.buttonsView}>
            <Pressable onPress={props.onCancel} style={styles.cancelButton}>
              <Text>Cancel</Text>
            </Pressable>
            <Pressable onPress={() => props.onPut(alertName, alertDescription)} style={styles.postButton}>
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
  postButton: {
    alignItems: 'center',
    backgroundColor: 'lightblue',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10
  }
});

export default EditAlertModal