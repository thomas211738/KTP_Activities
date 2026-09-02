import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getUserInfo } from '../../components/userInfoManager';
import PhotoGrid, { Photo } from '../../components/PhotoGrid';
import FullscreenImage from '../../components/FullscreenImage';
import CameraSheet from '../../components/CameraSheet';

export default function EventDetail() {
  const isDark = useColorScheme() === 'dark';
  const params = useLocalSearchParams();
  const eventId       = params.eventId as string || '';
  const eventName     = params.eventName as string || 'Event';
  const eventDay      = params.eventDay as string || '';
  const eventTime     = params.eventTime as string || '';
  const eventLocation = params.eventLocation as string || '';
  const eventDesc     = params.eventDescription as string || '';

  const rawUser: any = getUserInfo() || {};
  const userId = rawUser.id || '';

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [fullscreenUri, setFullscreenUri] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photosLoading, setPhotosLoading] = useState(true);

  // Real-time photo subscription via Firestore onSnapshot
  useEffect(() => {
    if (!eventId || !db) {
      setPhotosLoading(false);
      return;
    }
    const q = query(
      collection(db, 'eventPhotos', eventId, 'photos'),
      orderBy('uploadedAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Photo[]);
      setPhotosLoading(false);
    }, err => {
      console.error('[eventDetail] onSnapshot error:', err);
      setPhotosLoading(false);
    });
    return unsub;
  }, [eventId]);
const bg = isDark ? '#1a1a1a' : '#fff';
  const textColor = isDark ? '#f0f0f0' : '#1a1a1a';
  const subColor = isDark ? '#aaa' : '#555';

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: bg }} contentInsetAdjustmentBehavior="automatic">
        {/* Event metadata card */}
        <View style={[styles.metaCard, { backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5', borderColor: isDark ? '#2e2e2e' : '#e0e0e0' }]}>
          <Text style={[styles.metaTitle, { color: textColor }]}>{eventName}</Text>
          {!!eventDay && <Text style={[styles.metaRow, { color: subColor }]}>\U0001F4C5 {eventDay}{eventTime ? ' \u2022 ' + eventTime : ''}</Text>}
          {!!eventLocation && <Text style={[styles.metaRow, { color: subColor }]}>\U0001F4CD {eventLocation}</Text>}
          {!!eventDesc && <Text style={[styles.metaDesc, { color: isDark ? '#ccc' : '#444' }]}>{eventDesc}</Text>}
        </View>

        {/* Photos section header */}
        <View style={styles.photosHeader}>
          <Text style={[styles.photosTitle, { color: textColor }]}>Photos{photos.length > 0 ? ` (${photos.length})` : ''}</Text>
          <TouchableOpacity
            style={[styles.addPhotoBtn, { backgroundColor: isDark ? '#86ebba' : '#134b91' }]}
            onPress={() => setCameraOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Add photo"
          >
            <Ionicons name="camera" size={20} color={isDark ? '#000' : '#fff'} />
            <Text style={[styles.addPhotoBtnText, { color: isDark ? '#000' : '#fff' }]}>Add Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Photo grid */}
        {photosLoading ? (
          <ActivityIndicator style={{ marginVertical: 32 }} color={isDark ? '#86ebba' : '#134b91'} />
        ) : (
          <PhotoGrid photos={photos} onPhotoPress={p => setFullscreenUri(p.downloadURL)} />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Fullscreen image viewer */}
      <FullscreenImage
        uri={fullscreenUri}
        visible={!!fullscreenUri}
        onClose={() => setFullscreenUri(null)}
      />

      {/* Camera sheet */}
      {cameraOpen && (
        <CameraSheet
          visible={cameraOpen}
          eventId={eventId}
          eventName={eventName}
          eventDay={eventDay}
          uploadedBy={userId}
          onClose={() => setCameraOpen(false)}
          onPhotoUploaded={() => { setCameraOpen(false); }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  metaCard: { margin: 16, borderRadius: 16, padding: 18, borderWidth: 1 },
  metaTitle: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  metaRow: { fontSize: 14, marginBottom: 5 },
  metaDesc: { fontSize: 14, lineHeight: 20, marginTop: 8 },
  photosHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 8, marginBottom: 4 },
  photosTitle: { fontSize: 18, fontWeight: '600' },
  addPhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addPhotoBtnText: { fontSize: 14, fontWeight: '600' },
});
