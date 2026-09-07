import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Person = { userId: string; email: string; firstName: string; lastName: string };
type Props = { visible: boolean; present: Person[]; notCheckedIn: Person[]; onClose: () => void };

const nameFor = (person: Person) => `${person.firstName} ${person.lastName}`.trim() || person.email;

export default function AttendanceListModal({ visible, present, notCheckedIn, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}><Text style={styles.title}>Attendance</Text><TouchableOpacity onPress={onClose}><Ionicons name="close" size={27} color="#1a1a1a" /></TouchableOpacity></View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Present ({present.length})</Text>
          {present.length ? present.map(person => <View key={person.userId} style={styles.row}><Text style={styles.name}>{nameFor(person)}</Text><Text style={styles.email}>{person.email}</Text></View>) : <Text style={styles.empty}>No members have checked in yet.</Text>}
          <Text style={[styles.sectionTitle, styles.secondSection]}>Not checked in ({notCheckedIn.length})</Text>
          {notCheckedIn.map(person => <View key={person.userId} style={styles.row}><Text style={styles.name}>{nameFor(person)}</Text><Text style={styles.email}>{person.email}</Text></View>)}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 22, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ddd' }, title: { fontSize: 24, fontWeight: '800', color: '#1a1a1a' }, content: { padding: 20, paddingBottom: 45 }, sectionTitle: { fontSize: 18, fontWeight: '800', color: '#134b91', marginBottom: 9 }, secondSection: { marginTop: 28 }, row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e4e4e4' }, name: { color: '#1a1a1a', fontSize: 16, fontWeight: '600' }, email: { color: '#666', fontSize: 13, marginTop: 3 }, empty: { color: '#777', fontSize: 15 },
});
