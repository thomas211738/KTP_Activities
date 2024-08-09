import { View, Text } from 'react-native'
import React from 'react'
import ContentLoader, { Rect, Circle } from "react-content-loader/native";


const alertsLoader = () => {
const amount = 210;
return (
    <ContentLoader 
        speed={2}
        width={500}
        height={820}
        viewBox="0 0 500 820"
        backgroundColor="#b8b8b8"
        foregroundColor="#ecebeb"
    >

        {[...Array(4)].map((_, index) => (
                <React.Fragment key={index}>
                        {/* <Circle cx="30" cy={25 + index * 60} r="25" />
                        <Rect x="60" y={10 + index * 60} rx="0" ry="0" width="150" height="15" /> 
                        <Rect x="60" y={35 + index * 60} rx="0" ry="0" width="200" height="10" />  */}
                        

                        <Rect x="15" y={10 + index * amount} rx="0" ry="0" width="240" height="38" />
                        <Rect x="15" y={50 + index * amount} rx="0" ry="0" width="350" height="2" />

                        <Rect x="15" y={65 + index * amount} rx="10" ry="10" width="350" height="120" />
                        <Circle cx="50" cy={120 + index * amount} r="25" />
                        <Rect x="90" y={75 + index * amount} rx="0" ry="0" width="175" height="30" />
                        <Rect x="90" y={110 + index * amount} rx="0" ry="0" width="265" height="65" />
                </React.Fragment>
        ))}
        
    </ContentLoader>
)
}

export default alertsLoader