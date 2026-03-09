import { generateBotData } from '../services/botDataService';
import { kv } from '@vercel/kv';

export const maxDuration = 60; // Max allowed for hobby/pro plans depending on setup

export default async function handler(req: any, res: any) {
    // Check authorization to prevent unauthorized triggers
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !process.env.IS_LOCAL) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        console.log('Starting cron job to generate bot data...');
        const botData = await generateBotData();
        
        // Save to Vercel KV
        await kv.set('bot_rides_data', JSON.stringify({
            timestamp: new Date().toISOString(),
            data: botData
        }));

        console.log('Successfully saved bot data to KV.');
        return res.status(200).json({ success: true, count: botData.length });
    } catch (error: any) {
        console.error('Error in cron job:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
