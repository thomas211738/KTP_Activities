
import { Stack } from 'expo-router/stack';
import React, { useState } from 'react';
import { Pressable, Platform, useColorScheme } from 'react-native';
import { getUserInfo } from '../../components/userInfoManager';
import { Ionicons } from '@expo/vector-icons';
import AddAlertModal from '../../components/addAlertModal';
import axios from 'axios';
import { BACKEND_URL } from '@env';

export default function Layout() {
  const raw = getUserInfo() || {};
  const pos = Number(raw.Position ?? 0);
  const colorScheme = useColorScheme();

  const [addModalVisible, setAddModalVisible] = useState(false);

  const postAlert = async (alertName: string, alertDescription: string) => {
    try {
      await axios.post(`${BACKEND_URL}/alerts`, {
        "AlertName": alertName,
        "Description": alertDescription
      });
      setAddModalVisible(false);
    } catch (err) {
      console.error("Error posting alert:", err.response ? err.response.data : err.message);
    }
  }

  return (
    <>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerTitleStyle: {
              color: colorScheme === "light" ? "#1a1a1a" : "white",
            },
            headerRight: (pos === 3 || pos === 5) ? () => (
              <Pressable
                onPress={async () => 
                  setAddModalVisible(true)
                }
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  opacity: pressed ? 0.5 : 1,
                })}
              >
                <Ionicons name="add" size={35} color={colorScheme === "light" ? "#134b91" : "#86ebba"} />
              </Pressable>
            ) : undefined,
            headerStyle: {
              backgroundColor: colorScheme === "light" ? "white" : "#1a1a1a",
            },
            headerTitle: "Alerts",
            headerBlurEffect: "regular",
            ...(Platform.OS === "ios" && { headerTransparent: true }),
            headerLargeTitle: true,
            headerLargeTitleShadowVisible: false
          }}
        >
        </Stack.Screen>
      </Stack>
      {(pos === 3 || pos === 5) ? <AddAlertModal visible={addModalVisible} onCancel={() => setAddModalVisible(false)} onPost={postAlert} /> : ''}
    </>
  );
}
