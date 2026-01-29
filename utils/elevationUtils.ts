export interface ElevationPoint {
    dist: number; // distance from start in km
    ele: number;
    originalEle: number;
    gradient: number;
    speed: number;
    time: number; // time from start in hours
    cumElevation: number; // cumulative elevation gain in meters
    realCumElevation: number; // cumulative elevation gain based on original elevations
    lat: number;
    lon: number;
}

function gaussianSmooth(
    elevations: number[],
    cumulativeDistances: number[],
    sigmaKm: number = 0.6 // 600 meters sigma, was 200 meters
): number[] {
    const smoothed = new Array(elevations.length).fill(0);
    const windowRadius = sigmaKm * 3; // 3 sigma rule

    for (let i = 0; i < elevations.length; i++) {
        let sumWeights = 0;
        let weightedSum = 0;

        // Expand backwards
        for (let j = i; j >= 0; j--) {
            const dist = cumulativeDistances[i] - cumulativeDistances[j];
            if (dist > windowRadius) break;
            const weight = Math.exp(-(dist * dist) / (2 * sigmaKm * sigmaKm));
            weightedSum += elevations[j] * weight;
            sumWeights += weight;
        }

        // Expand forwards (start from i+1)
        for (let j = i + 1; j < elevations.length; j++) {
            const dist = cumulativeDistances[j] - cumulativeDistances[i];
            if (dist > windowRadius) break;
            const weight = Math.exp(-(dist * dist) / (2 * sigmaKm * sigmaKm));
            weightedSum += elevations[j] * weight;
            sumWeights += weight;
        }

        smoothed[i] = weightedSum / sumWeights;
    }

    return smoothed;
}

export function calculateElevationProfile(
    points: [number, number, number][], // lat, lon, ele
    cumulativeDistances: number[], // in km
    targetSpeed: number = 32.0, // Target average speed
    isMountainRegion: boolean = false
): ElevationPoint[] {
    if (points.length < 2) return [];

    // 1. Extract elevation
    const elevations = points.map(p => p[2]);

    // 2. Smooth elevation
    // Use Gaussian smoothing for better noise reduction
    const smoothedElevations = gaussianSmooth(elevations, cumulativeDistances);

    // 3. Calculate Gradient
    // Window ~200m.
    const windowDistKm = 0.20; // 200 meters
    const gradients = new Array(points.length).fill(0);
    
    // Distances are in km, convert to meters for calculation consistency with python script if needed
    // Python script uses meters for everything.
    const distsM = cumulativeDistances.map(d => d * 1000);

    for (let i = 0; i < points.length; i++) {
        let prevIdx = i;
        while (prevIdx > 0 && (distsM[i] - distsM[prevIdx]) < windowDistKm * 1000 / 2) {
            prevIdx--;
        }
        
        let nextIdx = i;
        while (nextIdx < points.length - 1 && (distsM[nextIdx] - distsM[i]) < windowDistKm * 1000 / 2) {
            nextIdx++;
        }

        const run = distsM[nextIdx] - distsM[prevIdx];
        const rise = smoothedElevations[nextIdx] - smoothedElevations[prevIdx];

        if (run > 10) {
             gradients[i] = (rise / run) * 100;
        }
    }

    // 4. Calculate Speed
    const TARGET_AVG_SPEED = targetSpeed;
    const V_FLAT_BASE = targetSpeed * 1.25; // Heuristic: Flat speed is slightly higher than average. 32/27 ~= 1.185
    // Or we can keep V_FLAT_BASE fixed? If user changes average speed, flat speed should probably scale too.
    // In original script: TARGET_AVG_SPEED = 27, V_FLAT_BASE = 32. 
    // If user sets pace to 20, flat base shouldn't be 32.
    // Let's scale V_FLAT_BASE relative to TARGET_AVG_SPEED based on the original ratio (32/27).
    
    const totalDistKm = cumulativeDistances[cumulativeDistances.length - 1];

    // Find Best K
    let bestK = 0.15;
    let minError = 1000;

    const calcTimeHours = (kVal: number) => {
        let timeH = 0;
        for (let i = 1; i < points.length; i++) {
             const distLegKm = cumulativeDistances[i] - cumulativeDistances[i-1];
             const grad = gradients[i]; // Use gradient at current point (approx)
             
             let speed = 0;
             if (grad >= 0) {
                 speed = V_FLAT_BASE / (1 + kVal * grad);
             } else {
                 speed = Math.min(65, V_FLAT_BASE * (1 + 0.05 * Math.abs(grad)));
             }
             
             if (speed <= 0) speed = 1; // prevent div by zero
             timeH += distLegKm / speed;
        }
        return timeH;
    };

    // Simple grid search for K
    for (let k = 0.05; k <= 0.5; k += 0.045) { // ~10 steps
        const t = calcTimeHours(k);
        const vAvg = totalDistKm / t;
        const error = Math.abs(vAvg - TARGET_AVG_SPEED);
        if (error < minError) {
            minError = error;
            bestK = k;
        }
    }

    // Calculate final speeds
    // Calculate continuous descent lengths
    const descentLengths = new Array(points.length).fill(0);
    let currentDescentStart = -1;
    for (let i = 1; i < points.length; i++) {
        if (gradients[i] < -0.5) {
            if (currentDescentStart === -1) currentDescentStart = i - 1;
            const length = cumulativeDistances[i] - cumulativeDistances[currentDescentStart];
            // Update all points in current descent
            for (let j = currentDescentStart; j <= i; j++) {
                descentLengths[j] = length;
            }
        } else {
            currentDescentStart = -1;
        }
    }

    // Calculate final speeds
    const speeds = gradients.map((grad, i) => {
        if (grad >= 0) {
            return V_FLAT_BASE / (1 + bestK * grad);
        } else {
            const absGrad = Math.abs(grad);
            let maxSpeed = 75;
            
            if (isMountainRegion) {
                // In mountains: -10% slope > 1km length -> 95 km/h
                // Proportionally scale: speed = V_FLAT_BASE * (1 + coef * absGrad)
                // If at absGrad=10, speed should be 95 (if length > 1)
                // 95 = V_FLAT_BASE * (1 + coef * 10) => coef = (95/V_FLAT_BASE - 1) / 10
                const mountainCoef = descentLengths[i] > 1.0 
                    ? (95 / V_FLAT_BASE - 1) / 10 
                    : (75 / V_FLAT_BASE - 1) / 10; // Lower limit for short descents even in mountains
                maxSpeed = V_FLAT_BASE * (1 + mountainCoef * absGrad);
            } else {
                // Central Russia: 10-12% slope -> 75 km/h
                // 75 = V_FLAT_BASE * (1 + coef * 11) => coef = (75/V_FLAT_BASE - 1) / 11
                const centralCoef = (75 / V_FLAT_BASE - 1) / 11;
                maxSpeed = V_FLAT_BASE * (1 + centralCoef * absGrad);
            }

            // Fallback to original formula logic but capped by our new regional/length maxSpeed
            const calculatedSpeed = V_FLAT_BASE * (1 + 0.05 * absGrad);
            return Math.min(maxSpeed, calculatedSpeed);
        }
    });

    // 5. Calculate Time and Cumulative Elevation
    const times: number[] = [0]; // in hours
    const cumElevations: number[] = [0]; // in meters
    const realCumElevations: number[] = [0]; // in meters
    
    let totalTime = 0;
    let totalAscent = 0;
    let totalRealAscent = 0;
    
    for (let i = 1; i < points.length; i++) {
        const distLegKm = cumulativeDistances[i] - cumulativeDistances[i-1];
        const speed = speeds[i]; // Use speed at current point
        
        // Time
        const timeLeg = distLegKm / speed;
        totalTime += timeLeg;
        times.push(totalTime);
        
        // Elevation Gain
        // Use smoothed elevation for consistency
        const eleDiff = smoothedElevations[i] - smoothedElevations[i-1];
        if (eleDiff > 0) {
            totalAscent += eleDiff;
        }
        cumElevations.push(totalAscent);

        // Real Elevation Gain
        const realEleDiff = elevations[i] - elevations[i-1];
        if (realEleDiff > 0) {
            totalRealAscent += realEleDiff;
        }
        realCumElevations.push(totalRealAscent);
    }

    // Assemble result
    return points.map((p, i) => ({
        dist: cumulativeDistances[i],
        ele: smoothedElevations[i],
        originalEle: elevations[i],
        gradient: gradients[i],
        speed: speeds[i],
        time: times[i],
        cumElevation: cumElevations[i],
        realCumElevation: realCumElevations[i],
        lat: p[0],
        lon: p[1]
    }));
}

export function getGradientColor(g: number): string {
    if (g < 1) return '#999999';   // Flat
    if (g < 3) return '#777777';   // Easy
    if (g < 6) return '#555555';   // Moderate
    if (g < 10) return '#333333';  // Steep
    if (g < 15) return '#111111';  // Very steep
    return '#000000';             // Extreme
}

export function calculateProfileScore(
    points: [number, number, number][], 
    cumulativeDistances: number[]
): number {
    // Reuse calculation logic to get gradients (and smoothed elevations)
    // We use isMountainRegion=false and default speed as they don't affect gradients/distances much
    // (except descentLengths optimization for speed, but gradients are calculated before that? 
    // Wait, gradients are calculated in step 3. Speeds in step 4. So it's fine.)
    const data = calculateElevationProfile(points, cumulativeDistances);
    
    if (data.length < 2) return 0;

    let totalScore = 0;
    const totalDist = data[data.length - 1].dist;
    
    for (let i = 1; i < data.length; i++) {
        const p = data[i];
        const prev = data[i-1];
        const lengthKm = p.dist - prev.dist;
        const grad = p.gradient; 
        
        // Only consider positive gradients significantly above 0
        // Use 0.5% as threshold to filter noise
        if (grad > 0.5) { 
            const steepness = grad;
            // Formula: (Steepness / 2)^2 * Length
            const segmentScore = Math.pow(steepness / 2, 2) * lengthKm;
            
            // Weighting based on distance from finish
            const distFromFinish = totalDist - p.dist;
            let factor = 0.2;
            if (distFromFinish <= 10) factor = 1.0;
            else if (distFromFinish <= 25) factor = 0.8;
            else if (distFromFinish <= 50) factor = 0.6;
            else if (distFromFinish <= 75) factor = 0.4;
            
            totalScore += segmentScore * factor;
        }
    }
    
    return Math.round(totalScore);
}
