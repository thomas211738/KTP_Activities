
import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Image, TextInput, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Dropdown, MultiSelect } from 'react-native-element-dropdown';
import { FontAwesome6 } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import colleges from './components/buinfo';
import { gradyears } from './components/buinfo';


const SignupPage = ({ navigation }) => {
  const [userFirstName, setuserFirstName] = useState('');
  const [userLastName, setuserLastName] = useState('');
  const [userBUEmail, setuserBUEmail] = useState('');
  const [userGradYear, setUserGradYear] = useState('');
  const [userColleges, setUserColleges] = useState([]);


  const renderItem = (item) => {
    return (
      <View style={dropdownstyles.item}>
        <Text style={dropdownstyles.itemTextStyle}>{item.label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={styles.scrollContainer}>
        <View style={styles.top}>
          <Image source={require('../img/ktplogopng.png')} style={styles.logo} />
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            Let's get started on creating your account.
          </Text>
        </View>
        <View style={styles.middle}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>First Name</Text>
            <TextInput
              style={styles.boxEntry}
              onChangeText={setuserFirstName}
              value={userFirstName}
              placeholder="Enter your first name"
              placeholderTextColor="white"
            />
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Last Name</Text>
            <TextInput
              style={styles.boxEntry}
              onChangeText={setuserLastName}
              value={userLastName}
              placeholder="Enter your last name"
              placeholderTextColor="white"
            />
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>BU Email</Text>
            <TextInput
              style={styles.boxEntry}
              onChangeText={setuserBUEmail}
              value={userBUEmail}
              placeholder="Enter your @bu.edu email"
              placeholderTextColor="white"
            />
          </View>
          <View style={styles.box}>
          <Text style={styles.boxTitle}>Graduation Year</Text>
            <Dropdown
              maxHeight={200}
              style={dropdownstyles.dropdown}
              placeholderStyle={dropdownstyles.placeholderStyle}
              itemTextStyle={dropdownstyles.itemTextStyle}
              selectedTextStyle={dropdownstyles.selectedTextStyle}
              
              inputSearchStyle={dropdownstyles.inputSearchStyle}
              iconStyle={dropdownstyles.iconStyle}
              data={gradyears}
              labelField="label"
              valueField="value"
              value={userGradYear}
              onChange={(item) => {
                setUserGradYear(item);
              }}
              renderLeftIcon={() => (
                <Ionicons style={dropdownstyles.icon} name="school" size={20} color="white" />
              )}
              renderItem={renderItem}
              activeColor="lightgray"
              placeholder="Select your graduation year"
            />
          </View>
          <View style={styles.box}>
          <Text style={styles.boxTitle}>Select College(s)</Text>
            <MultiSelect
              maxHeight={200}
              style={dropdownstyles.dropdown}
              placeholderStyle={dropdownstyles.placeholderStyle}
              selectedTextStyle={dropdownstyles.selectedTextStyle}
              itemTextStyle={dropdownstyles.itemTextStyle}
              inputSearchStyle={dropdownstyles.inputSearchStyle}
              iconStyle={dropdownstyles.iconStyle}
              data={colleges}
              labelField="label"
              valueField="value"
              value={userColleges}
              onChange={(item) => {
                setUserColleges(item);
              }}
              renderLeftIcon={() => (
                <FontAwesome6 style={dropdownstyles.icon} name="school" size={15} color="white" />
              )}
              renderItem={renderItem}
              renderSelectedItem={(item, unSelect) => (
                <TouchableOpacity onPress={() => unSelect && unSelect(item)}>
                  <View style={dropdownstyles.selectedStyle}>
                    <Text style={dropdownstyles.textSelectedStyle}>{item.label}</Text>
                    <AntDesign color="white" name="delete" size={17} />
                  </View>
                </TouchableOpacity>
              )}
              activeColor="lightgray"
              placeholder="Select your college(s)"
            />
          </View>
          
        </View>
        <View style={styles.bottom}>
          <View style={styles.button}>
            <Link href="/calender"> Login </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5E89B2',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  top: {
    alignItems: 'center',
    marginVertical: 20,
  },
  middle: {
    paddingHorizontal: 20,
  },
  box: {
    marginVertical: 10,
  },
  boxTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
  boxEntry: {
    backgroundColor: '#3D3D3D',
    height: 40,
    padding: 10,
    borderRadius: 6,
    marginTop: 4,
    color: 'white',
  },
  bottom: {
    alignItems: 'center',
    padding: 12,
  },
  logo: {
    width: 100,
    height: 100,
  },
  button: {
    marginTop: 30,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 300,
    padding: 6,
  },
});

const dropdownstyles = StyleSheet.create({

  dropdown: {
    height: 40,
    backgroundColor: '#3D3D3D',
    borderRadius: 6,
    padding: 12,
    color: 'white',
    marginTop: 4,
  },
  placeholderStyle: {
    fontSize: 14,
    color: 'white',
  },
  itemTextStyle: {
    fontSize: 14,
    color: 'black',
  },
  selectedTextStyle: {
    fontSize: 14,
    color: 'white',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    color: 'white',
  },
  icon: {
    marginRight: 5,
  },
  item: {
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedStyle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#3D3D3D',
    shadowColor: '#000',
    marginTop: 8,
    marginRight: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  textSelectedStyle: {
    marginRight: 5,
    fontSize: 16,
    color: 'white',
  },
});

export default SignupPage;
