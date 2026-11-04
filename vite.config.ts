import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { renderLabAsset } from './tooling/render-lab-asset';
import { catalogAssets } from './tooling/catalog-assets.mjs';

export default defineConfig({
	plugins: [
    {
      name: 'require-production-build',
      configResolved(config) {
        const isSvelteKitSync = process.argv.some((arg) => arg.includes('svelte-kit') || arg.includes('sync'));
        if (config.command === 'build' && !config.isProduction && !isSvelteKitSync && process.env.npm_lifecycle_event !== 'prepare') {
          throw new Error('Production builds require NODE_ENV=production. Use NPM_CONFIG_INCLUDE=dev to install build tools.');
        }
      },
    },
    renderLabAsset(), catalogAssets(), tailwindcss(), sveltekit(),
  ]
});
