import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          id: '/',
          name: 'Safar | Hire a driver by the hour',
          short_name: 'Safar',
          description: 'Peer-to-peer Driver-as-a-Service marketplace for Kolkata, India.',
          theme_color: '#F2B705',
          background_color: '#F5F0E6',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/favicon.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: '/favicon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    envPrefix: ['VITE_', 'OLA_'],
    define: {
      'import.meta.env.VITE_OLA_MAPS_API_KEY': JSON.stringify(
        process.env.VITE_OLA_MAPS_API_KEY ||
        process.env.VITE_OLA_MAP_API_KEY ||
        process.env.VITE_OLA_MAP_APIKEY ||
        process.env.VITE_OLA_MAPS_APIKEY ||
        process.env.OLA_MAPS_API_KEY ||
        process.env.OLA_MAP_API_KEY ||
        process.env.OLA_MAP_APIKEY ||
        process.env.OLA_MAPS_APIKEY ||
        process.env.OLA_API_KEY ||
        process.env.OLA_APIKEY ||
        process.env.VITE_OLA_API_KEY ||
        process.env.VITE_OLA_APIKEY ||
        process.env.OLA_KEY ||
        process.env.OLA_MAP_KEY ||
        process.env.OLA_MAPS_KEY ||
        process.env.VITE_OLA_KEY ||
        process.env.VITE_OLA_MAP_KEY ||
        '6iWlDgYtwdTuGrbJso3Vbq17GU6lMsiV'
      ),
      'import.meta.env.VITE_OLA_MAP_API_KEY': JSON.stringify(
        process.env.VITE_OLA_MAP_API_KEY ||
        process.env.VITE_OLA_MAPS_API_KEY ||
        process.env.VITE_OLA_MAP_APIKEY ||
        '6iWlDgYtwdTuGrbJso3Vbq17GU6lMsiV'
      ),
      'import.meta.env.VITE_OLA_MAP_APIKEY': JSON.stringify(
        process.env.VITE_OLA_MAP_APIKEY ||
        process.env.VITE_OLA_MAP_API_KEY ||
        process.env.VITE_OLA_MAPS_API_KEY ||
        '6iWlDgYtwdTuGrbJso3Vbq17GU6lMsiV'
      ),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
