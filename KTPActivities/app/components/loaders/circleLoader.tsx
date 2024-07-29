import { View, Text } from 'react-native'
import React from 'react'
import ContentLoader, { Rect, Circle } from "react-content-loader/native";

const circleLoader = () => {
  return (
    <ContentLoader 
            speed={2}
            width={300}
            height={180}
            viewBox="0 0 100 100"
            backgroundColor="#b8b8b8"
            foregroundColor="#ecebeb"
    >
            <Circle cx="75" cy="53" r="47" />
    </ContentLoader>
  )
}

export default circleLoader