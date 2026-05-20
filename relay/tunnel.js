const localtunnel = require('localtunnel');

const PORT = 8080;
const SUBDOMAIN = process.env.LT_SUBDOMAIN || 'lecturesync-5960';

(async () => {
  try {
    console.log(`Tunnel :${PORT} subdomain=${SUBDOMAIN}`);
    const tunnel = await localtunnel({ port: PORT, subdomain: SUBDOMAIN });
    console.log('URL:', tunnel.url);
    console.log('ESP32 RELAY_HOST:', tunnel.url.replace('https://', '').replace('http://', ''));
    tunnel.on('close', () => console.log('Tunnel closed'));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
