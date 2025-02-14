const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let jar = 10;
let currentPlayer = 1;
let players = [];

wss.on('connection', (ws) => {
    if (players.length < 2) {
        players.push(ws);
        ws.send(JSON.stringify({ type: 'init', jar, currentPlayer }));

        ws.on('message', (message) => {
            const data = JSON.parse(message);
            if (data.type === 'pick') {
                pickMarbles(data.numMarbles, ws);
            } else if (data.type === 'restart') {
                restartGame();
            }
        });

        ws.on('close', () => {
            players = players.filter(player => player !== ws);
        });
    } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Game is full' }));
        ws.close();
    }
});

function pickMarbles(numMarbles, ws) {
    if (numMarbles !== 1 && numMarbles !== 2) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid input.' }));
        return;
    }
    if (jar - numMarbles < 0) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not enough marbles in jar.' }));
        return;
    }

    jar -= numMarbles;

    if (jar === 0) {
        broadcast({ type: 'gameOver', winner: currentPlayer });
    } else {
        currentPlayer = 3 - currentPlayer;
        broadcast({ type: 'update', jar, currentPlayer });
    }
}

function restartGame() {
    jar = 10;
    currentPlayer = 1;
    broadcast({ type: 'restart', jar, currentPlayer });
}

function broadcast(data) {
    players.forEach(player => player.send(JSON.stringify(data)));
}

app.use(express.static('public'));

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});