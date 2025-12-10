import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Use '.' instead of process.cwd() to avoid type error 'Property cwd does not exist on type Process'
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // This allows the app to access process.env.API_KEY during the build on Vercel
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});