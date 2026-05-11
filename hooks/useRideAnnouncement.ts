import { useState } from 'react';
import { AI_API_CONFIG, RIDE_ANNOUNCEMENT_PROMPT } from '../prompts/rideAnnouncementPrompt';

const generateAIAnnouncement = async (summaryText: string): Promise<string> => {
  const apiUrl = '/api/ollama';
  const prompt = `${RIDE_ANNOUNCEMENT_PROMPT}\n\n${summaryText}`;
  const requestedModel = AI_API_CONFIG.model;

  const buildRequestBody = (model: string) => ({
    model,
    prompt,
    temperature: AI_API_CONFIG.temperature,
    top_p: AI_API_CONFIG.topP,
    top_k: AI_API_CONFIG.topK,
    max_tokens: AI_API_CONFIG.maxOutputTokens,
  });

  console.log('Using backend Ollama proxy:', apiUrl);
  console.log('Ollama Model:', requestedModel);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildRequestBody(requestedModel)),
    });

    const responseText = await response.text();
    if (!response.ok) {
      console.error('Ollama proxy error response:', response.status, responseText);

      if (response.status === 404 && /model .* not found/i.test(responseText)) {
        throw new Error(
          `Модель Ollama не найдена: ${requestedModel}. ` +
          `Укажите рабочую модель в VITE_OLLAMA_MODEL / OLLAMA_MODEL и перезапустите dev сервер.`
        );
      }

      throw new Error(`AI proxy error (${response.status}): ${responseText}`);
    }

    // Handle Ollama response - it might be streaming or plain JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      // If it's not valid JSON, it might be a streaming response with multiple JSON objects
      console.log('Response is not valid JSON, trying to parse as streaming response');
      const lines = responseText.trim().split('\n');
      let fullResponse = '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const chunk = JSON.parse(line);
            if (chunk.response) {
              fullResponse += chunk.response;
            }
            if (chunk.done) {
              break; // Last chunk
            }
          } catch (chunkParseError) {
            console.warn('Failed to parse chunk:', line);
          }
        }
      }

      if (fullResponse) {
        data = { response: fullResponse };
      } else {
        throw new Error(`Failed to parse Ollama response: ${responseText.substring(0, 200)}...`);
      }
    }

    console.log('Ollama proxy response data:', data);

    const announcement = data?.response;
    if (typeof announcement === 'string' && announcement.length > 0) {
      return announcement.trim();
    }

    console.error('Invalid announcement text from backend:', data);
    if (data?.error) {
      throw new Error(`AI error: ${JSON.stringify(data.error)}`);
    }

    throw new Error('AI proxy returned no announcement text');
  } catch (error: any) {
    console.error('AI announcement generation error:', error);
    if (error instanceof TypeError) {
      throw new Error(`Connection error: ${error.message}. Check the backend Ollama proxy or API key configuration.`);
    }
    throw error;
  }
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
                errorMessage = "Ошибка: квота AI API исчерпана";
            }
            
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    return { generate, isGenerating, announcement, error };
};
