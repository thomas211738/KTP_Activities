import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, SafeAreaView, Text } from 'react-native';
import Story1 from './story1';
import Story2 from './story2';
import Story3 from './story3';
import Story4 from './story4';
import Story5 from './story5';
import Story6 from './story6';

const stories = [
  { component: Story1 },
  { component: Story2 },
  { component: Story3 },
  { component: Story4 },
  { component: Story5 },
  { component: Story6 },
];

const STORY_DURATION = 10000; // 10 seconds

const WrappedStories = ({ onClose }) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        nextStory();
      }
    });

    return () => animation.stop();
  }, [currentStoryIndex]);

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      onClose();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const CurrentStoryComponent = stories[currentStoryIndex].component;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressBarContainer}>
        {stories.map((_, index) => {
          const width = progress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
            extrapolate: 'clamp',
          });

          return (
            <View key={index} style={styles.progressBarBackground}>
              {index < currentStoryIndex && <View style={styles.progressBarFill} />}
              {index === currentStoryIndex && <Animated.View style={[styles.progressBarFill, { width }]} />}
            </View>
          );
        })}
      </View>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>
      <CurrentStoryComponent />
      <View style={styles.navigationContainer}>
        <TouchableOpacity style={styles.navButton} onPress={prevStory} />
        <TouchableOpacity style={styles.navButton} onPress={nextStory} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 2,
    borderRadius: 1.5,
  },
  progressBarFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    borderRadius: 1.5,
  },
  navigationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  navButton: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 20,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default WrappedStories;
