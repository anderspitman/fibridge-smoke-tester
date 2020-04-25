import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'index.js',
  output: {
    dir: 'build',
    //dir: 'output',
    format: 'cjs'
  },
  plugins: [
    resolve(),
  ]
};
