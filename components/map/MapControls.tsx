import React from "react";
import PlusIcon from "../icons/PlusIcon";
import MinusIcon from "../icons/MinusIcon";
import CenterIcon from "../icons/CenterIcon";
import EscIcon from "../icons/EscIcon";
import ExpandIcon from "../icons/ExpandIcon";
import OptionIcon from "../icons/OptionIcon";
import ShiftIcon from "../icons/ShiftIcon";

interface MapControlsProps {
    isFullscreen: boolean;
    isDark: boolean;
    isMobile: boolean;
    onToggleFullscreen: () => void;
    onCenterMap: () => void;
    routeCount?: number;
    selectedRouteIdx?: number;
    onRouteSelect?: (idx: number) => void;
}

const MapControls: React.FC<MapControlsProps> = ({
    isFullscreen,
    isDark,
    isMobile,
    onToggleFullscreen,
    onCenterMap,
    routeCount = 0,
    selectedRouteIdx = 0,
    onRouteSelect
}) => {
    return (
        <div className="absolute left-4 top-4 z-20 flex flex-col items-start gap-2">
            <button
                className="w-8 h-8 rounded-md flex items-center justify-center transition-colors relative group"
                onClick={onToggleFullscreen}
            >
                {isFullscreen ? (
                    <EscIcon isDark={isDark} width={40} height={40} />
                ) : (
                    <ExpandIcon isDark={isDark} width={40} height={40} />
                )}
                {!isMobile && (
                    <div className={`absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-sans shadow-lg ${isDark ? "bg-[#888888] text-[#000000]" : "bg-[#111111] text-white"}`}>
                        <div className={`absolute left-[-2px] top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 ${isDark ? "bg-[#888888]" : "bg-[#111111]"}`}></div>
                        {isFullscreen ? "Свернуть" : "Развернуть"}
                    </div>
                )}
            </button>

            <button
                className="w-8 h-8 rounded-md flex items-center justify-center transition-colors relative group"
                onClick={onCenterMap}
            >
                <CenterIcon isDark={isDark} width={30} height={30} />
                {!isMobile && (
                    <div className={`absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-sans shadow-lg ${isDark ? "bg-[#888888] text-[#000000]" : "bg-[#111111] text-white"}`}>
                        <div className={`absolute left-[-2px] top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 ${isDark ? "bg-[#888888]" : "bg-[#111111]"}`}></div>
                        Центрировать
                    </div>
                )}
            </button>

            {isFullscreen && (
                <>
                    <button
                        className="w-12 h-12 rounded-md flex items-center justify-center transition-colors relative group mt-[-8px]"
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('option-click'));
                        }}
                    >
                        <OptionIcon isDark={isDark} width={53} height={29} />
                        {!isMobile && (
                            <div className={`absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-sans shadow-lg ${isDark ? "bg-[#888888] text-[#000000]" : "bg-[#111111] text-white"}`}>
                                <div className={`absolute left-[-2px] top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 ${isDark ? "bg-[#888888]" : "bg-[#111111]"}`}></div>
                                Листать инфотрекер
                            </div>
                        )}
                    </button>

                    <button
                        className="w-13 h-12 rounded-md flex items-left justify-center transition-colors relative group mt-[-4px]"
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('shift-click'));
                        }}
                    >
                        <ShiftIcon isDark={isDark} width={47} height={27} />
                        {!isMobile && (
                            <div className={`absolute left-full top-0 ml-3 px-3 py-1.5 text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-sans shadow-lg ${isDark ? "bg-[#888888] text-[#000000]" : "bg-[#111111] text-white"}`}>
                                <div className={`absolute left-[-2px] top-2.5 w-2 h-2 rotate-45 ${isDark ? "bg-[#888888]" : "bg-[#111111]"}`}></div>
                                Менять темп
                            </div>
                        )}
                    </button>
                </>
            )}

            {routeCount > 1 && onRouteSelect && (
                <>
                    {Array.from({ length: routeCount }).map((_, idx) => (
                        <button
                            key={idx}
                            className={`w-8 h-8 backdrop-blur rounded-md shadow-md flex items-center justify-center transition-colors font-unbounded text-xs font-medium ${
                                selectedRouteIdx === idx
                                    ? (isDark ? "bg-white text-[#111111]" : "bg-[#111111] text-white")
                                    : (isDark 
                                        ? "bg-[#333333]/90 text-[#D9D9D9] hover:bg-[#444444] active:bg-[#222222]" 
                                        : "bg-white/90 text-[#111111] hover:bg-white active:bg-gray-100")
                            }`}
                            onClick={() => onRouteSelect(idx)}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </>
            )}
        </div>
    );
};

export default MapControls;
