// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://atletismo-stats.github.io',
  base: '/atletismo-stats',
  output: 'static',
  build: {
    assets: 'assets'
  }
});
