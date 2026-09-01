import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Event = {
  id: string;
  Name: string;
  Day?: string;
  Time?: string;
  Location?: string;
  Description?: string;
  Position?: number;
};

type Props = {
  event: Event;
  isEboard?: boolean;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
};

const EventCard = ({ event, isEboard = false, onEdit, onDelete }: Props) => {
  const isDark = useColorScheme() === 'dark';

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.Name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(event) },
      ]
    );
  };

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5',
        borderColor:     isDark ? '#2e2e2e' : '#e0e0e0',
        shadowColor:     isDark ? '#000'    : '#888',
      }
    ]}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: isDark ? '#f0f0f0' : '#1a1a1a' }, isEboard && styles.titleWithActions]} numberOfLines={2}>
          {event.Name}
        </Text>
        {isEboard && (
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => onEdit?.(event)} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}>
              <Ionicons name="pencil" size={17} color={isDark ? '#86ebba' : '#134b91'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}>
              <Ionicons name="trash-outline" size={17} color="#cc3333" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={[styles.date, { color: isDark ? '#aaa' : '#444' }]}>
        {event.Day} • {event.Time}
      </Text>
      {!!event.Location && (
        <Text style={[styles.location, { color: isDark ? '#999' : '#555' }]}>📍 {event.Location}</Text>
      )}
      {!!event.Description && (
        <Text style={[styles.description, { color: isDark ? '#888' : '#666' }]} numberOfLines={3}>
          {event.Description}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  titleWithActions: {
    paddingRight: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    padding: 4,
  },
  date: {
    fontSize: 15,
    marginBottom: 6,
  },
  location: {
    fontSize: 14,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  content: { paddingRight: 40 },
  details: { marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  detailText: { fontSize: 15, flex: 1 },
  pillContainer: { position: 'absolute', bottom: 16, right: 16 },
  pill: { backgroundColor: '#0066ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, minWidth: 70, alignItems: 'center' },
  pillText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  deleteButton: { position: 'absolute', top: 16, right: 16, padding: 4 },
});

export default EventCard;
