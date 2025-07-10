#!/usr/bin/env node

import { buildServer } from '../esbuild.config.js';

buildServer().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});