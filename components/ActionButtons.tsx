import React from "react";

interface ActionButtonsProps {
    canShare: boolean;
    handleDownloadGpx: () => void;
    handleShareGpx: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ canShare, handleDownloadGpx, handleShareGpx }) => {
    return (
        <div className="flex flex-col sm:flex-row p-4 space-y-2 sm:space-y-0 sm:space-x-2">
            <button
                onClick={handleDownloadGpx}
                className="flex-1 py-3 px-4 bg-white text-black rounded-full font-bold flex items-center justify-center space-x-2 hover:bg-[#E1E1E2]"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Скачать GPX</span>
            </button>
            {canShare && (
                <button
                    onClick={handleShareGpx}
                    className="flex-1 py-3 px-4 bg-white text-black rounded-full font-bold flex items-center justify-center space-x-2 hover:bg-[#E1E1E2]"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    <span>Открыть GPX</span>
                </button>
            )}
        </div>
    );
};
