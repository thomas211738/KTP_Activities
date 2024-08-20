import React, { useState, useEffect } from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import axios from 'axios';
import { BACKEND_URL } from '@env';

const Splash = ({ setIsAnimating }) => {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/photo/photo/66c3e3655900f71748d684a3`);
        setAnimationData(JSON.parse(response.data.data));
      } catch (error) {
        console.error('Error fetching animation data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('./../../assets/splash.png')}
        resizeMode="cover"
        style={styles.image}
      >
        {animationData ? (
          <>
          <LottieView
            source={animationData}
            style={{ marginTop: 150, width: "50%", height: "20%" }}
            resizeMode="cover"
            autoPlay
            loop={false}
            onAnimationFinish={() => {
              setIsAnimating(false);
            }}
          />
          </>
        ) : ""}
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Splash;
