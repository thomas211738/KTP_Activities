import axios from 'axios';
import React, { useCallback } from 'react';
import { Alert, ScrollView, Image, View, Text, StyleSheet, Pressable, useColorScheme} from 'react-native';
import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '@env';
import AddAlertModal from '../../components/addAlertModal';
import EditAlertModal from '../../components/editAlertModal';
import { useNavigation } from '@react-navigation/native'
import { getUserInfo } from '../../components/userInfoManager';
import AlertsLoader from '../../components/loaders/alertsLoader';

const AlertComponent = (props) => {
  const userInfo = getUserInfo();
  const colorScheme = useColorScheme();

  const themeTextStyle = colorScheme === 'light' ? styles.darkText :  styles.lightText ;
  const themeEventStyle = colorScheme === 'light' ? styles.lightEvent : styles.darkEvent;

    
  return (
    <>
      <View style={[styles.alertContainer,themeEventStyle ]}>
        <Image source={require("../../../img/ktplogopng.png")} style={styles.alertImage} />
        <View style={styles.alertTextContainer}>
          <Text style={[styles.alertName, themeTextStyle]}>{props.alertName}</Text>
          <Text style={themeTextStyle} > {props.description}</Text>
        </View>
        <Text style={styles.alertTime}>{props.time}</Text>
        {userInfo.Position.toString() === '3' || userInfo.Position.toString() === '5' ? (
          <View style={styles.alertButtons}>
            <Feather name="edit" size={24} color={colorScheme === 'light' ? "black" : "white"} style={styles.editIcon} onPress={props.onEdit} />
            <MaterialIcons name="delete" size={25} color="#B22222" style={styles.deleteIcon} onPress={props.onDelete} />
          </View>
        ): ""}
      </View>
    </>
    
    
  );
}

const index = () => {
  const [alerts, setAlerts] = useState([]);
  // const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [alertID, setAlertID] = useState('');
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const userInfo = getUserInfo();
  const colorScheme = useColorScheme();

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/alerts`);
      setAlerts(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching alerts:", err.response ? err.response.data : err.message);
    }
  }

  /*
  React.useLayoutEffect(() => {
    navigation.setOptions({
        headerRight: userInfo.Position.toString() === "3" || userInfo.Position.toString() === "5" ? () => (
            <Pressable
              onPress={async () => 
                setAddModalVisible(true)
              }
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Ionicons name="add" size={35} color={colorScheme === "light" ? "#134b91" : "#86ebba"} />
            </Pressable>
          ) : undefined,
    });
  }, [navigation, userInfo.Position, colorScheme]);
*/
  useEffect(() => {
    fetchAlerts();
  },[]);

  const formatTime = (dateString) => {
    const date = parseISO(dateString);
    return format(date, 'h:mm a');
  }

  const formatDate = (dateString) => {
    const date = parseISO(dateString);
    return format(date, 'EEEE, MMMM d');
  };

  const groupAlertsByDate = (alerts) => {
    const alertGroups = alerts.reduce((groups, alert) => {
      const date = formatDate(alert.updatedAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(alert);
      return groups;
    }, {});
  
    // Sort descending order of dates based on original alert timestamps
    const sortedDates = Object.keys(alertGroups).sort((a, b) => {
      const dateA = alerts.find(alert => formatDate(alert.updatedAt) === a).updatedAt;
      const dateB = alerts.find(alert => formatDate(alert.updatedAt) === b).updatedAt;
      return new Date(dateB) - new Date(dateA);
    });
  
    // New object with sorted dates
    const sortedAlertGroups = {};
    sortedDates.forEach(date => {
      sortedAlertGroups[date] = alertGroups[date];
    });
  
    return sortedAlertGroups;
  };

  const putAlert = async (alertName, alertDescription) => {
    try {
      await axios.put(`${BACKEND_URL}/alerts/${alertID}`, {
        "AlertName": alertName,
        "Description": alertDescription
      });
      setEditModalVisible(false);
      fetchAlerts();
    } catch (err) {
      console.error("Error updating alert:", err.response ? err.response.data : err.message);
    }
  }

  const confirmDeleteAlert = (id) => {
    Alert.alert('Are you sure you want to delete this alert?', '', [
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
      const updatedAlerts = alerts.filter(alert => alert.id != id);
      setAlerts(updatedAlerts);
    } catch (err) {
      console.error("Error deleting alert:", err.response ? err.response.data : err.message);
    }
  }

  const groupedAlerts = groupAlertsByDate(alerts);
  const themeContainerStyle = colorScheme === 'light' ? styles.lightcontainer : styles.darkcontainer;
  const themeTextStyle = colorScheme === 'light' ? styles.bluetext : styles.greentext;



  return (
    <View style={[styles.container, themeContainerStyle]}>
      <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior='automatic' >
      
      {loading ? (<AlertsLoader/>) : (
        <>
        {userInfo.Position.toString() === '3' || userInfo.Position.toString() === '5' ? <EditAlertModal visible={editModalVisible} onCancel={() => setEditModalVisible(false)} onPut={putAlert} alertID={alertID}/> : ''}
        {Object.keys(groupedAlerts).map((date, index) => (
          <View key={index + date} style={styles.dateContainer}>
            <View style={styles.alertDateContainer}>
              <Text style={[styles.alertDateText,themeTextStyle ]}>{date}</Text>
            </View>
            {groupedAlerts[date].map((alert) => (
              <View key={alert.id} style={styles.alertWrapper}>
                <AlertComponent
                  alertName={alert.AlertName}
                  description={alert.Description}
                  time={formatTime(alert.updatedAt)}
                  onEdit={() => {
                    setAlertID(alert.id);
                    setEditModalVisible(true);
                  }}
                  onDelete={() => confirmDeleteAlert(alert.id)}
                />
              </View>
            ))}
          </View>
        ))}
        
        </>
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  lightcontainer: {
    backgroundColor:  'white',
  },
  darkcontainer: {
      backgroundColor:  '#1a1a1a',
  },
  lightText: {
      color: 'white',
  },
  darkText: {
      color: 'black',
  },
  lightEvent:{
      backgroundColor: '#dedede',
  },
  darkEvent: {
      backgroundColor: '#363636',
  },
  bluetext:{
    color: '#134b91',
  },
  greentext: {
      color: '#86ebba',
  },
  container: {
    flex: 1,
    padding: 5,
  },
  alertPageHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,

  },
  alertsContainer: {
    flex: 1,
    width: '100%',
  },
  alertPageTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  alertPageSubheading: {
    marginLeft: 15,
    fontSize: 16,
  },
  alertDateContainer: {
    marginLeft: 10,
    marginRight: 10,
    marginTop: 5,
    marginBottom: 5,
    borderBottomColor: '#b0b0b0',
    borderBottomWidth: 1,
  },
  alertDateText: {
    color: '#134b91',
    fontWeight: 'bold',
    fontSize: 20,
  },
  alertContainer: {
    flexDirection: 'row',
    margin: 10,
    marginTop: 5,
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
    alignItems: 'center',
  },
  alertTextContainer: {
    flex: 1,
  },
  alertImage: {
    width: 45,
    height: 45,
    borderRadius: 15,
    marginRight: 10,
  },
  alertName: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  alertTime: {
    color: 'gray',
    fontSize: 12,
    position: 'absolute',
    top: 10, 
    right: 10,
  },
  alertWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,

  },
  addIcon: {
    marginRight: 12,
  },
  deleteIcon: {
    marginLeft: 10,
  },
  editIcon: {
    marginLeft: 10,
  },
  dateSection: {
    borderRadius: 5,
    marginBottom: 10,
  },
  dateContainer: {
    padding: 5,
    borderRadius: 5,
    marginBottom: 5,
  },
});

export default index;