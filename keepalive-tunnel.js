const https = require('https');
setInterval(() => {
  https.get('https://retrieval-americans-toolkit-adopt.trycloudflare.com/', (res) => {
    // keepalive ping
  }).on('error', () => {});
}, 15000);
console.log('Keepalive started for Cloudflare tunnel');
