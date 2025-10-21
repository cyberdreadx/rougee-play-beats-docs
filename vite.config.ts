import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      clientPort: 8080,
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      'protobufjs/minimal': 'protobufjs/minimal.js',
    },
    dedupe: ['react', 'react-dom', 'styled-components'],
  },
  optimizeDeps: {
    exclude: ['@xmtp/browser-sdk'],
    include: ['react', 'react-dom', 'protobufjs/minimal', 'styled-components'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 5000, // Increase chunk size warning limit to 5MB
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/protobufjs/, /node_modules/],
    },
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress PURE annotation warnings
        if (warning.code === 'INVALID_ANNOTATION' && warning.message.includes('/*#__PURE__*/')) {
          return;
        }
        // Suppress eval warnings from protobufjs
        if (warning.code === 'EVAL' && warning.id?.includes('protobufjs')) {
          return;
        }
        // Use default for everything else
        warn(warning);
      },
    },
  },
}));
