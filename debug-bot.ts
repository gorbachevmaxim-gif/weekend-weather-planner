import { generateBotData } from './services/botDataService.js';

(async () => {
    try {
        console.log("Starting debug run...");
        const data = await generateBotData();
        console.log("Result length:", data.length);
        console.log("First item:", JSON.stringify(data[0], null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
})();