const http = require('http');
const WebSocket = require('ws');

const RELAY_PORT = process.env.RELAY_PORT ? parseInt(process.env.RELAY_PORT) : 8080;

// Maps deviceId -> { socket, ip, lastSeen }
const devices = new Map();
// Maps deviceId -> Set of subscriber sockets
const subscribers = new Map();

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/devices') {
    const out = Array.from(devices.entries()).map(([id, info]) => ({ id, ip: info.ip, lastSeen: info.lastSeen }));
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(out));
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws, req) {
  const ip = req.socket.remoteAddress;
  ws.isDevice = false;
  ws.deviceId = null;

  ws.on('message', function incoming(message, isBinary) {
    if (isBinary) {
      // binary audio from device -> forward to subscribers
      if (ws.isDevice && ws.deviceId) {
        const subs = subscribers.get(ws.deviceId);
        if (subs) {
          for (const s of subs) {
            if (s.readyState === WebSocket.OPEN) {
              s.send(message, { binary: true });
            }
          }
        }
      }
      return;
    }

    // handle text messages
    let msg = null;
    try { msg = JSON.parse(message.toString()); } catch (e) { console.log('Invalid JSON', message.toString()); }
    if (!msg || !msg.type) return;

    if (msg.type === 'register' && msg.id) {
      ws.isDevice = true;
      ws.deviceId = msg.id;
      devices.set(msg.id, { socket: ws, ip, lastSeen: Date.now() });
      console.log(`Device registered: ${msg.id} @ ${ip}`);
      ws.send(JSON.stringify({ type: 'registered', id: msg.id }));
    } else if (msg.type === 'subscribe' && msg.id) {
      const id = msg.id;
      let set = subscribers.get(id);
      if (!set) { set = new Set(); subscribers.set(id, set); }
      set.add(ws);
      ws.deviceId = id; // mark subscriber's target
      console.log(`Subscriber added for ${id} from ${ip}`);
      ws.send(JSON.stringify({ type: 'subscribed', id }));
    } else if (msg.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
    }
  });

  ws.on('close', () => {
    if (ws.isDevice && ws.deviceId) {
      console.log(`Device disconnected: ${ws.deviceId}`);
      devices.delete(ws.deviceId);
      subscribers.delete(ws.deviceId);
    } else if (ws.deviceId) {
      // remove subscriber from sets
      const set = subscribers.get(ws.deviceId);
      if (set) { set.delete(ws); }
    }
  });
});

server.listen(RELAY_PORT, () => {
  console.log(`Relay server listening on port ${RELAY_PORT}`);
  console.log('HTTP /devices  -> list connected devices');
});
