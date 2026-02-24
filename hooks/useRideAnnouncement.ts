import { useState } from 'react';
import { AI_API_CONFIG, RIDE_ANNOUNCEMENT_PROMPT } from '../prompts/rideAnnouncementPrompt';

const generateAIAnnouncement = async (summaryText: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    throw new Error("API key not configured. Check VITE_GOOGLE_AI_API_KEY in .env.local");
  }

  const prompt = `${RIDE_ANNOUNCEMENT_PROMPT}\n\n${summaryText}`;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${AI_API_CONFIG.model}:generateContent?key=${apiKey}`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: AI_API_CONFIG.temperature,
        topP: AI_API_CONFIG.topP,
        topK: AI_API_CONFIG.topK,
        maxOutputTokens: AI_API_CONFIG.maxOutputTokens,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  
  if (data.candidates && data.candidates[0] && data.candidates[0].content) {
    return data.candidates[0].content.parts[0].text;
  }
  
  if (data.error) {
    throw new Error(`API error: ${JSON.stringify(data.error)}`);
  }
  
  throw new Error("No response from AI");
};

export const useRideAnnouncement = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [announcement, setAnnouncement] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generate = async (summaryText: string) => {
        setIsGenerating(true);
        setAnnouncement(null);
        setError(null);

        try {
            const text = await generateAIAnnouncement(summaryText);
            setAnnouncement(text);
            return text;
        } catch (err: any) {
            console.error("Error generating AI announcement:", err);
            let errorMessage = err.message || "Unknown error";
            
            if (errorMessage.includes("400") && errorMessage.includes("User location is not supported")) {
                errorMessage = "Необходимо включить VPN";
            } else if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
                errorMessage = "Ошибка: квота Google AI API исчерпана";
            }
            
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    return { generate, isGenerating, announcement, error };
};
