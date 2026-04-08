import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.william-valdez.engineer',
  output: 'static',
  build: {
    assets: 'assets'
  },
  vite: {
    build: {
      cssMinify: true
    }
  }
});
