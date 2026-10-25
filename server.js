import http from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocket, WebSocketServer } from 'ws';

const PORT = 3001;

const server = http.createServer((req, res) => {
	if (req.method === 'GET' && req.url === '/') {
		const filePath = path.resolve('public/index.html');

		fs.readFile(filePath, (error, data) => {
			if (error) {
				res.writeHead(500, { 'Content-Type': 'text/plain' });
				res.end('Unable to read the requested file.');
				return;
			}

			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.end(data);
		});
		return;
	}

	res.writeHead(404, { 'Content-Type': 'text/plain' });
	res.end('Not found');
});

const wss = new WebSocketServer({ server });

function broadcast(message) {
	const serializedMessage = JSON.stringify(message);

	wss.clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(serializedMessage);
		}
	});
}

wss.on('connection', (socket, req) => {
	const username = new URL(req.url, "http://localhost").searchParams.get("username");

	broadcast({ type: 'system', text: `${username} joined` });

	socket.on('message', (message) => {
		const { username, text } = JSON.parse(message);
		broadcast({ type: 'chat', username, text });
	});

	socket.on('close', () => {
		broadcast({ type: 'system', text: `${username} left` });
	});
});

server.listen(PORT, () => {
	console.log(`Chat server running at http://localhost:${PORT}`);
});
