// Simple WebSocket server for live chat
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8081 });

wss.on('connection', function connection(ws) {
  console.log('New client connected');
  ws.on('message', function incoming(message) {
    console.log('Received:', message.toString());
    // Broadcast to all clients, including the sender
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

console.log('Live chat WebSocket server running on ws://localhost:8081');
