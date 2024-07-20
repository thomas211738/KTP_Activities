import React from "react";
import ContentLoader, { Rect, Circle } from "react-content-loader/native";

const CalendarLoader = () => (
    <ContentLoader 
        speed={2}
        width={476}
        height={650}
        viewBox="0 0 500 650"
        backgroundColor="#b8b8b8"
        foregroundColor="#ecebeb"
    >
        {/* First Loader */}
        <Rect x="5" y="5" rx="0" ry="0" width="370" height="22" /> 

        <Circle cx="15" cy="41" r="9" />
        <Rect x="30" y="34" rx="0" ry="0" width="100" height="16" /> 

        <Circle cx="145" cy="41" r="9" />
        <Rect x="160" y="34" rx="0" ry="0" width="100" height="16" />

        <Rect x="5" y="55" rx="0" ry="0" width="370" height="7" /> 
        <Rect x="5" y="69" rx="0" ry="0" width="370" height="7" /> 
        <Rect x="5" y="83" rx="0" ry="0" width="370" height="7" /> 


        {/* Second Loader */}
        <Rect x="5" y="135" rx="0" ry="0" width="370" height="22" /> 

        <Circle cx="15" cy="171" r="9" />
        <Rect x="30" y="164" rx="0" ry="0" width="100" height="16" /> 

        <Circle cx="145" cy="171" r="9" />
        <Rect x="160" y="164" rx="0" ry="0" width="100" height="16" />

        <Rect x="5" y="185" rx="0" ry="0" width="370" height="7" /> 
        <Rect x="5" y="199" rx="0" ry="0" width="370" height="7" /> 
        <Rect x="5" y="213" rx="0" ry="0" width="370" height="7" /> 

        {/* Third Loader */}
        <Rect x="5" y="265" rx="0" ry="0" width="370" height="22" /> 

        <Circle cx="15" cy="301" r="9" />
        <Rect x="30" y="294" rx="0" ry="0" width="100" height="16" /> 

        <Circle cx="145" cy="301" r="9" />
        <Rect x="160" y="294" rx="0" ry="0" width="100" height="16" />

        <Rect x="5" y="315" rx="0" ry="0" width="370" height="7" /> 
        <Rect x="5" y="329" rx="0" ry="0" width="370" height="7" /> 
        <Rect x="5" y="343" rx="0" ry="0" width="370" height="7" /> 


        {/* Fourth Loader */}
        <Rect x="5" y="395" rx="0" ry="0" width="370" height="22" /> 

        <Circle cx="15" cy="431" r="9" />
        <Rect x="30" y="424" rx="0" ry="0" width="100" height="16" /> 

        <Circle cx="145" cy="431" r="9" />
        <Rect x="160" y="424" rx="0" ry="0" width="100" height="16" />

        <Rect x="5" y="445" rx="0" ry="0" width="370" height="7" /> 
        <Rect x="5" y="459" rx="0" ry="0" width="370" height="7" /> 
        <Rect x="5" y="473" rx="0" ry="0" width="370" height="7" /> 

        {/* Fifth Loader */}
        <Rect x="5" y="525" rx="0" ry="0" width="370" height="22" /> 

        <Circle cx="15" cy="561" r="9" />
        <Rect x="30" y="554" rx="0" ry="0" width="100" height="16" /> 

        <Circle cx="145" cy="561" r="9" />
        <Rect x="160" y="554" rx="0" ry="0" width="100" height="16" />

        <Rect x="5" y="575" rx="0" ry="0" width="370" height="7" /> 
        <Rect x="5" y="589" rx="0" ry="0" width="370" height="7" /> 
        <Rect x="5" y="603" rx="0" ry="0" width="370" height="7" />
    </ContentLoader>
);

export default CalendarLoader;
