import * as React from 'react';
import { useState, useEffect } from 'react';
import GstrdnmcLogo from './icons/GstrdnmcLogo';

interface OrientationBlockerProps {
    isDark?: boolean;
}

const OrientationBlocker: React.FC<OrientationBlockerProps> = ({ isDark = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if landscape
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      // Check if screen height is small (typical for phones in landscape)
      // Most phones have width < 900 in landscape, and height < 500.
      // iPads have height >= 768 in landscape.
      const isSmallHeight = window.innerHeight < 600;
      
      setIsVisible(isLandscape && isSmallHeight);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6" 
      style={{ backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }}
    >
        <div className="flex items-center justify-center">
            <GstrdnmcLogo 
                width="162" 
                height="100" 
                fill={isDark ? '#FFFFFF' : '#111111'} 
            />
        </div>
    </div>
  );
};

export default OrientationBlocker;
