import { defineConfig, loadEnv, type ConfigEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd(), '');
  const ollamaProxyTarget = env.VITE_OLLAMA_API_URL?.trim() || 'http://localhost:11434';
  const ollamaApiKey = env.VITE_OLLAMA_API_KEY;
  const isCloudOllama = ollamaProxyTarget.startsWith('https://') && (ollamaProxyTarget.includes('ollama.com') || ollamaProxyTarget.includes('ollama.ai'));
  const proxyHeaders = isCloudOllama && ollamaApiKey
    ? { Authorization: `Bearer ${ollamaApiKey}` }
    : {};

  return defineConfig({
    plugins: [react()],
    base: './', // Critical for correct asset loading on static hosts
    server: {
      host: true, // Listen on all addresses
      port: 5173,
      proxy: {
        '/api/ollama': {
          target: ollamaProxyTarget,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/ollama/, '/generate'),
          headers: proxyHeaders,
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'mapbox-gl'],
          },
        },
      },
    },
  })
}
