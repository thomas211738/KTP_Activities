import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
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
    <View style={styles.card}>
      {/* Title row with action buttons for Eboard */}
      <View style={styles.titleRow}>
        <Text style={[styles.title, isEboard && styles.titleWithActions]} numberOfLines={2}>
          {event.Name}
        </Text>
        {isEboard && (
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => onEdit?.(event)} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}>
              <Ionicons name="pencil" size={17} color="#134b91" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}>
              <Ionicons name="trash-outline" size={17} color="#cc3333" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.date}>
        {event.Day} • {event.Time}
      </Text>
      {!!event.Location && (
        <Text style={styles.location}>📍 {event.Location}</Text>
      )}
      {!!event.Description && (
        <Text style={styles.description} numberOfLines={3}>
          {event.Description}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
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
    color: '#1a1a1a',
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
    color: '#444',
    marginBottom: 6,
  },
  location: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 4,
  },
  // kept for legacy style keys (unused but prevents TS errors if referenced elsewhere)
  content: { paddingRight: 40 },
  details: { marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  detailText: { fontSize: 15, color: '#444', flex: 1 },
  pillContainer: { position: 'absolute', bottom: 16, right: 16 },
  pill: { backgroundColor: '#0066ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, minWidth: 70, alignItems: 'center' },
  pillText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  deleteButton: { position: 'absolute', top: 16, right: 16, padding: 4 },
});

export default EventCard;

