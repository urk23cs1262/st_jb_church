const net = require('net');
const host = 'www.google.com';
const port = 443;

const socket = new net.Socket();
socket.setTimeout(5000);

console.log(`Testing ${host}:${port}...`);

socket.connect(port, host, () => {
    console.log(`✅ SUCCESS: Connected to ${host}:${port}`);
    socket.destroy();
});

socket.on('timeout', () => {
    console.log(`❌ TIMEOUT: Could not reach ${host}:${port} within 5s`);
    socket.destroy();
});

socket.on('error', (err) => {
    console.log(`❌ ERROR: ${host}:${port} - ${err.message}`);
    socket.destroy();
});
