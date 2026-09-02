import axios from 'axios';
import React from 'react';
import { Alert, ScrollView, View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '@env';
import EditAlertModal from '../../components/editAlertModal';
import { getUserInfo } from '../../components/userInfoManager';
import AlertsLoader from '../../components/loaders/alertsLoader';

type AlertItem = { id: string; AlertName: string; Description: string; updatedAt: string; expireAt?: string; Position: number; };
type AlertCardProps = { alert: AlertItem; isEboard: boolean; onEdit: () => void; onDelete: () => void; };

const AlertCard = ({ alert, isEboard, onEdit, onDelete }: AlertCardProps) => {
  const isDark = useColorScheme() === 'dark';
  const formattedTime = (() => {
    try { return format(parseISO(alert.updatedAt), 'MMM d, yyyy • h:mm a'); } catch { return alert.updatedAt || ''; }
  })();
  const handleDelete = () => Alert.alert('Delete Alert', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: onDelete }]);
  return (
    <View style={[cardStyles.card, { backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5', borderColor: isDark ? '#2e2e2e' : '#e0e0e0', shadowColor: isDark ? '#000' : '#888' }]}>
      <View style={cardStyles.titleRow}>
        <Text style={[cardStyles.title, { color: isDark ? '#f0f0f0' : '#1a1a1a' }, isEboard && cardStyles.titleWithActions]} numberOfLines={2}>{alert.AlertName}</Text>
        {isEboard && (<View style={cardStyles.actions}>
          <TouchableOpacity onPress={onEdit} style={cardStyles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }} accessibilityRole='button' accessibilityLabel='Edit alert'>
            <Ionicons name='pencil' size={17} color={isDark ? '#86ebba' : '#134b91'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={cardStyles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }} accessibilityRole='button' accessibilityLabel='Delete alert'>
            <Ionicons name='trash-outline' size={17} color='#cc3333' />
          </TouchableOpacity>
        </View>)}
      </View>
      <Text style={[cardStyles.description, { color: isDark ? '#ccc' : '#444' }]}>{alert.Description}</Text>
      <Text style={[cardStyles.time, { color: isDark ? '#666' : '#999' }]}>{formattedTime}</Text>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: { borderRadius: 16, marginHorizontal: 16, marginVertical: 8, padding: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3, borderWidth: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 18, fontWeight: '600', flex: 1 },
  titleWithActions: { paddingRight: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtn: { padding: 4 },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 10 },
  time: { fontSize: 12, textAlign: 'right' },
});

const index = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertItem | null>(null);
  const [loading, setLoading] = useState(true);
  const rawUser: any = getUserInfo() || {};
  const userPos = Number(rawUser.Position ?? 0);
  const isDark = useColorScheme() === 'dark';
  const isEboard = userPos === 3 || userPos === 5;

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/alerts`, { params: { position: userPos } });
      const now = new Date().toISOString();
      // Only show alerts that have a valid expireAt in the future.
      // Legacy docs without expireAt are treated as expired and filtered out.
      const allAlerts: AlertItem[] = (response.data.data || []).filter(
        (a: AlertItem) => a.expireAt && a.expireAt > now
      );
      setAlerts(allAlerts);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching alerts:', err.response ? err.response.data : err.message);
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const confirmDeleteAlert = async (alertId: string, position: number) => {
    try {
      await axios.delete(`${BACKEND_URL}/alerts/${position}/${alertId}`);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err: any) {
      Alert.alert('Error', 'Failed to delete alert.');
    }
  };

  const handleEditSave = async (alertName: string, description: string) => {
    if (!editingAlert) return;
    try {
      await axios.put(`${BACKEND_URL}/alerts/${editingAlert.Position}/${editingAlert.id}`, { AlertName: alertName, Description: description });
      setEditModalVisible(false); setEditingAlert(null); fetchAlerts();
    } catch (err: any) { console.error('Edit alert error:', err.message); }
  };

  const groupByDate = (items: AlertItem[]): Record<string, AlertItem[]> => {
    const groups: Record<string, AlertItem[]> = {};
    items.forEach(a => {
      let dateKey = 'Unknown Date';
      try { dateKey = format(parseISO(a.updatedAt), 'MMMM d, yyyy'); } catch {}
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(a);
    });
    return groups;
  };
  const grouped = groupByDate(alerts);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#fff' }} contentInsetAdjustmentBehavior='automatic'>
      {loading ? (<AlertsLoader />) : alerts.length === 0 ? (
        <View style={styles.emptyContainer}><Text style={[styles.emptyText, { color: isDark ? '#888' : '#666' }]}>No alerts at this time</Text></View>
      ) : (
        Object.entries(grouped).map(([date, dayAlerts]) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={[styles.dateHeader, { backgroundColor: isDark ? '#252525' : '#f0f0f0', color: isDark ? '#d0d0d0' : '#333' }]}>{date}</Text>
            {dayAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} isEboard={isEboard}
                onEdit={() => { setEditingAlert(alert); setEditModalVisible(true); }}
                onDelete={() => confirmDeleteAlert(alert.id, alert.Position)} />
            ))}
          </View>
        ))
      )}
      {editingAlert && (<EditAlertModal visible={editModalVisible} alertName={editingAlert.AlertName} description={editingAlert.Description}
        onCancel={() => { setEditModalVisible(false); setEditingAlert(null); }} onSave={handleEditSave} />)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  dateGroup: { marginBottom: 24 },
  dateHeader: { fontSize: 15, fontWeight: '700', paddingHorizontal: 16, paddingVertical: 8, marginBottom: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 18, textAlign: 'center' },
});

export default index;
