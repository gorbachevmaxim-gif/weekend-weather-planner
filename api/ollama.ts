const getApiKeyInfo = () => {
  if (process.env.OLLAMA_API_KEY) {
    return { value: process.env.OLLAMA_API_KEY, source: 'OLLAMA_API_KEY' };
  }
  if (process.env.VITE_OLLAMA_API_KEY) {
    return { value: process.env.VITE_OLLAMA_API_KEY, source: 'VITE_OLLAMA_API_KEY' };
  }
  return { value: undefined, source: 'none' };
};

const getApiBaseUrlInfo = () => {
  if (process.env.OLLAMA_API_URL) {
    return { value: process.env.OLLAMA_API_URL.replace(/\/+$/, ''), source: 'OLLAMA_API_URL' };
  }
  if (process.env.VITE_OLLAMA_API_URL) {
    return { value: process.env.VITE_OLLAMA_API_URL.replace(/\/+$/, ''), source: 'VITE_OLLAMA_API_URL' };
  }
  return { value: undefined, source: 'none' };
};

const getAuthHeaders = (apiKey: string, targetUrl: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey && (targetUrl.includes('ollama.com') || targetUrl.includes('ollama.ai'))) {
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

  const apiKeyInfo = getApiKeyInfo();
  const apiBaseUrlInfo = getApiBaseUrlInfo();

  if (!apiKeyInfo.value) {
    return res.status(500).json({ error: 'Missing Ollama API key in server environment' });
  }

  if (!apiBaseUrlInfo.value) {
    return res.status(500).json({
      error: 'Missing Ollama API URL in server environment',
      detail: 'Set OLLAMA_API_URL or VITE_OLLAMA_API_URL in your production environment variables',
    });
  }

  if (apiBaseUrlInfo.value.startsWith('http://localhost') && process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: 'Invalid Ollama API URL in production',
      detail: 'OLLAMA_API_URL must point to a remote Ollama Cloud endpoint, not localhost',
    });
  }

  const requestBody = req.body;
  if (!requestBody || typeof requestBody !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const apiKey = apiKeyInfo.value;
  const apiKeySource = apiKeyInfo.source;
  const apiBaseUrl = apiBaseUrlInfo.value;
  const baseUrlSource = apiBaseUrlInfo.source;
  const targetUrl = `${apiBaseUrl}/generate`;

  console.log('api/ollama env:', {
    apiKeySource,
    baseUrlSource,
    targetUrl,
    production: process.env.NODE_ENV === 'production',
  });

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
