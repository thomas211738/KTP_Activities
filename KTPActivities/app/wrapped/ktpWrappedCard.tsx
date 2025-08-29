import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import WrappedStories from './WrappedStories';

const { width } = Dimensions.get('window');

const Comet = ({ opacity, transform }) => {
    const trailColors = [
        '#00ffff',
        '#00dfff',
        '#00bfff',
        '#009fff',
        '#007fff',
    ];

    return (
        <Animated.View
            style={[
                styles.cometContainer,
                {
                    opacity: opacity,
                    transform: transform,
                },
            ]}
        >
            {trailColors.map((color, index) => (
                <View
                    key={index}
                    style={{
                        width: 100 - index * 15,
                        height: 2,
                        backgroundColor: color,
                        borderRadius: 1,
                        opacity: 1 - index * 0.15,
                    }}
                />
            ))}
        </Animated.View>
    );
};

const KTPWrappedCard = () => {
  const [showStories, setShowStories] = useState(false);
  const numStars = 10;
  const numBgStars = 30;
  const numColumns = 5;
  const numBgColumns = 15;

  const starAnimations = useRef([...Array(numStars)].map(() => new Animated.Value(0))).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const cometAnimation = useRef(new Animated.Value(0)).current;

  const createStarPositions = (count, columns) => {
    const cellWidth = width / columns;
    return [...Array(count)].map((_, index) => {
        const isTopSection = index < count / 2;
        const columnIndex = index % (count / 2);

        const left = columnIndex * cellWidth + Math.random() * cellWidth;
        const top = isTopSection
            ? Math.random() * 80
            : Math.random() * 80 + 170;

        return {
            left: left,
            top: top,
            size: 12 + Math.random() * 8,
        };
    });
  };

  const createBgStarPositions = (count, columns) => {
    const cellWidth = width / columns;
    return [...Array(count)].map((_, index) => {
        const isTopSection = index < count / 2;
        const columnIndex = index % (count / 2);

        const left = columnIndex * cellWidth + Math.random() * cellWidth;
        const top = isTopSection
            ? Math.random() * 80
            : Math.random() * 80 + 170;

        return {
            left: left,
            top: top,
            size: 2 + Math.random() * 2,
        };
    });
  };

  const [starPositions, setStarPositions] = useState(createStarPositions(numStars, numColumns));
  const [bgStarPositions] = useState(createBgStarPositions(numBgStars, numBgColumns));

  const [cometConfig, setCometConfig] = useState({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    angle: 0,
  });

  useEffect(() => {
    // Animate stars twinkling
    const animateStars = () => {
        const cellWidth = width / numColumns;
        starAnimations.forEach((star, index) => {
            const runAnimation = () => {
                star.setValue(0);
                setStarPositions(prev => {
                    const newPositions = [...prev];
                    const isTopSection = index < numStars / 2;
                    const columnIndex = index % (numStars / 2);

                    const left = columnIndex * cellWidth + Math.random() * cellWidth;
                    const top = isTopSection
                        ? Math.random() * 80
                        : Math.random() * 80 + 170;

                    newPositions[index] = {
                        ...newPositions[index],
                        left: left,
                        top: top,
                    };
                    return newPositions;
                });

                Animated.sequence([
                    Animated.delay(Math.random() * 3000),
                    Animated.timing(star, {
                        toValue: 1,
                        duration: 1000 + Math.random() * 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(star, {
                        toValue: 0,
                        duration: 1000 + Math.random() * 1000,
                        useNativeDriver: true,
                    }),
                ]).start(runAnimation);
            };
            runAnimation();
        });
    };

    // Pulse animation for the card
    const animatePulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.delay(3000)
        ]),
      ).start();
    };

    // Comet animation
    const animateComet = () => {
        cometAnimation.setValue(0);
        const startX = -100;
        const startY = Math.random() * 50;
        const endX = width + 100;
        const endY = Math.random() * 100 + 150;

        const dx = endX - startX;
        const dy = endY - startY;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        setCometConfig({
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            angle: angle,
        });

        Animated.sequence([
            Animated.delay(Math.random() * 4000 + 4000),
            Animated.timing(cometAnimation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start(animateComet);
    };

    animateStars();
    animatePulse();
    animateComet();
  }, []);

  const parallaxTranslate = pulseAnimation.interpolate({
    inputRange: [1, 1.02],
    outputRange: [0, -5],
  });

  const parallaxTranslateFar = pulseAnimation.interpolate({
    inputRange: [1, 1.02],
    outputRange: [0, -2],
  });

const cometTranslateX = cometAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [cometConfig.startX, cometConfig.endX],
  });

  const cometTranslateY = cometAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [cometConfig.startY, cometConfig.endY],
  });

  const cometOpacity = cometAnimation.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <>
        <Animated.View
        style={[
            styles.cardContainer,
            {
            transform: [{ scale: pulseAnimation }],
            },
        ]}
        >
        <TouchableOpacity
            style={styles.card}
            onPress={() => setShowStories(true)}
            activeOpacity={0.9}
        >
            {/* Background gradient effect */}
            <View style={styles.backgroundGradient} />

            {/* Parallax Background Stars */}
            <Animated.View style={{ transform: [{translateX: parallaxTranslateFar}, {translateY: parallaxTranslateFar}] }}>
                {bgStarPositions.map((pos, index) => (
                    <View key={index} style={[styles.bgStar, { left: pos.left, top: pos.top, width: pos.size, height: pos.size, borderRadius: pos.size / 2, opacity: 0.5 }]} />
                ))}
            </Animated.View>
            <Animated.View style={{ transform: [{translateX: parallaxTranslate}, {translateY: parallaxTranslate}] }}>
                {bgStarPositions.map((pos, index) => (
                    <View key={index} style={[styles.bgStar, { left: pos.left, top: pos.top, width: pos.size, height: pos.size, borderRadius: pos.size / 2 }]} />
                ))}
            </Animated.View>
            
            {/* Stars */}
            {starPositions.map((pos, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.star,
                        {
                            left: pos.left,
                            top: pos.top,
                            opacity: starAnimations[index],
                        },
                    ]}
                >
                    <Text style={[styles.starText, {fontSize: pos.size}]}>✦</Text>
                </Animated.View>
            ))}

            {/* Comet */}
            <Comet
                opacity={cometOpacity}
                transform={[
                    { translateX: cometTranslateX },
                    { translateY: cometTranslateY },
                    { rotate: `${cometConfig.angle}deg` },
                ]}
            />
            
            {/* Content */}
            <View style={styles.content}>
            <Text style={styles.title}>Your 2025 KTP Wrapped is here</Text>
            <Text style={styles.subtitle}>Find out what KTP did this year.</Text>
            </View>
        </TouchableOpacity>
        </Animated.View>
        <Modal
            animationType="slide"
            transparent={false}
            visible={showStories}
            onRequestClose={() => {
                setShowStories(false);
            }}
        >
            <WrappedStories onClose={() => setShowStories(false)} />
        </Modal>
    </>
  );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginHorizontal: 16,
        marginVertical: 8,
    },
    card: {
        height: 240,
        borderRadius: 16,
        backgroundColor: '#0a0a0a',
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#4c1d95',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0a0a0a',
        opacity: 0.9,
    },
    content: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#b0b0b0',
        lineHeight: 22,
        textAlign: 'center',
    },
    star: {
        position: 'absolute',
        zIndex: 5,
    },
    starText: {
        color: '#c0e8a5ff',
        textShadowColor: '#08ea35ff',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
    },
    bgStar: {
        position: 'absolute',
        backgroundColor: '#fefae0',
        zIndex: 1,
    },
    cometContainer: {
        position: 'absolute',
        zIndex: 7,
        shadowColor: '#00ffff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
});

export default KTPWrappedCard;
