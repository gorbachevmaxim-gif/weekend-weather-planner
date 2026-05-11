const getApiKey = () => process.env.OLLAMA_API_KEY || process.env.VITE_OLLAMA_API_KEY;
const getApiBaseUrl = () => {
  const url = process.env.OLLAMA_API_URL || process.env.VITE_OLLAMA_API_URL || 'http://localhost:11434';
  return url.replace(/\/+$/, '');
};

const getAuthHeaders = (apiKey: string, targetUrl: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (targetUrl.includes('ollama.com') || targetUrl.includes('ollama.ai')) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
};

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing Ollama API key in server environment' });
  }

  const requestBody = req.body;
  if (!requestBody || typeof requestBody !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const targetUrl = `${getApiBaseUrl()}/generate`;

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: getAuthHeaders(apiKey, targetUrl),
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    let responseData: any = responseText;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      // Keep text as-is if the remote response is not valid JSON
    }

    res.status(response.status).setHeader('Content-Type', 'application/json');
    if (typeof responseData === 'object') {
      return res.json(responseData);
    }

    return res.end(responseText);
  } catch (error: any) {
    console.error('Ollama proxy error:', error);
    return res.status(500).json({ error: 'Failed to proxy request to Ollama', detail: error?.message });
  }
}
