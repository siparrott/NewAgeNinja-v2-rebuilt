// Vercel serverless function entry point
const express = require('express');

// Simple health check API for Vercel deployment testing
const app = express();

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/*', (req, res) => {
  res.status(501).json({ 
    message: 'API endpoint not implemented yet',
    path: req.path,
    note: 'Working on database integration'
  });
});

module.exports = app;