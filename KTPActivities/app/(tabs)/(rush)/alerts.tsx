import axios from 'axios';
import React, { useCallback } from 'react';
import { ScrollView, Image, View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { BACKEND_URL } from '@env';

const Alert = (props) => {
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

const AlertsTab = () => { 
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/alerts`);
        setAlerts(response.data.data); 
      } catch(err) {
        console.log(err.message);
      }
    }
    fetchAlerts();
  }, []);

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

  const groupedAlerts = groupAlertsByDate(alerts);

  return (
    <View style={styles.container}>
      <Text style={styles.alertPageTitle}>Announcements</Text>
      <Text style={styles.alertPageSubheading}>Updates and reminders about rush!</Text>
      <ScrollView style={styles.alertsContainer}>
        {Object.keys(groupedAlerts).map((date, index) => (
          <View key={index+date}>
            <View style={styles.alertDateContainer}>
              <Text style={styles.alertDateText}>{date}</Text>
            </View>
            {groupedAlerts[date].map((alert) => (
              <Alert key={alert._id} alertName={alert.AlertName} description={alert.Description} time={alert.Time} />
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
  }
});

export default AlertsTab;