import { generateBotData } from '../services/botDataService.js';
import Redis from 'ioredis';

export const maxDuration = 60; // Max allowed for hobby/pro plans depending on setup

export default async function handler(req: any, res: any) {
    // Check authorization to prevent unauthorized triggers
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !process.env.IS_LOCAL) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!process.env.REDIS_URL) {
        return res.status(500).json({ error: 'Missing REDIS_URL environment variable' });
    }

    // Connect to Redis via ioredis
    const redis = new Redis(process.env.REDIS_URL);

    try {
        console.log('Starting cron job to generate bot data...');
        const botData = await generateBotData();
        
        // Save to Redis
        await redis.set('bot_rides_data', JSON.stringify({
            timestamp: new Date().toISOString(),
            data: botData
        }));

        console.log('Successfully saved bot data to Redis.');
        await redis.quit(); // Close connection
        
        return res.status(200).json({ success: true, count: botData?.length || 0 });
    } catch (error: any) {
        console.error('Error in cron job:', error);
        await redis.quit(); // Ensure connection is closed on error
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
