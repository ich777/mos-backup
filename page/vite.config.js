import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import federation from '@originjs/vite-plugin-federation';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import pluginConfig from './plugin.config.js';

const PLUGIN_VERSION = process.env.PLUGIN_VERSION || pluginConfig.version;
const PLUGIN_NAME = pluginConfig.name;

const generateManifest = () => ({
  name: 'generate-manifest',
  closeBundle() {
    const outDir = resolve(__dirname, `dist/${PLUGIN_NAME}`);

    const manifest = {
      name: pluginConfig.name,
      displayName: pluginConfig.displayName || pluginConfig.name,
      description: pluginConfig.description || '',
      version: PLUGIN_VERSION,
      icon: pluginConfig.icon || '',
      author: pluginConfig.author || '',
      homepage: pluginConfig.homepage || '',
      widget: pluginConfig.widget || false,
    };

    try {
      mkdirSync(outDir, { recursive: true });
      writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
      console.log(`\n✓ Generated manifest.json for "${pluginConfig.displayName}"`);
      console.log(`  → dist/${PLUGIN_NAME}/manifest.json\n`);
    } catch (e) {
      console.error('Failed to generate manifest.json:', e);
    }
  },
});

export default defineConfig({
  define: {
    __PLUGIN_VERSION__: JSON.stringify(PLUGIN_VERSION),
    __PLUGIN_NAME__: JSON.stringify(pluginConfig.displayName),
  },
  plugins: [
    vue(),
    federation({
      name: PLUGIN_NAME,
      filename: 'remoteEntry.js',
      exposes: {
        './Plugin': './src/Plugin.vue',
        './Locales': './src/locales/index.js',
      },
      shared: ['vue'],
    }),
    generateManifest(),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
    outDir: `dist/${PLUGIN_NAME}`,
    assetsDir: '',
    rollupOptions: {
      input: {},
    },
  },
});
