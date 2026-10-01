export default {
  resolve: { alias: {
    react: new URL('./tests/node_modules/react', import.meta.url).pathname,
    'react-dom': new URL('./tests/node_modules/react-dom', import.meta.url).pathname,
  } },
  esbuild: { jsx: 'automatic' },
  test: { include: ['tests/phase1-api.test.ts', 'tests/phase1-editor.test.tsx', 'tests/phase234-ui.test.tsx', 'tests/phase56-ui.test.tsx'], environment: 'node', pool: 'forks', maxWorkers: 1, minWorkers: 1 },
};
