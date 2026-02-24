import React from "react";
import ArrowUp from "../icons/ArrowUp";
import GeminiIcon from "../icons/GeminiIcon";
import ShareIcon from "../icons/ShareIcon";
import GpxFileIcon from "../icons/GpxFileIcon";
import AnnounceGeminiIcon from "../icons/AnnounceGeminiIcon";

interface CityDownloadsProps {
    isDesktop: boolean;
    isDark: boolean;
    canShare: boolean;
    isGeneratingAI: boolean;
    onForward: () => void;
    onDownload: () => void;
    onGenerate: () => void;
}

const CityDownloads: React.FC<CityDownloadsProps> = ({
    isDesktop,
    isDark,
    canShare,
    isGeneratingAI,
    onForward,
    onDownload,
    onGenerate
}) => {
    if (isDesktop) {
        const iconColor = isDark ? "text-[#D9D9D9]" : "text-[#222222]";
        const hoverColor = "hover:text-[#777777]";

        const renderTooltip = (text: string) => (
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-sans shadow-lg ${isDark ? "bg-[#888888] text-[#000000]" : "bg-[#111111] text-white"}`}>
                <div className={`absolute left-1/2 -translate-x-1/2 bottom-[-2px] w-2 h-2 rotate-45 ${isDark ? "bg-[#888888]" : "bg-[#111111]"}`}></div>
                {text}
            </div>
        );

        return (
            <div className="flex gap-4 items-center">
                {canShare && (
                    <button
                        onClick={onForward}
                        className={`${iconColor} ${hoverColor} transition-colors p-1 relative group`}
                    >
                        <ShareIcon width={24} height={24} />
                        {renderTooltip("Отправить")}
                    </button>
                )}
                <button
                    onClick={onDownload}
                    className={`${iconColor} ${hoverColor} transition-colors p-1 relative group`}
                >
                    <GpxFileIcon width={20} height={22} isDark={isDark} />
                    {renderTooltip("Скачать")}
                </button>
                <button
                    onClick={onGenerate}
                    disabled={isGeneratingAI}
                    className={`${iconColor} ${hoverColor} transition-colors p-1 relative group`}
                >
                    <AnnounceGeminiIcon width={24} height={25} isDark={isDark} />
                    {renderTooltip(isGeneratingAI ? "Пишу..." : "Анонс")}
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 gap-2 px-4 pt-4 pb-2">
            {canShare && (
                <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); onForward(); }}
                    className={`text-sm text-center ${isDark ? "text-[#D9D9D9]" : "text-[#222222]"} hover:text-[#777777] flex items-center justify-center gap-0`}
                >
                    <span className="underline decoration-1 underline-offset-4">Отправить</span>
                    <ArrowUp width="28" height="28" strokeWidth="1.3" style={{ transform: "rotate(45deg)", position: "relative", top: "1px" }} />
                </a>
            )}
            <a
                href="#"
                onClick={(e) => { 
                    e.preventDefault(); 
                    onDownload();
                }}
                className={`text-sm text-center ${isDark ? "text-[#D9D9D9]" : "text-[#222222]"} hover:text-[#777777] flex items-center justify-center gap-0`}
            >
                <span className="underline decoration-1 underline-offset-4">Открыть</span>
                <ArrowUp width="28" height="28" strokeWidth="1.3" style={{ transform: "rotate(45deg)", position: "relative", top: "1px" }} />
            </a>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    onGenerate();
                }}
                disabled={isGeneratingAI}
                className={`group text-sm text-center ${isDark ? "text-[#D9D9D9]" : "text-[#222222]"} hover:text-[#777777] flex items-center justify-center gap-2 disabled:opacity-50`}
            >
                <span className="underline decoration-1 underline-offset-4 group-hover:text-[#777777] transition-colors">{isGeneratingAI ? "Пишу..." : "Анонс"}</span>
                <GeminiIcon width={18} height={18} className={`${isDark ? "text-[#D9D9D9]" : "text-[#222222]"} group-hover:text-[#777777] transition-colors`} />
            </button>
        </div>
    );
};

export default CityDownloads;
