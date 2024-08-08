import { View, Text } from 'react-native'
import React from 'react'
import ContentLoader, { Rect, Circle } from "react-content-loader/native";


const viewProfileLoader = () => {
  return (
    <ContentLoader 
        speed={2}
        width={476}
        height={410}
        viewBox="0 0 500 410"
        backgroundColor="#b8b8b8"
        foregroundColor="#ecebeb"
    >
        <Rect x="10" y="10" rx="0" ry="0" width="390" height="400" /> 
    </ContentLoader>
  )
}

export default viewProfileLoader