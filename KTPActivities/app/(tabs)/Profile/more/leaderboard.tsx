
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, useColorScheme, Dimensions } from 'react-native';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { getAllUsersInfo } from '../../../components/allUsersManager';
import { FontAwesome5, Octicons } from '@expo/vector-icons';

const Leaderboard = () => {
    const colorScheme = useColorScheme();
    const isLight = colorScheme === 'light';
    
    // Theme helpers
    const containerTheme = isLight ? styles.containerLight : styles.containerDark;
    const textTheme = isLight ? styles.textDark : styles.textLight;
    const subTextTheme = { color: 'gray' };

    // 1. Get Data, Filter (>1), and Sort (High to Low)
    const sortedUsers = useMemo(() => {
        const users = getAllUsersInfo();
        return users
            .filter(user => (user.Clout || 0) > 1) // Only show if Clout > 1
            .sort((a, b) => (b.Clout || 0) - (a.Clout || 0));
    }, []);

    // 2. Split into Top 3 and Rest
    const topThree = sortedUsers.slice(0, 3);
    const restOfUsers = sortedUsers.slice(3);

    // Helper to handle navigation
    const handlePress = (user) => {
        router.push({ 
            pathname: 'profileId', 
            params: { userID: user.id, userImage: user.AppPhotoURL } 
        });
    };

    // Helper to render Avatar (reusing your existing logic)
    const RenderAvatar = ({ user, size }) => {
        if (user.ProfilePhoto && user.AppPhotoURL) {
            return (
                <Image
                    source={{ uri: user.AppPhotoURL }}
                    style={{ width: size, height: size, borderRadius: size / 2 }}
                />
            );
        }
        return (
            <Octicons 
                name="feed-person" 
                size={size} 
                color={isLight ? "#242424" : "white"} 
            />
        );
    };

    // Component for the Top 3 Podium
    const PodiumItem = ({ user, rank }) => {
        if (!user) return <View style={styles.podiumPlaceHolder} />;

        const isFirst = rank === 1;
        const size = isFirst ? 80 : 60; // 1st place is bigger
        const crownColor = rank === 1 ? '#FFD700' : (rank === 2 ? '#C0C0C0' : '#CD7F32'); // Gold, Silver, Bronze

        return (
            <TouchableOpacity onPress={() => handlePress(user)} style={[styles.podiumItem, isFirst && { marginTop: -20 }]}>
                {isFirst && <FontAwesome5 name="crown" size={24} color={crownColor} style={{ marginBottom: 5 }} />}
                <View style={[styles.avatarBorder, { borderColor: crownColor, borderWidth: isFirst ? 3 : 0 }]}>
                    <RenderAvatar user={user} size={size} />
                </View>
                <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{rank}</Text>
                </View>
                <Text numberOfLines={1} style={[styles.podiumName, textTheme]}>
                    {user.FirstName}
                </Text>
                <Text style={[styles.podiumScore, subTextTheme]}>{user.Clout} Views</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, containerTheme]}>
            <ScrollView contentInsetAdjustmentBehavior='automatic' contentContainerStyle={{ paddingBottom: 40 }}>
                
                {/* Header */}

                {/* Top 3 Podium View */}
                {sortedUsers.length > 0 ? (
                    <View style={styles.podiumContainer}>
                        {/* Arrange as 2nd, 1st, 3rd for visual balance */}
                        <PodiumItem user={topThree[1]} rank={2} />
                        <PodiumItem user={topThree[0]} rank={1} />
                        <PodiumItem user={topThree[2]} rank={3} />
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, textTheme]}>No views recorded yet.</Text>
                    </View>
                )}

                <View style={styles.divider} />

                {/* The Rest of the List (Rank 4+) */}
                {restOfUsers.map((user, index) => {
                    const realRank = index + 4;
                    return (
                        <TouchableOpacity 
                            key={user.id} 
                            style={styles.listItem} 
                            onPress={() => handlePress(user)}
                        >
                            <Text style={[styles.listRank, isLight ? { color: '#555' } : { color: '#888' }]}>
                                {realRank}
                            </Text>
                            
                            <View style={{ marginRight: 15 }}>
                                <RenderAvatar user={user} size={45} />
                            </View>

                            <View style={styles.listInfo}>
                                <Text style={[styles.listName, textTheme]}>
                                    {user.FirstName} {user.LastName}
                                </Text>
                                <Text style={styles.listMajor}>
                                    {Array.isArray(user.Major) ? user.Major[0] : user.Major}
                                </Text>
                            </View>

                            <View style={styles.scoreContainer}>
                                <Octicons name="eye" size={14} color="gray" style={{ marginRight: 4 }} />
                                <Text style={[styles.listScore, textTheme]}>{user.Clout}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    containerLight: { backgroundColor: 'white' },
    containerDark: { backgroundColor: '#1a1a1a' },
    textLight: { color: 'white' },
    textDark: { color: 'black' },
    
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
    },
    
    // Podium Styles
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'flex-end', // Aligns bottom of avatars
        marginBottom: 20,
        paddingHorizontal: 10,
        height: 180, 
    },
    podiumItem: {
        alignItems: 'center',
        width: Dimensions.get('window').width / 3.5,
    },
    podiumPlaceHolder: {
        width: Dimensions.get('window').width / 3.5,
    },
    avatarBorder: {
        padding: 3,
        borderRadius: 50,
    },
    rankBadge: {
        backgroundColor: '#333',
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 45, // Adjust based on avatar size
        right: 15,
        zIndex: 10,
        borderWidth: 1,
        borderColor: 'white'
    },
    rankText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    podiumName: {
        fontWeight: 'bold',
        fontSize: 14,
        marginTop: 5,
        textAlign: 'center',
    },
    podiumScore: {
        fontSize: 12,
        marginTop: 2,
    },

    divider: {
        height: 1,
        backgroundColor: '#ccc',
        marginHorizontal: 20,
        opacity: 0.3,
        marginBottom: 10,
    },

    // List Styles
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    listRank: {
        fontSize: 16,
        fontWeight: 'bold',
        width: 30,
        textAlign: 'center',
        marginRight: 10,
    },
    listInfo: {
        flex: 1,
    },
    listName: {
        fontSize: 16,
        fontWeight: '600',
    },
    listMajor: {
        fontSize: 12,
        color: 'gray',
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(128,128,128,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    listScore: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 100,
    },
    emptyText: {
        fontSize: 16,
        fontStyle: 'italic',
        opacity: 0.7
    }
});

export default Leaderboard;