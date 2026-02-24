import React from "react";
import { ElevationPoint } from "../../utils/elevationUtils";

interface WindIndicatorProps {
    windDeg?: number;
    windSpeed?: string;
    windDirection?: string;
    rotation: number;
    isDark: boolean;
    windPos: { x: number; y: number } | null;
    hoverInfo: ElevationPoint | null;
    startTemp?: number;
    endTemp?: number;
    elevationData: ElevationPoint[];
    currentRouteDataDistance?: number;
    hourlyWind?: number[];
    hourlyWindDir?: number[];
    onMouseDown: (e: React.MouseEvent | React.TouchEvent) => void;
}

const getAverageWindSpeed = (range?: string) => {
    if (!range) return "";
    const parts = range.split("..");
    if (parts.length === 2) {
        const min = parseInt(parts[0], 10);
        const max = parseInt(parts[1], 10);
        const avg = Math.round((min + max) / 2);
        return `${avg} км/ч`;
    }
    return `${range} км/ч`;
};

const getWindDirectionText = (deg: number) => {
    const directions = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"];
    const index = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
    return directions[index];
};

const getPlacementClasses = (deg?: number) => {
    if (deg === undefined) return "bottom-full left-1/2 -translate-x-1/2 mb-5"; 

    const normalized = (deg % 360 + 360) % 360;
    
    if (normalized >= 315 || normalized < 45) {
         // Wind from N -> Place N (Top)
         return "bottom-full left-1/2 -translate-x-1/2 mb-5";
    } else if (normalized >= 45 && normalized < 135) {
         // Wind from E -> Place E (Right)
         return "left-full top-1/2 -translate-y-1/2 ml-5";
    } else if (normalized >= 135 && normalized < 225) {
         // Wind from S -> Place S (Bottom)
         return "top-full left-1/2 -translate-x-1/2 mt-5";
    } else {
         // Wind from W -> Place W (Left)
         return "right-full top-1/2 -translate-y-1/2 mr-5";
    }
};

const WindIndicator: React.FC<WindIndicatorProps> = ({
    windDeg,
    windSpeed,
    windDirection,
    rotation,
    isDark,
    windPos,
    hoverInfo,
    startTemp,
    endTemp,
    elevationData,
    currentRouteDataDistance,
    hourlyWind,
    hourlyWindDir,
    onMouseDown
}) => {
    if (windDeg === undefined) return null;

    return (
        <div 
            className={`absolute z-20 flex flex-col items-center p-[30px] ${windPos ? '' : '-left-[14px] bottom-[10px]'}`}
            style={windPos ? { left: windPos.x, top: windPos.y } : undefined}
            onMouseDown={onMouseDown}
            onTouchStart={onMouseDown}
        >
            <div className="relative flex flex-col items-center w-8">
                <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                >
                    <svg 
                        width="26" 
                        height="26" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ transform: `rotate(${windDeg + 180 - rotation}deg)` }}
                    >
                        <path d="M12 19V5M5 12l7-7 7 7" stroke={isDark ? "rgb(19, 13, 8)" : "rgb(243, 242, 242)"} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 19V5M5 12l7-7 7 7" stroke={isDark ? "#FFFFFF" : "#111111"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                {(windSpeed || windDirection) && !windPos && (
                    <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 flex flex-col items-center w-max pointer-events-none">
                        {windSpeed && (
                            <span className={`text-[13px] font-sans leading-none mb-0.5 ${isDark ? "text-[#D9D9D9]" : "text-[#444444]"}`}>
                                {getAverageWindSpeed(windSpeed)}
                            </span>
                        )}
                        {windDirection && (
                            <span className={`text-[11px] uppercase font-sans leading-none ${isDark ? "text-[#D9D9D9]" : "text-[#444444]"}`}>
                                {windDirection}
                            </span>
                        )}
                    </div>
                )}
                {/* Hover Info Pill */}
                {hoverInfo && (
                    <div 
                        className={`absolute ${getPlacementClasses(windDeg)} backdrop-blur rounded-md p-2 shadow-md pointer-events-none ${
                            isDark ? "bg-[#888888] text-[#000000]" : "bg-white/90 text-black"
                        }`}
                    >
                        <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1 font-medium text-xs font-sans whitespace-nowrap">
                            <span>{Math.floor(hoverInfo.time)}:{(Math.round((hoverInfo.time - Math.floor(hoverInfo.time)) * 60)).toString().padStart(2, '0')}</span>
                            <span>{hoverInfo.dist.toFixed(1)} км</span>
                            
                            <span>
                                {startTemp !== undefined && endTemp !== undefined && elevationData.length > 0
                                    ? `${Math.round(startTemp + (endTemp - startTemp) * (hoverInfo.time / elevationData[elevationData.length-1].time))}°` 
                                    : ''}
                            </span>
                            <span>{Math.round(hoverInfo.speed)} км/ч</span>
                            
                            <span>{Math.round(hoverInfo.originalEle)} м</span>
                            <span>+{Math.round(hoverInfo.realCumElevation)} м</span>

                            <span>{Math.round(hoverInfo.gradient)}%</span>
                            <span>
                                {hourlyWind && hourlyWindDir && (
                                    <>
                                    {getWindDirectionText(hourlyWindDir[Math.min(Math.round(hoverInfo.time + 1), hourlyWindDir.length - 1)] || 0)} {Math.round(hourlyWind[Math.min(Math.round(hoverInfo.time + 1), hourlyWind.length - 1)] || 0)} км/ч
                                    </>
                                )}
                            </span>

                            <span>
                                -{Math.floor(Math.max(0, elevationData[elevationData.length-1].time - hoverInfo.time))}:{(Math.round((Math.max(0, elevationData[elevationData.length-1].time - hoverInfo.time) - Math.floor(Math.max(0, elevationData[elevationData.length-1].time - hoverInfo.time))) * 60)).toString().padStart(2, '0')}
                            </span>
                            <span>
                                {currentRouteDataDistance !== undefined ? Math.max(0, currentRouteDataDistance - hoverInfo.dist).toFixed(1) : ''} км
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WindIndicator;
