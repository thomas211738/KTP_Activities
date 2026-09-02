import React from 'react';
import { FlatList, Image, TouchableOpacity, Text, View, StyleSheet, Dimensions, useColorScheme } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = (SCREEN_WIDTH - 32 - 8) / 3; // 16px padding each side, 4px gap x2

export type Photo = {
  id: string;
  downloadURL: string;
  uploadedAt: string;
  uploadedBy?: string;
};

type Props = {
  photos: Photo[];
  onPhotoPress: (photo: Photo) => void;
};

const PhotoGrid = ({ photos, onPhotoPress }: Props) => {
  const isDark = useColorScheme() === 'dark';

  if (photos.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: isDark ? '#666' : '#aaa' }]}>
          No photos yet — be the first to add one!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={photos}
      keyExtractor={item => item.id}
      numColumns={3}
      scrollEnabled={false}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => onPhotoPress(item)}
          accessibilityRole="imagebutton"
          accessibilityLabel="Event photo"
          style={styles.cell}
          activeOpacity={0.85}
        >
          <Image
            source={{ uri: item.downloadURL }}
            style={styles.image}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 0 },
  row: { gap: 4, marginBottom: 4 },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderRadius: 8, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  empty: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});

export default PhotoGrid;
