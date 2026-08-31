import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EventCard = ({ event }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{event.Name}</Text>
      <Text style={styles.date}>
        {event.Day} • {event.Time}
      </Text>
      {event.Location && (
        <Text style={styles.location}>{event.Location}</Text>
      )}
      {event.Description && (
        <Text style={styles.description} numberOfLines={2}>
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
    position: 'relative',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  content: {
    paddingRight: 40, // Space for delete button
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  date: {
    fontSize: 15,
    color: '#444',
    marginBottom: 6,
  },
  location: {
    fontSize: 15,
    color: '#444',
    marginBottom: 6,
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  detailText: {
    fontSize: 15,
    color: '#444',
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 4,
  },
  pillContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  pill: {
    backgroundColor: '#0066ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  pillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
});

export default EventCard;
