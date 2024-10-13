/* global process:false */

import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

const { env } = process;

export default {
  public: {
    builds: { 'src/public/**/*': { base: 'src/public', dir: 'dist' } }
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
          plugins: [
            tailwindcss({
              content: ['src/**/*'],
              theme: {
                extend: {
                  keyframes: {
                    rotate: {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    },
                    reverseRotate: {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(-360deg)' }
                    },
                    expRotate: {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(18000deg)' } // Rotate 100 times
                    },
                    slideInUp: {
                      from: { transform: 'translateY(100%)' },
                      to: { transform: 'translateY(0)' }
                    },
                    slideInLeft: {
                      from: { transform: 'translateX(-100%)' },
                      to: { transform: 'translateX(0)' }
                    },
                    slideInRight: {
                      from: { transform: 'translateX(100%)' },
                      to: { transform: 'translateX(0)' }
                    },
                    slideOutLeft: {
                      from: { transform: 'translateX(0)' },
                      to: { transform: 'translateX(-100%)' }
                    },
                    slideOutRight: {
                      from: { transform: 'translateX(0)' },
                      to: { transform: 'translateX(100%)' }
                    }
                  },
                  animation: {
                    'cw-spin': 'rotate 180s linear infinite',
                    'ccw-spin': 'reverseRotate 180s linear infinite',
                    'exp-spin':
                      'expRotate 6s cubic-bezier(0.1, 0.9, 0.3, 1) reverse',
                    slideInUp: 'slideInUp 0.5s forwards ease-out',
                    slideInLeft: 'slideInLeft 0.5s forwards ease-out',
                    slideInRight: 'slideInRight 0.5s forwards ease-out',
                    slideOutLeft: 'slideOutLeft 0.5s forwards ease-out',
                    slideOutRight: 'slideOutRight 0.5s forwards ease-out'
                  }
                }
              }
            }),
            autoprefixer
          ]
        }
      }
    ],
    builds: {
      'src/entry.js': { base: 'src', dir: 'dist' },
      'src/index.css': { base: 'src', dir: 'dist' }
    },
    manifestPath: 'dist/manifest.json'
  },
  index: {
    requires: 'main',
    transformers: 'underscore-template',
    builds: {
      'src/index.html': { base: 'src', dir: 'dist' },
      'src/nginx.conf': { base: 'src', dir: '/usr/local/nginx/conf' }
    }
  }
};
