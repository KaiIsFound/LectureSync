const localtunnel = require('localtunnel');

(async () => {
  try {
    const sub = 'lecturesync-' + Math.floor(Math.random() * 10000);
    console.log('Starting localtunnel with subdomain:', sub);
    const tunnel = await localtunnel({ port: 8080, subdomain: sub });
    console.log('Tunnel URL:', tunnel.url);
    console.log('Tunnel established. Keep this process running to maintain tunnel.');

    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });
  } catch (e) {
    console.error('Failed to create tunnel', e);
    process.exit(1);
  }
})();
