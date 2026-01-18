import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '@env';
import * as Progress from 'react-native-progress';
import { getAllUsersInfo } from '../../../components/allUsersManager';
import { useColorScheme } from 'react-native';

const DeleteRushees = () => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState([]);
    const users = getAllUsersInfo();
    const colorScheme = useColorScheme();

    // Updated to match the robust logic in index.tsx
    const getFileNameFromUrl = (url) => {
        try {
            if (!url) return null;

            const cleanUrl = url.split('?')[0];
            const decodedUrl = decodeURIComponent(cleanUrl);
            let storagePath = '';

            if (decodedUrl.includes('/o/')) {
                storagePath = decodedUrl.split('/o/')[1];
            } else if (decodedUrl.includes('storage.googleapis.com')) {
                const pathAfterDomain = decodedUrl.split('storage.googleapis.com/')[1];
                const firstSlashIndex = pathAfterDomain.indexOf('/');
                if (firstSlashIndex !== -1) {
                    storagePath = pathAfterDomain.substring(firstSlashIndex + 1);
                } else {
                    storagePath = pathAfterDomain;
                }
            } else {
                storagePath = decodedUrl;
            }

            // Return everything after the last slash
            const lastSlashIndex = storagePath.lastIndexOf('/');
            return lastSlashIndex !== -1 ? storagePath.substring(lastSlashIndex + 1) : storagePath;

        } catch (error) {
            console.error('Error parsing filename:', error);
            return null;
        }
    };

    const deletePhoto = async (fileUrl, folder) => {
        const filename = getFileNameFromUrl(fileUrl);
        
        if (!filename) {
            console.log("Could not extract filename from URL");
            return;
        }

        try {
            // Updated URL structure: /photo2/:filename?folder=...
            // Note: We encode the filename to handle spaces or special characters safely
            await axios.delete(`${BACKEND_URL}/photo2/${encodeURIComponent(filename)}`, {
                params: { folder: folder }
            });
        } catch (err) {
            // Log specific error but allow the loop to continue
            console.error(`Failed to delete photo ${filename} from ${folder}:`, err.response ? err.response.data : err.message);
        }
    };

    const handleDeleteRushees = async () => {
        Alert.alert(
            "Are you sure?",
            "This will permanently delete all rushees and their photos. This action CANNOT be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "OK", onPress: () => proceedWithDeletion() }
            ]
        );
    };

    const proceedWithDeletion = async () => {
        setLoading(true);
        setProgress(0);
        setMessage('');
        setErrors([]);

        try {
            // Filter for Position 0 (Rushees) - handling string or number format
            const rushees = users.filter(user => user.Position == 0 || user.Position === "0" || user.Position == 0.5 || user.Position === "0.5" );

            if (rushees.length === 0) {
                setMessage("No rushees found to delete.");
                setLoading(false);
                return;
            }

            const totalRushees = rushees.length;
            let rusheesDeleted = 0;
            const localErrors = [];

            for (const rushee of rushees) {
                try {
                    // Delete photos first
                    if (rushee.AppPhotoURL) {
                        // Ensure 'App Photos' matches the folder logic in appphotosRoute.js
                        await deletePhoto(rushee.AppPhotoURL, 'App Photos');
                    }

                    // Then delete the user
                    await axios.delete(`${BACKEND_URL}/users/${rushee.id}`);
                    
                    rusheesDeleted++;
                    setProgress(rusheesDeleted / totalRushees);
                } catch (err) {
                    localErrors.push(`Failed to delete user ${rushee.FirstName} ${rushee.LastName}: ${err.message}`);
                }
            }

            if (localErrors.length > 0) {
                setErrors(localErrors);
                setMessage(`Deleted ${rusheesDeleted} rushees with some errors.`);
            } else {
                setMessage(`Successfully deleted ${rusheesDeleted} rushees.`);
            }

        } catch (err) {
            setMessage("An error occurred during the deletion process.");
            setErrors([err.message]);
        } finally {
            setLoading(false);
        }
    };

    const containerTheme = colorScheme === 'light' ? styles.containerLight : styles.containerDark;

    return (
        <View style={[styles.container, containerTheme]}>
            <TouchableOpacity 
                style={[styles.roundButton, styles.redButton]} 
                onPress={handleDeleteRushees}
                disabled={loading}
            >
                <Text style={styles.buttonText}>Delete Rushees</Text>
            </TouchableOpacity>

            {loading && (
                <Progress.Bar progress={progress} width={200} style={styles.progress} color={'red'} />
            )}

            {message !== '' && <Text style={[styles.message, colorScheme === 'light' ? styles.textLight : styles.textDark]}>{message}</Text>}
            
            {errors.length > 0 && (
                <View style={styles.errorContainer}>
                    {errors.map((error, index) => (
                        <Text key={index} style={styles.errorText}>{error}</Text>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    containerLight: {
        backgroundColor: 'white',
    },
    containerDark: {
        backgroundColor: '#1a1a1a',
    },
    textLight: {
        color: 'black',
    },
    textDark: {
        color: 'white',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roundButton: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    redButton: {
        backgroundColor: 'red',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    progress: {
        marginBottom: 20,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    errorContainer: {
        marginTop: 10,
        width: '80%',
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        marginBottom: 5,
    }
});

export default DeleteRushees;