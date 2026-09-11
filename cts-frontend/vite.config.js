import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    // Injecte automatiquement les <link rel="modulepreload"> pour les chunks critiques.
    modulePreload: true,

    // Code splitting : isole les vendors lourds pour maximiser le cache navigateur.
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom'],
          'vendor-router': ['react-router'],
          'vendor-motion': ['framer-motion'],
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
          'vendor-ui':     ['lucide-react', 'react-hot-toast'],
        },
      },
    },

    // Avertit si un chunk dépasse 500 KB.
    chunkSizeWarningLimit: 500,
  },
});
