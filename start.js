// CommonJS fallback start script
const { spawn } = require('child_process');
const path = require('path');

console.log('🎯 Starting via CommonJS fallback...');

const startMjs = path.resolve(__dirname, 'start.mjs');
const child = spawn('node', [startMjs], {
  stdio: 'inherit',
  env: { ...process.env }
});

child.on('exit', (code) => {
  process.exit(code);
});
