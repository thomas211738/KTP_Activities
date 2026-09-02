import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  Dimensions, ActivityIndicator, Image, PanResponder,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { FlashMode } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BACKEND_URL } from '@env';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_H * 0.82;

type FlashModeType = FlashMode;
type State = 'idle' | 'capturing' | 'uploading';

type Props = {
  visible: boolean;
  eventId: string;
  eventName: string;
  eventDay: string;
  uploadedBy: string;
  onClose: () => void;
  onPhotoUploaded: () => void;
};

const CameraSheet = ({ visible, eventId, eventName, eventDay, uploadedBy, onClose, onPhotoUploaded }: Props) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<State>('idle');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [flash, setFlash] = useState<FlashModeType>('off');
  const cameraRef = useRef<any>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const previewOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 10 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) slideAnim.setValue(SCREEN_H - SHEET_HEIGHT + g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 200, useNativeDriver: true }).start(() => onClose());
        } else {
          Animated.spring(slideAnim, { toValue: SCREEN_H - SHEET_HEIGHT, useNativeDriver: true, bounciness: 0 }).start();
        }
      },
    })
  ).current;

  React.useEffect(() => {
    if (visible) {
      if (!permission?.granted) requestPermission();
      setState('idle');
      setCapturedUri(null);
      previewOpacity.setValue(0);
      Animated.spring(slideAnim, { toValue: SCREEN_H - SHEET_HEIGHT, useNativeDriver: true, bounciness: 0 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  const cycleFlash = () => setFlash(prev => prev === 'off' ? 'on' : prev === 'on' ? 'auto' : 'off');
  const flashIcon = flash === 'on' ? 'flash' : flash === 'auto' ? 'flash-outline' : 'flash-off';

  const takePicture = async () => {
    if (!cameraRef.current || state !== 'idle') return;
    try {
      setState('capturing');
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      const uri = photo.uri;
      setCapturedUri(uri);
      setState('idle');
      previewOpacity.setValue(1);
      setTimeout(() => {
        Animated.timing(previewOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          setCapturedUri(null);
          doUpload(uri);
        });
      }, 700);
    } catch (e) { setState('idle'); }
  };

  const doUpload = async (uri: string) => {
    setState('uploading');
    try {
      const formData = new FormData();
      formData.append('image', { uri, type: 'image/jpeg', name: 'photo.jpg' } as any);
      formData.append('eventId', eventId);
      formData.append('eventName', eventName);
      formData.append('eventDay', eventDay);
      formData.append('uploadedBy', uploadedBy);
      await axios.post(`${BACKEND_URL}/event-photos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onPhotoUploaded();
    } catch (e: any) {
      console.error('[CameraSheet] upload error:', e.message);
    } finally { setState('idle'); }
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]} {...panResponder.panHandlers}>
      <View style={styles.dragHandle} />
      <View style={styles.cameraArea}>
        {permission?.granted ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" flash={flash} />
        ) : (
          <View style={styles.permissionBox}>
            <Ionicons name="camera-off-outline" size={48} color="white" />
            <Text style={styles.permissionText}>Camera permission required</Text>
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
              <Text style={styles.permBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        )}
        {capturedUri && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: previewOpacity }]}>
            <Image source={{ uri: capturedUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </Animated.View>
        )}
        <TouchableOpacity style={styles.flashBtn} onPress={cycleFlash}>
          <Ionicons name={flashIcon as any} size={22} color="white" />
        </TouchableOpacity>
        {state === 'uploading' && (
          <View style={styles.uploadingIndicator}>
            <ActivityIndicator color="white" size="small" />
          </View>
        )}
        <View style={styles.captureArea}>
          <TouchableOpacity
            style={[styles.captureBtn, state === 'capturing' && styles.captureBtnDisabled]}
            onPress={takePicture}
            disabled={state !== 'idle'}
          >
            {state === 'capturing'
              ? <ActivityIndicator color="white" size="small" />
              : <View style={styles.captureBtnInner} />}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  dragHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginTop: 10,
    marginBottom: 4,
  },
  cameraArea: { flex: 1, backgroundColor: '#000' },
  flashBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureArea: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: 'white',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnDisabled: { opacity: 0.4 },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  permissionBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  permissionText: { color: 'white', fontSize: 15 },
  permBtn: { backgroundColor: '#134b91', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  permBtnText: { color: 'white', fontWeight: '600' },
});

export default CameraSheet;
