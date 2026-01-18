import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '@env';
import * as Progress from 'react-native-progress';
import { getAllUsersInfo } from '../../../components/allUsersManager';

const GREEK_ALPHABET = [
    "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", 
    "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi", "Rho", "Sigma", "Tau", 
    "Upsilon", "Phi", "Chi", "Psi", "Omega"
];

const PledgeToBrother = () => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState([]);
    const [undoData, setUndoData] = useState([]);
    const users = getAllUsersInfo();

    const handlePledgeToBrother = async () => {
        Alert.alert(
            "Are you sure?",
            "This will turn all current pledges to brothers. This action can be undone, but it is a major change.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "OK", onPress: () => proceedWithPledgeToBrother() }
            ]
        );
    };

    const proceedWithPledgeToBrother = async () => {
        setLoading(true);
        setProgress(0);
        setMessage('');
        setErrors([]);
        setUndoData([]);

        try {
            
            const pledges = users.filter(user => user.Position === 1 || user.Position === "1");

            if (pledges.length === 0) {
                setMessage("No pledges found to update.");
                setLoading(false);
                return;
            }

            // 3. Get current pledge class
            const brothers = users.filter(user => user.Position >= 2 && user.Position < 4);
            
            let latestClassIndex = -1;
            for (const brother of brothers) {
                const classIndex = GREEK_ALPHABET.indexOf(brother.Class);
                if (classIndex > latestClassIndex) {
                    latestClassIndex = classIndex;
                }
            }

            let currentPledgeClass = "Alpha"; // Default if no brothers or no valid class found
            if (latestClassIndex !== -1) {
                currentPledgeClass = GREEK_ALPHABET[latestClassIndex];
            }
            
            const nextPledgeClassIndex = (GREEK_ALPHABET.indexOf(currentPledgeClass) + 1) % GREEK_ALPHABET.length;
            const nextPledgeClass = GREEK_ALPHABET[nextPledgeClassIndex];
            
            // Store undo data
            const originalPledges = pledges.map(p => ({ id: p.id, Position: p.Position, Class: p.Class }));
            setUndoData(originalPledges);
            
            // 4. Update pledges
            const totalPledges = pledges.length;
            let pledgesUpdated = 0;
            const localErrors = [];

            for (const pledge of pledges) {
                try {
                    await axios.put(`${BACKEND_URL}/users/${pledge.id}`, {
                        Position: 2,
                        Class: nextPledgeClass
                    });
                    pledgesUpdated++;
                    setProgress(pledgesUpdated / totalPledges);
                } catch (err) {
                    localErrors.push(`Failed to update user ${pledge.id}: ${err.message}`);
                }
            }

            if (localErrors.length > 0) {
                setErrors(localErrors);
                setMessage("Some users could not be updated.");
            } else {
                setMessage(`Successfully updated ${pledgesUpdated} pledges to brothers with class ${nextPledgeClass}.`);
            }

        } catch (err) {
            setMessage("An error occurred.");
            setErrors([err.message]);
        } finally {
            setLoading(false);
        }
    };

    const handleUndo = async () => {
        if (undoData.length === 0) {
            Alert.alert("Nothing to undo.");
            return;
        }

        setLoading(true);
        setProgress(0);
        setMessage('');
        setErrors([]);

        try {
            const totalToUndo = undoData.length;
            let undone = 0;
            const localErrors = [];

            for (const user of undoData) {
                try {
                    await axios.put(`${BACKEND_URL}/users/${user.id}`, {
                        Position: user.Position,
                        Class: user.Class
                    });
                    undone++;
                    setProgress(undone / totalToUndo);
                } catch (err) {
                    localErrors.push(`Failed to undo user ${user.id}: ${err.message}`);
                }
            }

            if (localErrors.length > 0) {
                setErrors(localErrors);
                setMessage("Some users could not be reverted.");
            } else {
                setMessage(`Successfully reverted ${undone} users.`);
            }

        } catch (err) {
            setMessage("An error occurred during undo.");
            setErrors([err.message]);
        } finally {
            setLoading(false);
            setUndoData([]); // Clear undo data after attempting
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                style={[styles.roundButton, styles.redButton]} 
                onPress={handlePledgeToBrother}
                disabled={loading}
            >
                <Text style={styles.buttonText}>Pledge to Brother</Text>
            </TouchableOpacity>

            {loading && (
                <Progress.Bar progress={progress} width={null} style={styles.progress} />
            )}

            {message && <Text style={styles.message}>{message}</Text>}
            
            {errors.length > 0 && (
                <View style={styles.errorContainer}>
                    {errors.map((error, index) => (
                        <Text key={index} style={styles.errorText}>{error}</Text>
                    ))}
                </View>
            )}

            {undoData.length > 0 && !loading && (
                 <TouchableOpacity 
                    style={[styles.button, styles.greyButton]} 
                    onPress={handleUndo}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Undo</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1, // Use flex: 1 instead of flexGrow: 1
        alignItems: 'center',
        justifyContent: 'center', // Centered vertically
        backgroundColor: 'white', // Ensure background color is set
    },
    button: {
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        marginBottom: 20,
        width: '80%',
        alignItems: 'center',
    },
    redButton: {
        backgroundColor: 'red',
    },
    greyButton: {
        backgroundColor: 'grey',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        
    },
    progress: {
        width: '80%',
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
    },
    roundButton: {
        width: 150, // Fixed width for a circle
        height: 150, // Fixed height for a circle
        borderRadius: 75, // Half of width/height to make it round
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    }
});

export default PledgeToBrother;
