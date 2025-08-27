// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://medicendoe.github.io',
  base: '/uchile-athletics-scraping/',
  output: 'static',
  build: {
    assets: 'assets'
  },
  trailingSlash: 'ignore'
});
