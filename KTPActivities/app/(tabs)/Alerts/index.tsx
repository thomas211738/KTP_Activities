import axios from 'axios';
import React, { useCallback } from 'react';
import { Alert, ScrollView, Image, View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BACKEND_URL } from '@env';
import { useFocusEffect } from '@react-navigation/native';
import AddAlertModal from '../../components/addAlertModal';

const AlertComponent = (props) => {
  return (
    <View style={styles.alertContainer}>
      <Image source={require("../../../img/ktplogopng.png")} style={styles.alertImage}/>
      <View>
        <Text style={styles.alertName}>{props.alertName}</Text>
        <Text style={styles.alertTime}>{props.time}</Text>
        <Text>{props.description}</Text>
      </View>
    </View>
  );
}

const index = () => { 
  const [alerts, setAlerts] = useState([]);
  const [pos, setPos] = useState(3);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/alerts`);
      setAlerts(response.data.data); 
    } catch(err) {
      console.log(err.message);
    }
  }

  useFocusEffect(() => {
    fetchAlerts();
  });

  const formatTime = (dateString) => {
    const date = parseISO(dateString);
    return format(date, 'h:mm a');
  }

  const formatDate = (dateString) => {
    const date = parseISO(dateString);
    return format(date, 'EEEE, MMMM d');
  };

  const groupAlertsByDate = ((alerts) => {
    return alerts.reduce((alertGroups, alert) => {
      const date = formatDate(alert.createdAt.substring(0, 10));
      if(!alertGroups[date]) {
        alertGroups[date] = [];
      }

      alertGroups[date].push(alert);
      return alertGroups;
    }, {});
  });

  const postAlert = async (alertName, alertDescription) => {
    try {
      await axios.post(`${BACKEND_URL}/alerts`, {
        "AlertName": alertName, 
        "Description": alertDescription
      });
      setAddModalVisible(false);
      fetchAlerts();
    } catch (err) {
      console.log(err.message);
    }
  }

  const confirmDeleteAlert = (id) => {
    Alert.alert('Are you sure you want to delete this alert?', '',[
      {
        text: 'Cancel'
      },
      {
        text: 'Delete', 
        onPress: () => deleteAlert(id), 
        style: 'destructive'
      }
    ]);
  }

  const deleteAlert = async (id) => {
    try {
      await axios.delete(`${BACKEND_URL}/alerts/${id}`);
      const updatedAlerts = alerts.filter(alert => alert._id != id);
      setAlerts(updatedAlerts);
    } catch (err) {
      console.log(err.message);
    }
  }

  const groupedAlerts = groupAlertsByDate(alerts);

  return (
    <View style={styles.container}>
      <View style={styles.alertPageHeader}>
        <View>
          <Text style={styles.alertPageTitle}>Announcements</Text>
          <Text style={styles.alertPageSubheading}>Updates and reminders about rush!</Text>
        </View>
        {pos >= 3 ? <Ionicons name="add-circle-outline" size={33} color="black"  style={styles.addIcon} onPress={() => setAddModalVisible(true)}/> : ''}
      </View>
      <ScrollView style={styles.alertsContainer}>
        <AddAlertModal visible={addModalVisible} onCancel={() => setAddModalVisible(false)} onPost={postAlert} />
        {Object.keys(groupedAlerts).map((date, index) => (
          <View key={index+date}>
            <View style={styles.alertDateContainer}>
              <Text style={styles.alertDateText}>{date}</Text>
            </View>
            {groupedAlerts[date].map((alert) => (
              <View key={alert._id} style={styles.alertWrapper}>
                <AlertComponent alertName={alert.AlertName} description={alert.Description} time={formatTime(alert.createdAt)} />
                {pos >= 3 ? <Feather name="edit" size={24} color="black" style={styles.editIcon} onPress={() => 
                  router.push({
                    pathname: 'components/editAlert',
                    params: { alertID: alert._id }
                  })
                } /> : ''}
                {pos >= 3 ? <MaterialIcons name="delete" size={25} color="black" style={styles.deleteIcon} onPress={() => confirmDeleteAlert(alert._id)} /> : ''}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  alertPageHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  alertsContainer: {
    flex: 1,
    width:'100%'
  },
  alertPageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginLeft: 15,
    marginTop: 15,
  },
  alertPageSubheading: {
    marginLeft: 15,
    marginTop: 5,
    marginBottom: 5,
    color: 'gray'
  },
  alertDateContainer: {
    marginLeft: 15,
    marginRight: 15,
    marginTop: 10,
    borderBottomColor: '#b0b0b0',
    borderBottomWidth: 1,
  },
  alertDateText: {
    color: '#6082B6',
    fontWeight:'bold'
  },
  alertContainer: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: 15,
    marginTop: 10
  },
  alertImage: {
    width: 45,
    height: 45,
    borderRadius: 15,
    marginRight: 10
  },
  alertName: {
    fontWeight: 'bold'
  },
  alertTime: {
    color: 'gray',
    fontSize: 12
  },
  alertWrapper: {
    flexDirection: 'row'
  },
  addIcon: {
    marginRight: 12
  },
  deleteIcon: {
    margin: 15
  },
  editIcon: {
    marginTop: 15
  }
});

export default index;