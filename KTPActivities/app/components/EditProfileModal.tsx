import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { MultiSelect } from 'react-native-element-dropdown';
import axios from 'axios';
import { BACKEND_URL } from '@env';
import colleges from './buinfo';
import { accountHeaders } from './auth';
import { auth } from '../firebaseConfig';
import { getUserInfo, setUserInfo } from './userInfoManager';
import { getAllUsersInfo, setAllUsersInfo } from './allUsersManager';

export default function EditProfileModal({ visible, user, onClose }) {
  const dark = useColorScheme() === 'dark';
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [memberClass, setMemberClass] = useState('');
  const [year, setYear] = useState('');
  const [major, setMajor] = useState('');
  const [minor, setMinor] = useState('');
  const [selectedColleges, setColleges] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const savingRef = React.useRef(false);
  useEffect(() => {
    if (!visible) return;
    setFirst(user.FirstName || ''); setLast(user.LastName || '');
    setMemberClass(user.Class || '');
    setYear(String(user.GradYear || ''));
    setMajor((user.Major || []).join(', ')); setMinor((user.Minor || []).join(', '));
    setColleges(user.Colleges || []);
  }, [visible]);
  const text = { color: dark ? '#f5f5f5' : '#222' };
  const inputStyle = [styles.input, text, { backgroundColor: dark ? '#303030' : '#f3f5f8', borderColor: dark ? '#666' : '#ccd2da' }];
  const save = async () => {
    if (savingRef.current) return;
    if (!first.trim() || !last.trim()) { Alert.alert('Add your name', 'Please enter your first and last name.'); return; }
    if (year.trim() && !/^(19|20|21)\d{2}$/.test(year.trim())) { Alert.alert('Check graduation year', 'Enter a four-digit year, or leave it blank.'); return; }
    savingRef.current = true; setSaving(true);
    const signedInUser = auth.currentUser;
    try {
      const list = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean);
      const response = await axios.patch(`${BACKEND_URL}/account/profile`, {
        FirstName: first.trim(), LastName: last.trim(), Class: memberClass.trim(), GradYear: year.trim(),
        Colleges: selectedColleges, Major: list(major), Minor: list(minor),
      }, { headers: await accountHeaders(), timeout: 15000 });
      if (auth.currentUser !== signedInUser || getUserInfo()?.id !== user.id) return;
      const updated = response.data.user;
      setUserInfo(updated);
      const people = getAllUsersInfo() || [];
      setAllUsersInfo([...people.filter(person => person.id !== updated.id), updated]);
      onClose();
    } catch (error: any) {
      Alert.alert('Profile not saved', error?.response?.data?.message || 'Please check your connection and try again. Your edits are still here.');
    } finally { savingRef.current = false; setSaving(false); }
  };
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { if (!saving) onClose(); }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? '#1a1a1a' : '#fff' }}>
      <View style={styles.header}>
        <Text style={[styles.title, text]}>Edit Profile</Text>
        <TouchableOpacity accessibilityRole="button" onPress={onClose} disabled={saving} style={styles.close}><Text style={{ color: dark ? '#86ebba' : '#134b91' }}>Cancel</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content} automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled">
        <Text style={[styles.hint, text]}>Help other members get to know you. Academic details are optional and can be updated anytime.</Text>
        <Text style={[styles.label, text]}>BU email</Text><Text style={[styles.hint, text]}>{user.BUEmail}</Text>
        <Text style={[styles.label, text]}>First name</Text>
        <TextInput accessibilityLabel="First name" style={inputStyle} value={first} onChangeText={setFirst} editable={!saving} autoCapitalize="words" textContentType="givenName" maxLength={100} />
        <Text style={[styles.label, text]}>Last name</Text>
        <TextInput accessibilityLabel="Last name" style={inputStyle} value={last} onChangeText={setLast} editable={!saving} autoCapitalize="words" textContentType="familyName" maxLength={100} />
        <Text style={[styles.label, text]}>Class · optional</Text>
        <TextInput accessibilityLabel="Class" style={inputStyle} value={memberClass} onChangeText={setMemberClass} editable={!saving} autoCapitalize="words" autoCorrect={false} placeholder="e.g. Zeta or Alpha" placeholderTextColor={dark ? '#aaa' : '#666'} maxLength={100} />
        <Text style={[styles.label, text]}>College(s) · optional</Text>
        <MultiSelect style={[styles.input, { backgroundColor: dark ? '#303030' : '#f3f5f8', borderColor: dark ? '#666' : '#ccd2da' }]} disable={saving} data={colleges} labelField="label" valueField="value" value={selectedColleges} onChange={setColleges}
          placeholder="Select your colleges" placeholderStyle={text} selectedTextStyle={text} maxHeight={260} />
        <Text style={[styles.label, text]}>Major(s) · optional</Text>
        <TextInput accessibilityLabel="Majors" style={inputStyle} value={major} onChangeText={setMajor} editable={!saving} placeholder="e.g. Computer Science, Economics" placeholderTextColor={dark ? '#aaa' : '#666'} maxLength={500} />
        <Text style={[styles.label, text]}>Minor(s) · optional</Text>
        <TextInput accessibilityLabel="Minors" style={inputStyle} value={minor} onChangeText={setMinor} editable={!saving} placeholder="Separate multiple minors with commas" placeholderTextColor={dark ? '#aaa' : '#666'} maxLength={500} />
        <Text style={[styles.label, text]}>Graduation year · optional</Text>
        <TextInput accessibilityLabel="Graduation year" style={inputStyle} value={year} onChangeText={setYear} editable={!saving} keyboardType="number-pad" placeholder="e.g. 2030" placeholderTextColor={dark ? '#aaa' : '#666'} maxLength={4} />
        <TouchableOpacity accessibilityRole="button" style={[styles.save, saving && { opacity: 0.65 }]} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Profile</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '700' }, close: { padding: 12 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  label: { fontWeight: '600', fontSize: 15, marginTop: 18, marginBottom: 8 },
  hint: { fontSize: 15, lineHeight: 22 },
  input: { minHeight: 48, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderRadius: 10, fontSize: 16 },
  save: { backgroundColor: '#134b91', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 26, minHeight: 50 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
