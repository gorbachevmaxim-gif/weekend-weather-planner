export interface ElevationPoint {
    dist: number; // distance from start in km
    ele: number;
    gradient: number;
    speed: number;
}

// Savitzky-Golay filter implementation (Window 11, Polynomial 3)
// Coefficients for the center point of the window (size 11).
// Source: https://en.wikipedia.org/wiki/Savitzky%E2%80%93Golay_filter#Tables_of_selected_convolution_coefficients
// Window size 11, cubic/quadratic:
// Norm: 429
// Coeffs: -36, 9, 44, 69, 84, 89, 84, 69, 44, 9, -36
const SG_COEFFS_11 = [-36, 9, 44, 69, 84, 89, 84, 69, 44, 9, -36];
const SG_NORM_11 = 429;

function savitzkyGolaySmooth(values: number[]): number[] {
    const result = [...values];
    const halfWindow = Math.floor(SG_COEFFS_11.length / 2);
    
    for (let i = halfWindow; i < values.length - halfWindow; i++) {
        let sum = 0;
        for (let j = 0; j < SG_COEFFS_11.length; j++) {
            sum += values[i - halfWindow + j] * SG_COEFFS_11[j];
        }
        result[i] = sum / SG_NORM_11;
    }
    // Edges are left as is (or could be handled better, but this is simple)
    return result;
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
    const smoothedElevations = savitzkyGolaySmooth(elevations);

    // 3. Calculate Gradient
    // Window ~50m.
    const windowDistKm = 0.20; // 50 meters
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
    const V_FLAT_BASE = targetSpeed * 1.2; // Heuristic: Flat speed is slightly higher than average. 32/27 ~= 1.185
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

    // Assemble result
    return points.map((_, i) => ({
        dist: cumulativeDistances[i],
        ele: smoothedElevations[i],
        gradient: gradients[i],
        speed: speeds[i]
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
