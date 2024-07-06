
import React, { useState , useEffect} from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Image, TextInput, TouchableOpacity } from 'react-native';
import { Dropdown, MultiSelect } from 'react-native-element-dropdown';
import { FontAwesome6 } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import colleges from './components/buinfo';
import { gradyears } from './components/buinfo';
import { useLocalSearchParams, router } from 'expo-router';
import axios from 'axios';
import {BACKEND_URL} from '@env';



const SignupPage = () => {
  const [userFirstName, setuserFirstName] = useState('');
  const [userLastName, setuserLastName] = useState('');
  const [userGradYear, setUserGradYear] = useState('');
  const [userColleges, setUserColleges] = useState([]);
  const [userMajor, setUserMajor] = useState("");
  const [userMinor, setUserMinor] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [position, setPosition] = useState("0");
  const { email } = useLocalSearchParams();


  useEffect(() => {
    const checkFormValid = () => {
      if (userFirstName && userLastName && userGradYear && userColleges.length > 0 && userMajor) {
        setIsFormValid(true);
      } else {
        setIsFormValid(false);
      }
    };
    checkFormValid();
  }, [userFirstName, userLastName, userGradYear, userColleges, userMajor]);


  const renderItem = (item) => {
    return (
      <View style={dropdownstyles.item}>
        <Text style={dropdownstyles.itemTextStyle}>{item.label}</Text>
      </View>
    );
  };

  const handleFinishPress = () => {
    if (isFormValid) {
      const new_user = {
        BUEmail: email,
        FirstName: userFirstName,
        LastName: userLastName,
        GradYear: userGradYear,
        Colleges: userColleges,
        Major: userMajor,
        Position: position,
      };
      console.log(new_user);

      axios
      .post(`${BACKEND_URL}/users`, new_user)
      .then(() => {
        router.replace("/(tabs)/(rush)/calender");
      })
      .catch((error) => {
        console.log(error);
      });

    }
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
            <Text style={styles.boxTitle}>Email</Text>
            <TextInput
              style={styles.boxEntry}
              placeholder={email}
              placeholderTextColor="gray"
              readOnly={true}
            />
          </View>
          <View style={styles.box}>
          <Text style={styles.boxTitle}>Graduation Year</Text>
            <Dropdown
              confirmSelectItem={true}
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
                setUserGradYear(String(item.label));
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
              confirmSelectItem={true}
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
              onChange={(items) => {
                setUserColleges(items.map(item => String(item)));
              }}
              renderLeftIcon={() => (
                <FontAwesome6 style={dropdownstyles.icon} name="school" size={15} color="white" />
              )}
              renderItem={renderItem}
              renderSelectedItem={(item, unSelect) => (
                <TouchableOpacity onPress={() => unSelect && unSelect(item)}>
                  <View style={dropdownstyles.selectedStyle}>
                    <Text style={dropdownstyles.textSelectedStyle}>{item.value}</Text>
                    <AntDesign color="white" name="delete" size={17} />
                  </View>
                </TouchableOpacity>
              )}
              activeColor="lightgray"
              placeholder="Select your college(s)"
            />
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Major</Text>
            <TextInput
              style={styles.boxEntry}
              onChangeText={setUserMajor}
              value={userMajor}
              placeholder="E.g. Data Science"
              placeholderTextColor="white"
            />
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Minor (optional)</Text>
            <TextInput
              style={styles.boxEntry}
              onChangeText={setUserMinor}
              value={userMinor}
              placeholder="E.g. Business Administration"
              placeholderTextColor="white"
            />
          </View>
        </View>
        <View style={styles.bottom}>
          <TouchableOpacity
            style={[styles.button, !isFormValid && styles.buttonDisabled]}
            disabled={!isFormValid}
            onPress={handleFinishPress}
          >
            <Text style={styles.buttonText}>Finish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5E89B3',
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
    marginTop: 20,
    borderRadius: 8,
    backgroundColor: '#1be347',
    width: 300,
    height: 40,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'darkgray',
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
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
    fontSize: 20,
    color: 'white',
  },
  icon: {
    marginRight: 5,
  },
  item: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',

  },
  selectedStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
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
    elevation: 5,
  },
  textSelectedStyle: {
    marginRight: 5,
    fontSize: 16,
    color: 'white',
  },
});

export default SignupPage;
