import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  Dimensions, ActivityIndicator, Image, useColorScheme,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { BACKEND_URL } from '@env';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_H * 0.75;

type FlashModeType = FlashMode;
type State = 'idle' | 'capturing' | 'previewing' | 'uploading' | 'done';

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
  const isDark = useColorScheme() === 'dark';
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<State>('idle');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [flash, setFlash] = useState<FlashModeType>('off');
  const cameraRef = useRef<any>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;

  React.useEffect(() => {
    if (visible) {
      if (!permission?.granted) requestPermission();
      setState('idle');
      setCapturedUri(null);
      Animated.spring(slideAnim, { toValue: SCREEN_H - SHEET_HEIGHT, useNativeDriver: true, bounciness: 0 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  const cycleFlash = () => {
    setFlash(prev => prev === 'off' ? 'on' : prev === 'on' ? 'auto' : 'off');
  };

  const flashIcon = flash === 'on' ? 'flash' : flash === 'auto' ? 'flash-outline' : 'flash-off';

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      setState('capturing');
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      setCapturedUri(photo.uri);
      setState('previewing');
    } catch (e) { setState('idle'); }
  };

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setCapturedUri(result.assets[0].uri);
      setState('previewing');
    }
  };

  const confirmUpload = async () => {
    if (!capturedUri) return;
    setState('uploading');
    try {
      const formData = new FormData();
      formData.append('image', { uri: capturedUri, type: 'image/jpeg', name: 'photo.jpg' } as any);
      formData.append('eventId', eventId);
      formData.append('eventName', eventName);
      formData.append('eventDay', eventDay);
      formData.append('uploadedBy', uploadedBy);
      await axios.post(`${BACKEND_URL}/event-photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onPhotoUploaded();
      setState('done');
      setTimeout(() => { onClose(); setState('idle'); setCapturedUri(null); }, 300);
    } catch (e: any) {
      console.error('[CameraSheet] upload error:', e.message);
      setState('previewing');
    }
  };


  if (!visible) return null;

  const bgColor = isDark ? '#111' : '#000';
  const btnColor = 'rgba(255,255,255,0.15)';

  return (
    <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="close" size={26} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Photo</Text>
          <TouchableOpacity onPress={cycleFlash} style={styles.headerBtn}>
            <Ionicons name={flashIcon as any} size={26} color="white" />
          </TouchableOpacity>
        </View>

        {/* Camera / Preview area */}
        <View style={styles.cameraArea}>
          {state === 'previewing' || state === 'uploading' ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: capturedUri! }} style={styles.previewImage} resizeMode="contain" />
              {state === 'uploading' && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator size="large" color="white" />
                  <Text style={styles.uploadText}>Uploading...</Text>
                </View>
              )}
            </View>
          ) : permission?.granted ? (
            <View style={{ flex: 1 }}>
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="back"
                flash={flash}
              />
            </View>
          ) : (
            <View style={styles.permissionBox}>
              <Ionicons name="camera-outline" size={48} color="white" />
              <Text style={styles.permissionText}>Camera access required</Text>
              <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                <Text style={styles.permBtnText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {state === 'previewing' ? (
            <>
              <TouchableOpacity style={styles.retakeBtn} onPress={() => { setCapturedUri(null); setState('idle'); }}>
                <Text style={styles.retakeTxt}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.captureBtn} onPress={confirmUpload}>
                <Ionicons name="cloud-upload-outline" size={32} color="white" />
              </TouchableOpacity>
              <View style={{ width: 60 }} />
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.libraryBtn} onPress={pickFromLibrary}>
                <MaterialIcons name="photo-library" size={28} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.captureBtn, state === 'capturing' && styles.captureBtnDisabled]}
                onPress={takePicture}
                disabled={state === 'capturing'}
              >
                {state === 'capturing' ? <ActivityIndicator color="white" /> : <View style={styles.captureBtnInner} />}
              </TouchableOpacity>
              <View style={{ width: 60 }} />
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_HEIGHT, backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: '600' },
  cameraArea: { flex: 1, backgroundColor: '#000' },
  previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  previewImage: { width: '100%', height: '100%' },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  uploadText: { color: 'white', marginTop: 12, fontSize: 15 },
  permissionBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  permissionText: { color: 'white', fontSize: 15 },
  permBtn: { backgroundColor: '#134b91', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  permBtnText: { color: 'white', fontWeight: '600' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#111' },
  captureBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white' },
  captureBtnDisabled: { opacity: 0.5 },
  captureBtnInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'white' },
  libraryBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  retakeBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)' },
  retakeTxt: { color: 'white', fontWeight: '600', fontSize: 15 },
});

export default CameraSheet;
