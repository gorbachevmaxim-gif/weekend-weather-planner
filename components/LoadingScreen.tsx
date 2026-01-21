import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { LoadingState } from '../types';
import GastrodinamikaLogo from './GastrodinamikaLogo';

interface LoadingScreenProps {
  state: LoadingState;
  onComplete?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ state, onComplete }) => {
  // Calculate target percentage, clamped between 0 and 100
  const rawPercent = state.total > 0 ? (state.current / state.total) * 100 : 0;
  const targetPercent = Math.min(100, Math.max(0, rawPercent));
  
  // Local state for the smooth visual percentage
  const [displayPercent, setDisplayPercent] = useState(0);
  
  // Ref to ensure we only trigger complete once
  const completedRef = useRef(false);

  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      setDisplayPercent(prev => {
        const diff = targetPercent - prev;
        
        // If sufficiently close (or if target is 100 and we are close), snap to target
        if (Math.abs(diff) < 0.5) {
          return targetPercent;
        }

        // Smooth easing: move 10% of the distance per frame
        // Add a minimum step to ensure it doesn't slow down too much at the very end
        const step = diff * 0.1;
        const minStep = diff > 0 ? 0.5 : -0.5;
        
        // Use the larger of the two (absolute value) to keep momentum
        const actualStep = Math.abs(step) > Math.abs(minStep) ? step : minStep;

        return prev + actualStep;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [targetPercent]);

  // Handle completion trigger
  useEffect(() => {
    // Only trigger if we reached 100% (or very close)
    // We do NOT check !completedRef.current here to avoid issues with React Strict Mode 
    // where the effect runs twice and the timeout gets cleared but the ref stays true.
    if (displayPercent >= 99.5 && onComplete) {
        
        // Force display to exactly 100 just in case
        if (displayPercent !== 100) {
            setDisplayPercent(100);
        }

        // Wait a short moment (100ms) so the user sees the full filled logo
        const timer = setTimeout(() => {
            if (!completedRef.current) {
                completedRef.current = true;
                onComplete();
            }
        }, 100);
        
        return () => clearTimeout(timer);
    }
  }, [displayPercent, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="w-full max-w-xs flex flex-col items-center space-y-6">
        
        {/* Logo Container */}
        <div className="w-44 h-44 flex items-center justify-center relative">
            <GastrodinamikaLogo 
                percent={displayPercent} 
                className="w-full h-full" 
            />
        </div>
        
        <div className="w-full flex flex-col items-center space-y-3">
            {/* Percentage */}
            <span className="text-sm font-bold text-slate-900 font-mono">
                {Math.round(displayPercent)}%
            </span>
            
            {/* Status Text */}
            <p className="text-xs font-medium h-4" style={{ color: '#777777' }}>
                {state.status}
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
