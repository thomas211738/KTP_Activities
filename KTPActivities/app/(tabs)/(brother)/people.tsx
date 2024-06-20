import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { useState } from "react";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";

const people = () => {
  const [activeView, setActiveView] = useState("For you");
  const [activeTab, setActiveTab] = useState("For you");
  const [directory, setDirectory] = useState([]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <HeaderTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setActiveView={setActiveView}
        />
      </View>

      <PeopleCard></PeopleCard>
    </SafeAreaView>
  );
};

const HeaderTab = ({ text, onPress, isActive }) => {
  const Content = () => (
    <View style={isActive ? headerStyles.tabClicked : headerStyles.tab}>
      <Text style={[headerStyles.tabText, isActive && { color: "#FFFFFF" }]}>
        {text}
      </Text>
    </View>
  );

  return (
    <TouchableOpacity onPress={onPress}>
      {isActive ? (
        <LinearGradient
          colors={["#2c67f2", "#2c67f2", "#2c67f2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={headerStyles.tabGradient}
        >
          <Content />
        </LinearGradient>
      ) : (
        <Content />
      )}
    </TouchableOpacity>
  );
};

const HeaderTabs = ({ activeTab, setActiveTab, setActiveView }) => {
  const handlePress = (tabName) => () => {
    setActiveView(tabName);
    setActiveTab(tabName);
  };

  return (
    <View style={headerStyles.tabs}>
      <HeaderTab
        text={"Rushes"}
        onPress={handlePress("Rushes")}
        isActive={activeTab === "Rushes"}
      />
      <HeaderTab
        text={"Brothers"}
        onPress={handlePress("Brothers")}
        isActive={activeTab === "Brothers"}
      />
      <HeaderTab
        text={"EBoard"}
        onPress={handlePress("EBoard")}
        isActive={activeTab === "EBoard"}
      />
    </View>
  );
};

const PeopleCard = () => {
  return (
    <TouchableOpacity>
      <View style={peopleStyle.container}>
        <View style={peopleStyle.imageContainer}>
          <Image
            style={peopleStyle.pfp}
            source={require("./img/evanlapid.png")}
          />
        </View>
        <View style={peopleStyle.information}>
          <Text style={peopleStyle.title}>Brother</Text>
          <Text style={peopleStyle.name}>Evan Lapid</Text>
          <Text style={peopleStyle.major}>Computer Science</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    alignItems: "center",
  },
});

const headerStyles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
    gap: 12,
  },
  tab: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 10,

    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#878787",
  },
  tabClicked: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 9,

    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "transparent",
  },
  tabText: {
    color: "#878787",
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Regular",
  },
  tabGradient: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
});

const peopleStyle = StyleSheet.create({
  container: {
    width: "95%",
    height: 70,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#D3D3D3",
    marginLeft: "auto",
    marginRight: "auto",
    flexDirection: "row",
    backgroundColor: "#fff",
  },
  pfp: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  information: {
    flex: 5,
    flexDirection: "column",
    marginTop: 10,
    marginBottom: 5,
    marginLeft: 5,
  },
  imageContainer: {
    flex: 1,
  },
  title: {
    fontSize: 10,
    color: "#0b5394",
  },
  name: {
    fontSize: 15,
    marginTop: 1,
    marginBottom: 1,
  },
  major: {
    fontSize: 12,
    color: "#808080",
  },
});

export default people;
