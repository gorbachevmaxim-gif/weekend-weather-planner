import dotenv from 'dotenv';
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const domain = 'gstrdnmc-bot.vercel.app'; // Судя по логам, это ваш основной домен
const webhookUrl = `https://${domain}/api/webhook`;

async function setup() {
    console.log(`Setting up webhook for bot...`);
    console.log(`URL: ${webhookUrl}`);
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`);
        const result = await response.json();
        console.log('Result:', result);
        
        const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        const info = await infoRes.json();
        console.log('Current Webhook Info:', info);
    } catch (e) {
        console.error('Error setting up webhook:', e);
    }
}

setup();
