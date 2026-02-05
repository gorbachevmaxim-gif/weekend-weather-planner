import * as React from 'react';
import { useState, useEffect } from 'react';
import GastrodinamikaLogo from './GastrodinamikaLogo';

const OrientationBlocker: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [percent, setPercent] = useState(0);

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

  useEffect(() => {
    if (!isVisible) {
        setPercent(0);
        return;
    }

    let animationFrameId: number;
    // Speed: complete circle in approx 2 seconds
    // 60fps -> 120 frames. 100% / 120 = 0.83% per frame.
    const speed = 0.8; 

    const animate = () => {
      setPercent(prev => {
        const next = prev + speed;
        return next >= 100 ? 0 : next;
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6" 
      style={{ backgroundColor: '#F5F5F5' }}
    >
        <div className="w-44 h-44 flex items-center justify-center relative">
            <GastrodinamikaLogo 
                percent={percent} 
                className="w-full h-full" 
            />
        </div>
        <div className="mt-8 text-center text-gray-500 font-medium">
            Эй, турист! Поверни обратно.
        </div>
    </div>
  );
};

export default OrientationBlocker;
