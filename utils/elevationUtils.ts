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
    targetSpeed: number = 27.0 // Target average speed
): ElevationPoint[] {
    if (points.length < 2) return [];

    // 1. Extract elevation
    const elevations = points.map(p => p[2]);

    // 2. Smooth elevation
    const smoothedElevations = savitzkyGolaySmooth(elevations);

    // 3. Calculate Gradient
    // Window ~50m.
    const windowDistKm = 0.05; // 50 meters
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
    const V_FLAT_BASE = targetSpeed * 1.185; // Heuristic: Flat speed is slightly higher than average. 32/27 ~= 1.185
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
    const speeds = gradients.map(grad => {
        if (grad >= 0) {
            return V_FLAT_BASE / (1 + bestK * grad);
        } else {
            return Math.min(65, V_FLAT_BASE * (1 + 0.05 * Math.abs(grad)));
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
    if (g < 1) return '#2ecc71';   // Flat (Green)
    if (g < 3) return '#f1c40f';   // Easy (Yellow)
    if (g < 6) return '#e67e22';   // Sensitive (Orange)
    if (g < 10) return '#e74c3c';  // Steep (Red)
    if (g < 15) return '#8e44ad';  // Very steep (Purple)
    return '#2c3e50';             // Extreme (Black)
}
