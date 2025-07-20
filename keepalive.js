import http from 'http';

const PORT = process.env.PORT || 5000;

// Create a simple HTTP server for keep-alive pings
http.createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
}).listen(PORT + 1); // Use PORT + 1 to avoid conflicts

// Ping itself every 50 seconds to keep Replit container warm
setInterval(() => {
  fetch(`http://127.0.0.1:${PORT + 1}`).catch(() => {
    // Ignore connection errors - this is just to keep container alive
  });
}, 50_000);

console.log(`Keep-alive service running on port ${PORT + 1}`);