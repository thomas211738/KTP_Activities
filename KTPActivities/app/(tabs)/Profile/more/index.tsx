// React Imports
import { View, StyleSheet, TouchableOpacity, Text, useColorScheme, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';

const MoreScreen = () => {
    const colorScheme = useColorScheme();
    const containerTheme = colorScheme === 'light' ? styles.containerLight : styles.containerDark;
    const eventTheme = colorScheme === 'light' ? styles.lightEvent : styles.darkEvent;

    return (
        <ScrollView contentInsetAdjustmentBehavior='automatic' showsHorizontalScrollIndicator={false} style={[styles.container, containerTheme]}>
            <View style={[styles.resourcesCard, eventTheme]}>
                <TouchableOpacity onPress={() => {
                    router.push({pathname: "(tabs)/Profile/more/notifications" });
                }}>
                    <Text style={styles.resourcesButtonText}>Send new notification</Text>
                </TouchableOpacity>
                <Ionicons name="notifications" size={20} color={colorScheme === 'light' ? "white" : "black"} />
            </View>
            <View style={[styles.resourcesCard, eventTheme]}>
                <TouchableOpacity onPress={() => {
                    router.push({pathname: "(tabs)/Profile/more/pledgeToBrother" });
                }}>
                    <Text style={styles.resourcesButtonText}>Pledge to Brother</Text>
                </TouchableOpacity>
                <MaterialIcons name="local-police" size={24} color={colorScheme === 'light' ? "white" : "black"} />
            </View>
            <View style={[styles.resourcesCard, eventTheme]}>
                <TouchableOpacity onPress={() => {
                    router.push({pathname: "(tabs)/Profile/more/deleteRushees" });
                }}>
                    <Text style={styles.resourcesButtonText}>Delete Rushees</Text>
                </TouchableOpacity>
                <Ionicons name="trash" size={20} color={colorScheme === 'light' ? "white" : "black"} />
            </View>
            <View style={[styles.resourcesCard, eventTheme]}>
                <TouchableOpacity onPress={() => {
                    router.push({pathname: "(tabs)/Profile/more/leaderboard" });
                }}>
                    <Text style={styles.resourcesButtonText}>Leaderboard</Text>
                </TouchableOpacity>
                <MaterialIcons name="leaderboard" size={24} color={colorScheme === 'light' ? "white" : "black"} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
    },
    containerLight: {
        backgroundColor: 'white',
    },
    containerDark: {
        backgroundColor: '#1a1a1a',
    },
    lightEvent:{
        backgroundColor: '#134b91',
    },
    darkEvent: {
        backgroundColor: '#86ebba',
    },
    resourcesCard: {
        padding: 10,
        borderRadius: 10,
        width: '95%',
        alignSelf: 'center',
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: "center",
    },
    resourcesButtonText: {
        color: '#0a9bf5',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default MoreScreen;
