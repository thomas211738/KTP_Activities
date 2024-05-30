import React, { Component } from 'react';
import { Alert, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { AgendaList,WeekCalendar,AgendaSchedule, CalendarProvider, ExpandableCalendar } from 'react-native-calendars';
import Entypo from '@expo/vector-icons/Entypo';
import { MaterialIcons } from '@expo/vector-icons';

interface State {
  items?: AgendaSchedule;
}

export default class AgendaScreen extends Component<{}, State> {
  state: State = {
    items: undefined
  };

  dates: string[] = [
    '2024-05-22',
    '2024-05-23',
    '2024-05-24'
  ];

  agendaItems = [
    {
      title: this.dates[0],
      data: [{ location: 'CDS B64', duration: '6-8pm', title: 'Meet and Greet', description: "Get the chance to meet with e-board members and brothers and hear their experiences at KTP." }]
    },
    {
      title: this.dates[1],
      data: [
        { location: 'CDS B64', duration: '2-5:30pm', title: 'Design Jam' , description: "You and a team will work together to create an app and present it"}
      ]
    },
    {
      title: this.dates[2],
      data: [
        { location: 'CDS 264', duration: '8am-5:30pm', title: 'Individual Interviews', description: "Interview with eboard and a few brothers" }
      ]
    }
  ];

  renderItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={[styles.item, { height: item.height || 105 }]}
        onPress={() => Alert.alert(item.title)}
      >
        <Text  style={{fontSize: 18, fontWeight: 'bold', paddingBottom: 5}}> {item.title}</Text>
        <Text style={{paddingBottom:5, color: 'royalblue', fontWeight: 'bold'}}><Entypo name="location-pin" size={15} color="black" />{item.location}             <Text ><MaterialIcons name="access-time-filled" size={15} color="black" />{item.duration}</Text>  </Text>      
        <Text>{item.description}</Text>
        
      </TouchableOpacity>
    );
  };

  render() {
    return (
      <CalendarProvider date={this.dates[0]} showTodayButton>
        <WeekCalendar 
        allowShadow
        />
        <AgendaList
          sections={this.agendaItems}
          renderItem={this.renderItem}
        />
      </CalendarProvider>
    );
  }
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: 'white',
    flex: 1,
    borderRadius: 5,
    paddingLeft: 10,
    marginBottom: 10
  },

});
