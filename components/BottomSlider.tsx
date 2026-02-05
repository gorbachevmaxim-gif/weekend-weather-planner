import React, { useEffect, useState } from 'react';

interface BottomSliderProps {
    isOpen: boolean;
    onClose: () => void;
    content: string | React.ReactNode;
    isDark?: boolean;
}

const BottomSlider: React.FC<BottomSliderProps> = ({ isOpen, onClose, content, isDark = false }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300); // Wait for animation
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
                    isOpen ? 'opacity-50' : 'opacity-0'
                } bg-black`}
                onClick={onClose}
            />
            
            {/* Slider */}
            <div 
                className={`fixed bottom-0 left-0 right-0 z-[70] transform transition-transform duration-300 ease-out ${
                    isOpen ? 'translate-y-0' : 'translate-y-full'
                } ${isDark ? 'bg-[#1E1E1E] text-white' : 'bg-white text-black'} rounded-t-2xl p-6 shadow-xl cursor-pointer`}
                onClick={onClose}
            >
                {/* Drag handle indicator (visual only) */}
                <div className="w-full flex justify-center mb-4">
                    <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
                </div>
                
                <div className="text-sm leading-relaxed font-sans">
                    {content}
                </div>
                
                {/* Bottom padding safe area for mobile */}
                <div className="h-4" />
            </div>
        </>
    );
};

export default BottomSlider;
