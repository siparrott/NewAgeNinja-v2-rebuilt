// Nuclear option: Complete console silence
// This script completely disables all console output in production

// Override all console methods globally and permanently
const originalConsole = global.console;

const silentConsole = {
  log: () => {},
  warn: () => {},
  error: () => {},
  info: () => {},
  debug: () => {},
  trace: () => {},
  table: () => {},
  group: () => {},
  groupEnd: () => {},
  groupCollapsed: () => {},
  time: () => {},
  timeEnd: () => {},
  timeLog: () => {},
  clear: () => {},
  count: () => {},
  countReset: () => {},
  assert: () => {},
  dir: () => {},
  dirxml: () => {},
  profile: () => {},
  profileEnd: () => {},
  timeStamp: () => {}
};

// Replace global console
global.console = silentConsole;
console = silentConsole;

// Prevent console from being restored
Object.defineProperty(global, 'console', {
  value: silentConsole,
  writable: false,
  configurable: false
});

export default silentConsole;