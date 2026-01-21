async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 100): Promise<T | null> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            if (i < retries - 1) {
                console.warn(`Retry attempt ${i + 1}/${retries} failed. Retrying in ${delay}ms...`, error.message);
                await new Promise(res => setTimeout(res, delay));
            } else {
                throw error; // Last attempt failed, re-throw the error
            }
        }
    }
    return null;
}

import { Place } from '../types';

// Simple cache to prevent spamming the API when switching tabs/routes
const cache: Record<string, Place[]> = {};

// NOTE: fetchNearbyPlaces function has been removed as per user request.