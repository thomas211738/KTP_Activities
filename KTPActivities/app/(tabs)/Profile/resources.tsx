import React from "react";
import { Text, View, StyleSheet } from "react-native";

const Resources = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>HI</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    text: {
        textAlign: "center",
    },
});

export default Resources;
