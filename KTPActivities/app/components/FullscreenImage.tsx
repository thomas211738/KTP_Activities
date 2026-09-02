import React from 'react';
import { Modal, View, Image, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: W, height: H } = Dimensions.get('window');

type Props = {
  uri: string | null;
  visible: boolean;
  onClose: () => void;
};

const FullscreenImage = ({ uri, visible, onClose }: Props) => {
  if (!uri) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar hidden />
      <Pressable style={styles.overlay} onPress={onClose}>
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close photo"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: W * 0.9,
    height: H * 0.9,
  },
  closeBtn: {
    position: 'absolute',
    top: 52,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
});

export default FullscreenImage;
