import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    server: {
      deps: {
        inline: [
          "@tsdotnet/queue"
        ]
      }
    }
  },
  resolve: {
    conditions: ['node', 'import', 'module', 'browser', 'default']
  }
});
