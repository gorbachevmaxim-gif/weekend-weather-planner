import Redis from 'ioredis';

export default async function handler(req: any, res: any) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Check custom API key from bot
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.BOT_API_KEY && !process.env.IS_LOCAL) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }

    if (!process.env.REDIS_URL) {
        return res.status(500).json({ error: 'Missing REDIS_URL environment variable' });
    }

    const redis = new Redis(process.env.REDIS_URL);

    try {
        // Retrieve data from Redis
        const botDataStr = await redis.get('bot_rides_data');
        
        if (!botDataStr) {
            await redis.quit();
            return res.status(404).json({ 
                error: 'Not Found', 
                message: 'No ride data found. Cron job might not have run yet.' 
            });
        }

        let botData;
        if (typeof botDataStr === 'string') {
            botData = JSON.parse(botDataStr);
        } else {
            botData = botDataStr;
        }

        // Add a helper field for easy Telegram bot iteration (grouping by date)
        const groupedByDate = botData.data.reduce((acc: any, ride: any) => {
            if (!acc[ride.date]) {
                acc[ride.date] = {
                    dayName: ride.dayName,
                    rides: []
                };
            }
            acc[ride.date].rides.push(ride);
            return acc;
        }, {});

        const responseData = {
            ...botData,
            groupedByDate
        };

        await redis.quit();
        return res.status(200).json(responseData);
    } catch (error: any) {
        console.error('Error fetching bot data:', error);
        await redis.quit();
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
