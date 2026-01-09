import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

// A component for the twinkling stars background
const StarsBackground = () => {
  const stars = useRef(
    [...Array(150)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      duration: 500 + Math.random() * 1500,
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const animations = stars.map(star =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(star.opacity, {
            toValue: 1,
            duration: star.duration,
            useNativeDriver: true,
          }),
          Animated.timing(star.opacity, {
            toValue: 0.2,
            duration: star.duration,
            useNativeDriver: true,
          }),
        ])
      )
    );
    Animated.parallel(animations).start();
  }, [stars]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {stars.map((star, index) => (
        <Animated.View
          key={index}
          style={[
            styles.star,
            {
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              opacity: star.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};


const Story6 = () => {
  const text1Opacity = useRef(new Animated.Value(0)).current;
  const text1TranslateY = useRef(new Animated.Value(20)).current;
  const text2Opacity = useRef(new Animated.Value(0)).current;
  const text2Scale = useRef(new Animated.Value(0.5)).current;
  const text3Opacity = useRef(new Animated.Value(0)).current;
  const text3TranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(text1Opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(text1TranslateY, {
          toValue: 0,
          speed: 12,
          bounciness: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(text2Opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(text2Scale, {
          toValue: 1,
          speed: 10,
          bounciness: 10,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(text3Opacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
         Animated.spring(text3TranslateY, {
          toValue: 0,
          speed: 12,
          bounciness: 8,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start();
    return () => animation.stop();
  }, [text1Opacity, text1TranslateY, text2Opacity, text2Scale, text3Opacity, text3TranslateY]);

  return (
    <View style={styles.container}>
      <StarsBackground />
      <View style={styles.textContainer}>
        <Animated.Text
          style={[
            styles.text,
            { opacity: text1Opacity, transform: [{ translateY: text1TranslateY }] },
          ]}
        >
          Thank you for tuning into
        </Animated.Text>
        <Animated.Text
          style={[
            styles.wrappedText,
            { opacity: text2Opacity, transform: [{ scale: text2Scale }] },
          ]}
        >
          KTP WRAPPED 2025
        </Animated.Text>
        <Animated.Text
          style={[
            styles.text,
            styles.footerText,
            { opacity: text3Opacity, transform: [{ translateY: text3TranslateY }] },
          ]}
        >
          See you next year!
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d', // Dark space color
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  star: {
    backgroundColor: 'white',
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    color: '#e0e0e0',
    fontSize: 22,
    textAlign: 'center',
  },
  wrappedText: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  footerText: {
    fontSize: 18,
    marginTop: 30,
  },
});

export default Story6;