import React, { useMemo, useRef, useEffect, useState } from 'react';
import { RouteData } from '../services/gpxUtils';
import { calculateElevationProfile, getGradientColor, ElevationPoint } from '../utils/elevationUtils';

interface ElevationProfileProps {
    routeData: RouteData | null;
    isDark?: boolean;
    targetSpeed?: number;
    isMountainRegion?: boolean;
    onHover?: (point: ElevationPoint | null) => void;
    startTemp?: number;
    endTemp?: number;
    hourlyWind?: number[];
    hourlyWindDir?: number[];
    externalHoverPoint?: ElevationPoint | null;
    className?: string;
    width?: number;
    height?: number;
    showAxes?: boolean;
    showTooltip?: boolean;
    tooltipOffset?: number;
    variant?: 'default' | 'inline' | 'overlay';
}

const getWindDirectionText = (deg: number) => {
    const directions = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"];
    const index = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
    return directions[index];
};

const ElevationProfile: React.FC<ElevationProfileProps> = ({ 
    routeData, 
    isDark = false, 
    targetSpeed = 30.0,
    isMountainRegion = false,
    onHover,
    startTemp,
    endTemp,
    hourlyWind,
    hourlyWindDir,
    externalHoverPoint,
    className,
    width: propWidth,
    height: propHeight,
    showAxes = true,
    showTooltip = true,
    tooltipOffset = -10,
    variant = 'default'
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bgCanvasRef = useRef<HTMLCanvasElement>(null);
    const [internalHoverPoint, setInternalHoverPoint] = useState<ElevationPoint | null>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: propHeight || 200 });
    const [isMobile, setIsMobile] = useState(false);

    const activeHoverPoint = internalHoverPoint || externalHoverPoint;

    const data = useMemo(() => {
        if (!routeData) return [];
        return calculateElevationProfile(
            routeData.points, 
            routeData.cumulativeDistances, 
            targetSpeed,
            isMountainRegion
        );
    }, [routeData, targetSpeed, isMountainRegion]);

    const { minEle, maxEle, totalDist, totalTime, step } = useMemo(() => {
        if (data.length === 0) return { minEle: 0, maxEle: 0, totalDist: 0, totalTime: 0, step: 10 };
        let min = Infinity;
        let max = -Infinity;
        data.forEach(p => {
            if (p.ele < min) min = p.ele;
            if (p.ele > max) max = p.ele;
        });
        const dist = data[data.length - 1].dist;
        const time = data[data.length - 1].time;
        
        const range = max - min;
        // Calculate step to fit approx 4 lines (divide by 3 to ensure enough slack for snapping)
        let s = Math.ceil(range / 3 / 10) * 10;
        if (s < 10) s = 10;

        const center = (min + max) / 2;
        // We want 4 lines: L1, L2, L3, L4 separated by s.
        // Center of lines grid is L1 + 1.5s
        // We align this center approx to data center
        const base = center - 1.5 * s;
        const l1 = Math.round(base / s) * s;
        
        return { 
            minEle: l1 - 0.5 * s, 
            maxEle: l1 + 3.5 * s, 
            totalDist: dist,
            totalTime: time,
            step: s
        };
    }, [data]);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const mobile = window.innerWidth <= 768;
                setIsMobile(mobile);
                
                if (propWidth && propHeight) {
                     setDimensions({ width: propWidth, height: propHeight });
                } else {
                    setDimensions({
                        width: containerRef.current.clientWidth,
                        height: mobile ? 120 : 150
                    });
                }
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, [propWidth, propHeight]);

    // Draw Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const bgCanvas = bgCanvasRef.current;
        if (!canvas || data.length === 0 || dimensions.width === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let bgCtx: CanvasRenderingContext2D | null = null;
        if (variant === 'overlay' && bgCanvas) {
            bgCtx = bgCanvas.getContext('2d');
        }

        // Handle high DPI
        const dpr = window.devicePixelRatio || 1;
        canvas.width = dimensions.width * dpr;
        canvas.height = dimensions.height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${dimensions.width}px`;
        canvas.style.height = `${dimensions.height}px`;

        if (bgCtx && bgCanvas) {
            bgCanvas.width = dimensions.width * dpr;
            bgCanvas.height = dimensions.height * dpr;
            bgCtx.scale(dpr, dpr);
            bgCanvas.style.width = `${dimensions.width}px`;
            bgCanvas.style.height = `${dimensions.height}px`;
            bgCtx.clearRect(0, 0, dimensions.width, dimensions.height);
        }

        const { width, height } = dimensions;
        let padding = showAxes 
            ? { top: isMobile ? 10 : 20, right: 10, bottom: 20, left: 40 }
            : { top: 5, right: 5, bottom: 5, left: 5 };

        if (variant === 'overlay' && !showAxes) {
             padding = { top: 10, right: 10, bottom: 20, left: 10 };
        }

        const graphWidth = width - padding.left - padding.right;
        const graphHeight = height - padding.top - padding.bottom;

        ctx.clearRect(0, 0, width, height);

        // Scales
        const getX = (dist: number) => padding.left + (dist / totalDist) * graphWidth;
        const getY = (ele: number) => padding.top + graphHeight - ((ele - minEle) / (maxEle - minEle)) * graphHeight;

        if (showAxes) {
            // Grid lines (Y axis)
            ctx.strokeStyle = isDark ? '#333' : '#e5e5e5';
            ctx.lineWidth = 1;
            ctx.beginPath();
            
            const startYVal = Math.ceil(minEle / step) * step;
            const endYVal = Math.floor(maxEle / step) * step;

            for (let val = startYVal; val <= endYVal; val += step) {
                const y = getY(val);
                ctx.moveTo(padding.left, y);
                ctx.lineTo(width - padding.right, y);
                
                // Text
                ctx.fillStyle = isDark ? '#777' : '#999';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(Math.round(val).toString(), padding.left - 5, y + 3);
            }
            ctx.stroke();

            // X axis ticks every 20km
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            for (let d = 20; d < totalDist; d += 20) {
                const x = getX(d);
                
                // Tick
                ctx.beginPath();
                ctx.strokeStyle = isDark ? '#777' : '#999';
                ctx.moveTo(x, height - padding.bottom);
                ctx.lineTo(x, height - padding.bottom - 5);
                ctx.stroke();

                // Text
                ctx.fillStyle = isDark ? '#777' : '#999';
                ctx.font = '10px sans-serif';
                ctx.fillText(d.toString(), x, height - padding.bottom + 2);
            }
        }

        // Fill area under curve
        if (showAxes || variant === 'overlay') {
            const drawCtx = (variant === 'overlay' && bgCtx) ? bgCtx : ctx;

            drawCtx.beginPath();
            drawCtx.moveTo(getX(data[0].dist), getY(data[0].ele));
            for (let i = 1; i < data.length; i++) {
                drawCtx.lineTo(getX(data[i].dist), getY(data[i].ele));
            }
            drawCtx.lineTo(getX(data[data.length - 1].dist), height - padding.bottom);
            drawCtx.lineTo(getX(data[0].dist), height - padding.bottom);
            drawCtx.closePath();
            
            if (variant === 'overlay') {
                const gradient = drawCtx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
                const color = isDark ? '18, 13, 8' : '200, 200, 200'; // Gray base
                gradient.addColorStop(0, `rgba(${color}, 1.0)`);
                gradient.addColorStop(1, `rgba(${color}, 0.0)`);
                drawCtx.fillStyle = gradient;
            } else if (variant === 'inline') {
                const gradient = drawCtx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
                const color = isDark ? '21, 21, 21' : '229, 229, 229';
                gradient.addColorStop(0, `rgba(${color}, 1.0)`);
                gradient.addColorStop(1, `rgba(${color}, 0.0)`);
                drawCtx.fillStyle = gradient;
            } else {
                drawCtx.fillStyle = isDark ? 'rgba(51, 51, 51, 0.9)' : 'rgba(229, 229, 229, 0.9)';
            }
            drawCtx.fill();
        }

        // Overlay Axis (Labels only)
        if (variant === 'overlay') {
            const axisY = height - padding.bottom;
            const axisColor = isDark ? '#CCCCCC' : '#444444'; // Match route color approx

            // Labels
            ctx.fillStyle = axisColor;
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('0', padding.left, axisY + 4);

            ctx.textAlign = 'right';
            ctx.fillText(Math.round(totalDist).toString(), width - padding.right, axisY + 4);
        }

        // Draw segments
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        for (let i = 0; i < data.length - 1; i++) {
            const p1 = data[i];
            const p2 = data[i+1];
            
            ctx.beginPath();
            ctx.moveTo(getX(p1.dist), getY(p1.ele));
            ctx.lineTo(getX(p2.dist), getY(p2.ele));
            // Use color of the segment (approx by p2 gradient or average)
            ctx.strokeStyle = getGradientColor(p2.gradient);
            ctx.stroke();
        }

        // Draw hover line if active
        if (activeHoverPoint) {
            const x = getX(activeHoverPoint.dist);
            const y = getY(activeHoverPoint.ele);

            ctx.strokeStyle = isDark ? '#666666' : '#000000';
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            
            // Vertical cursor line
            ctx.beginPath();
            ctx.moveTo(x, y);
            if (variant === 'inline') {
                ctx.lineTo(x, height - padding.bottom);
            } else {
                ctx.lineTo(x, 0);
            }
            ctx.stroke();

            // Horizontal dynamic axis (current elevation)
            if (showAxes) {
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(width - padding.right, y);
                ctx.stroke();
            }

            // Dot
            ctx.fillStyle = isDark ? '#fff' : '#000';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }

    }, [data, dimensions, isDark, minEle, maxEle, totalDist, activeHoverPoint, step, showAxes, variant]);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (data.length === 0) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        let clientX = 0;
        
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
        } else {
            clientX = (e as React.MouseEvent).clientX;
        }

        const x = clientX - rect.left;
        
        const { width } = dimensions;
        const padding = showAxes 
            ? { top: isMobile ? 10 : 20, right: 10, bottom: 20, left: 40 }
            : { top: 5, right: 5, bottom: 5, left: 5 };
        const graphWidth = width - padding.left - padding.right;

        // Map x to distance
        const dist = ((x - padding.left) / graphWidth) * totalDist;

        // Find nearest point
        // Binary search could be faster but linear is fine for <5000 points usually, let's optimize slightly
        let closest = data[0];
        let minDiff = Math.abs(data[0].dist - dist);

        // Optimization: start search from estimated index
        const estimatedIdx = Math.floor((dist / totalDist) * data.length);
        const searchStart = Math.max(0, estimatedIdx - 500);
        const searchEnd = Math.min(data.length, estimatedIdx + 500);

        // Fallback to full search if out of bounds (shouldn't happen much) or just search whole if small
        const rangeStart = data.length > 2000 ? searchStart : 0;
        const rangeEnd = data.length > 2000 ? searchEnd : data.length;

        for (let i = rangeStart; i < rangeEnd; i++) {
            const diff = Math.abs(data[i].dist - dist);
            if (diff < minDiff) {
                minDiff = diff;
                closest = data[i];
            }
        }

        // Clamp to graph area
        if (x >= padding.left && x <= width - padding.right) {
            setInternalHoverPoint(closest);
            if (onHover) onHover(closest);
        } else {
            setInternalHoverPoint(null);
            if (onHover) onHover(null);
        }
    };

    const handleMouseLeave = () => {
        setInternalHoverPoint(null);
        if (onHover) onHover(null);
    };

    // Calculate tooltip position
    const tooltipX = useMemo(() => {
        if (!activeHoverPoint || !containerRef.current || dimensions.width === 0 || totalDist === 0) return null;
        
        const { width } = dimensions;
        const padding = showAxes 
            ? { top: isMobile ? 10 : 20, right: 10, bottom: 20, left: 40 }
            : { top: 5, right: 5, bottom: 5, left: 5 };
        const graphWidth = width - padding.left - padding.right;
        
        return padding.left + (activeHoverPoint.dist / totalDist) * graphWidth;
    }, [activeHoverPoint, dimensions, showAxes, isMobile, totalDist]);

    if (!routeData || data.length === 0) return null;

    const borderColor = isDark ? '#666666' : '#000000';

    const tooltipStyle: React.CSSProperties = variant === 'inline' 
        ? {
            top: 8,
            left: tooltipX !== null ? tooltipX : 0,
            transform: (activeHoverPoint && (activeHoverPoint.dist / totalDist) < 0.5) 
                ? `translateX(25px)` 
                : `translateX(calc(-100% - 25px))`,
            border: `1px solid ${borderColor}`,
            boxShadow: 'none'
        }
        : {
            bottom: '100%',
            left: tooltipX !== null ? tooltipX : 0,
            transform: `translateX(-50%) translateY(${tooltipOffset}px)`,
            border: `1px solid ${borderColor}`,
            boxShadow: 'none'
        };

    return (
        <div ref={containerRef} className={`w-full relative select-none ${className || ''}`}>
            {variant === 'overlay' && (
                <canvas
                    ref={bgCanvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none mix-blend-overlay"
                />
            )}
            <canvas
                ref={canvasRef}
                className="block cursor-crosshair touch-none relative z-10"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleMouseMove}
                onTouchMove={handleMouseMove}
            />
            {activeHoverPoint && containerRef.current && showTooltip && tooltipX !== null && (
                <div 
                    className={`absolute z-30 pointer-events-none p-2 rounded text-xs font-sans whitespace-nowrap w-max backdrop-blur ${
                        isDark ? 'bg-[#888888] text-[#000000]' : 'bg-white/90 text-black'
                    }`}
                    style={tooltipStyle}
                >
                    <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1 font-medium">
                        <span>{Math.floor(activeHoverPoint.time)}:{(Math.round((activeHoverPoint.time - Math.floor(activeHoverPoint.time)) * 60)).toString().padStart(2, '0')}</span>
                        <span>{activeHoverPoint.dist.toFixed(1)} км</span>
                        <span>
                            {startTemp !== undefined && endTemp !== undefined && totalTime > 0 
                                ? `${Math.round(startTemp + (endTemp - startTemp) * (activeHoverPoint.time / totalTime))}°` 
                                : ''}
                        </span>
                        <span>{Math.round(activeHoverPoint.speed)} км/ч</span>
                        
                        <span>{Math.round(activeHoverPoint.originalEle)} м</span>
                        <span>+{Math.round(activeHoverPoint.realCumElevation)} м</span>

                        <span>{Math.round(activeHoverPoint.gradient)}%</span>
                        <span>
                            {hourlyWind && hourlyWindDir && (
                                <>
                                   {getWindDirectionText(hourlyWindDir[Math.min(Math.round(activeHoverPoint.time + 1), hourlyWindDir.length - 1)] || 0)} {Math.round(hourlyWind[Math.min(Math.round(activeHoverPoint.time + 1), hourlyWind.length - 1)] || 0)} км/ч
                                </>
                            )}
                        </span>

                        <span>
                            -{Math.floor(Math.max(0, totalTime - activeHoverPoint.time))}:{(Math.round((Math.max(0, totalTime - activeHoverPoint.time) - Math.floor(Math.max(0, totalTime - activeHoverPoint.time))) * 60)).toString().padStart(2, '0')}
                        </span>
                        <span>
                            {Math.max(0, totalDist - activeHoverPoint.dist).toFixed(1)} км
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ElevationProfile;
