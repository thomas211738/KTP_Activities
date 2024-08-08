import { View, Text } from 'react-native'
import React from 'react'
import ContentLoader, { Rect, Circle } from "react-content-loader/native";


const profileLoader = () => {
  return (
    <ContentLoader 
            speed={2}
            width={476}
            height={550}
            viewBox="0 0 500 550"
            backgroundColor="#b8b8b8"
            foregroundColor="#ecebeb"
    >
            <Rect x="10" y="10" rx="10" ry="10" width="390" height="400" /> 
            <Rect x="10" y="430" rx="10" ry="10" width="390" height="50" />
            <Rect x="10" y="500" rx="10" ry="10" width="390" height="50" />
    </ContentLoader>
  )
}

export default profileLoader