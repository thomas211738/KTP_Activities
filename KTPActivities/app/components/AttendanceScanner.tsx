import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BACKEND_URL } from '@env';
import { auth } from '../firebaseConfig';

type Props = { visible: boolean; onClose: () => void; onCheckedIn: () => void };

export default function AttendanceScanner({ visible, onClose, onCheckedIn }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);

  const scan = async ({ data }: { data: string }) => {
    if (processing) return;
    setProcessing(true);
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error('Please sign in again before checking in.');
      await axios.post(`${BACKEND_URL}/attendance/check-in`, { payload: data }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Attendance recorded', 'You are checked in for this event.');
      onCheckedIn();
      onClose();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Unable to record attendance.';
      Alert.alert('Check-in unavailable', message);
      setProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.container}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={processing ? undefined : scan}
          />
        ) : (
          <View style={styles.permissionBox}>
            <Ionicons name="qr-code-outline" size={54} color="white" />
            <Text style={styles.permissionText}>Camera access is needed to scan attendance.</Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Allow Camera</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel="Close attendance scanner">
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Scan Attendance</Text>
          <View style={styles.closeButton} />
        </View>
        {permission?.granted && <View style={styles.guide}><View style={styles.guideCorner} /></View>}
        <Text style={styles.hint}>{processing ? 'Recording attendance…' : 'Center the event QR code in the frame'}</Text>
        {processing && <ActivityIndicator style={styles.spinner} color="white" size="large" />}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 18 },
  permissionText: { color: 'white', fontSize: 16, textAlign: 'center', lineHeight: 23 },
  permissionButton: { backgroundColor: '#86ebba', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 13 },
  permissionButtonText: { color: '#102016', fontSize: 16, fontWeight: '700' },
  topBar: { paddingTop: 60, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  title: { color: 'white', fontSize: 19, fontWeight: '700' },
  guide: { position: 'absolute', left: 42, right: 42, top: '31%', aspectRatio: 1, borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)', borderRadius: 22 },
  guideCorner: { flex: 1 },
  hint: { position: 'absolute', left: 28, right: 28, bottom: 100, color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  spinner: { position: 'absolute', bottom: 142, alignSelf: 'center' },
});
