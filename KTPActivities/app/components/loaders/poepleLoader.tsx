import { View, Text } from 'react-native'
import React from 'react'
import ContentLoader, { Rect, Circle } from "react-content-loader/native";


const poepleLoader = () => {
return (
    <ContentLoader 
            speed={2}
            width={476}
            height={650}
            viewBox="0 0 500 650"
            backgroundColor="#b8b8b8"
            foregroundColor="#ecebeb"
    >
            {/* Ten Users */}
            {[...Array(11)].map((_, index) => (
                    <React.Fragment key={index}>
                            <Circle cx="30" cy={25 + index * 60} r="25" />
                            <Rect x="60" y={10 + index * 60} rx="0" ry="0" width="150" height="15" /> 
                            <Rect x="60" y={35 + index * 60} rx="0" ry="0" width="200" height="10" /> 
                    </React.Fragment>
            ))}
    </ContentLoader>
)
}

export default poepleLoader