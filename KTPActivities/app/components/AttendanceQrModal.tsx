import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';

type Props = { visible: boolean; eventName: string; payload: string; onClose: () => void };

export default function AttendanceQrModal({ visible, eventName, payload, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.close} onPress={onClose} accessibilityLabel="Close attendance QR code">
          <Ionicons name="close" size={25} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.eyebrow}>ATTENDANCE IS OPEN</Text>
        <Text style={styles.title}>{eventName}</Text>
        <Text style={styles.instructions}>Scan this code in the KTP Activities app to check in.</Text>
        <View style={styles.qrCard}><QRCode value={payload} size={250} /></View>
        <Text style={styles.note}>This QR remains active until an Eboard member ends attendance.</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#fff' },
  close: { position: 'absolute', top: 26, right: 22, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' },
  eyebrow: { color: '#134b91', fontWeight: '800', letterSpacing: 1.2, fontSize: 12, marginBottom: 12 },
  title: { color: '#1a1a1a', fontSize: 25, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  instructions: { color: '#555', fontSize: 16, textAlign: 'center', lineHeight: 23, marginBottom: 30 },
  qrCard: { backgroundColor: 'white', padding: 18, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 14, elevation: 4 },
  note: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 28 },
});
