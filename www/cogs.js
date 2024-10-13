/* global process:false */

import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

const { env } = process;

export default {
  public: {
    builds: { 'src/public/**/*': { base: 'src/public', dir: 'dist' } }
  },
  icons: {
    builds: {
      'node_modules/lucide-static/icons/**/*': {
        base: 'node_modules/lucide-static/icons',
        dir: 'dist/icons'
      }
    }
  },
  main: {
    transformers: [
      {
        name: 'esbuild',
        only: '**/*.js',
        options: {
          format: 'cjs',
          jsx: 'automatic',
          jsxDev: env.VERSION === 'development',
          target: 'es2020',
          loader: 'jsx',
          jsxImportSource: 'endr'
        }
      },
      {
        name: 'concat-commonjs',
        only: '**/*.js',
        options: { entry: 'src/entry.js', resolverGlobal: 'spike' }
      },
      {
        name: 'postcss',
        only: 'src/index.css',
        options: {
          plugins: [tailwindcss({ content: ['src/**/*'] }), autoprefixer]
        }
      }
    ],
    builds: {
      'src/entry.js': { base: 'src', dir: 'dist' },
      'src/index.css': { base: 'src', dir: 'dist' }
    },
    manifestPath: 'dist/manifest.json'
  },
  inlineEntry: {
    requires: 'main',
    transformers: ['underscore-template'],
    builds: { 'src/inline-entry.js': { base: 'src', dir: 'dist' } }
  },
  indexAndNginx: {
    requires: 'inlineEntry',
    transformers: 'underscore-template',
    builds: {
      'src/index.html': { base: 'src', dir: 'dist' },
      'src/nginx.conf': { base: 'src', dir: '/usr/local/nginx/conf' }
    }
  }
};
