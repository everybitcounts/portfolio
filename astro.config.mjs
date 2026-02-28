import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://williamvaldez.dev',
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
