const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*", // Allow all origins (GitHub Pages, localhost, etc.)
        methods: ["GET", "POST"]
    }
});
const path = require('path');

// Serve static files from the current directory
app.use(express.static(__dirname));

// Socket.io connection handling
const rooms = {};
const c4Rooms = {};
// connectedUsers: { socketId: { id: socketId, name: 'Guest' } }
const connectedUsers = {};

io.on('connection', (socket) => {
    // Default user entry
    connectedUsers[socket.id] = { id: socket.id, name: 'Guest' };

    // Broadcast updated list and count
    io.emit('update-player-list', Object.values(connectedUsers));
    io.emit('update-player-count', Object.keys(connectedUsers).length);

    console.log(`User connected: ${socket.id}. Total: ${Object.keys(connectedUsers).length}`);

    // --- User Registration ---
    socket.on('register-user', (username) => {
        if (connectedUsers[socket.id]) {
            connectedUsers[socket.id].name = username;
            io.emit('update-player-list', Object.values(connectedUsers));
        }
    });

    // --- Chat Events ---
    socket.on('chat-message', (msg) => {
        io.emit('chat-message', msg);
    });

    // --- Tic Tac Toe Events ---

    // Create Room
    socket.on('create-room', (roomId) => {
        if (rooms[roomId]) {
            socket.emit('room-error', 'Room already exists');
            return;
        }
        rooms[roomId] = {
            players: [socket.id],
            board: Array(9).fill(null),
            turn: 'X', // X always starts
            scores: { X: 0, O: 0 }
        };
        socket.join(roomId);
        socket.emit('room-created', roomId); // Confirm creation
        socket.emit('player-assigned', 'X'); // Creator is X
    });

    // Join Room
    socket.on('join-room', (roomId) => {
        console.log(`Socket ${socket.id} trying to join room ${roomId}`);
        const room = rooms[roomId];
        if (!room) {
            socket.emit('room-error', 'Room not found');
            return;
        }
        if (room.players.includes(socket.id)) {
            socket.emit('room-error', 'You are already in this room');
            return;
        }
        if (room.players.length >= 2) {
            socket.emit('room-error', 'Room is full');
            return;
        }

        room.players.push(socket.id);
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}. Players: ${room.players.length}`);

        socket.emit('room-joined', roomId);
        socket.emit('player-assigned', 'O'); // Joiner is O

        // Notify both that game can start
        if (room.players.length === 2) {
            console.log(`Room ${roomId} is full. Starting game.`);
            io.to(roomId).emit('game-start', {
                turn: room.turn,
                scores: room.scores
            });
        }
    });

    // Make Move
    socket.on('make-move', ({ roomId, index, player }) => {
        const room = rooms[roomId];
        if (!room) return;

        // Validate turn
        if (room.turn !== player) return;

        // Validate move
        if (room.board[index] !== null) return;

        // Update state
        room.board[index] = player;
        room.turn = player === 'X' ? 'O' : 'X';

        // Broadcast update
        io.to(roomId).emit('update-board', {
            board: room.board,
            turn: room.turn
        });

        // Check Win/Draw (Basic check here or rely on client? Better on server but client is easier for now. 
        // Let's rely on client to detect win and send 'game-over' or just sync board and let clients decide.
        // For security server should check, but for this simple app, syncing board is enough.
        // However, we need to sync scores if someone wins.
        // Let's let the client who made the move check for win and emit 'win' event? 
        // No, better to just sync board and let clients handle UI.
        // But we need to know when to reset or update scores.
        // Let's add a 'round-end' event if we want server to track scores.
        // For now, let's just sync moves.
    });

    // Reset Game
    socket.on('reset-game', (roomId) => {
        const room = rooms[roomId];
        if (room) {
            room.board = Array(9).fill(null);
            room.turn = 'X';
            io.to(roomId).emit('reset-board');
        }
    });



    // --- Connect Four Events ---
    // c4Rooms is now global


    socket.on('join-c4', (roomId) => {
        let room = c4Rooms[roomId];
        if (!room) {
            room = {
                players: [],
                board: Array(42).fill(null), // 6 rows * 7 cols
                turn: 'Red',
                gameActive: true
            };
            c4Rooms[roomId] = room;
        }

        if (room.players.includes(socket.id)) {
            socket.emit('c4-error', 'You are already in this room');
            return;
        }

        if (room.players.length >= 2) {
            socket.emit('c4-error', 'Room is full');
            return;
        }

        room.players.push(socket.id);
        socket.join(roomId);

        // Assign color
        const color = room.players.length === 1 ? 'Red' : 'Yellow';
        socket.emit('c4-player-assigned', color);

        // Notify start
        if (room.players.length === 2) {
            io.to(roomId).emit('c4-start', { turn: room.turn });
        }
    });

    socket.on('make-move-c4', ({ roomId, col, player }) => {
        const room = c4Rooms[roomId];
        if (!room || !room.gameActive) return;
        if (room.turn !== player) return;

        // Find lowest empty row in col
        // Board index = row * 7 + col
        // We need to update the board state on server
        // Logic: Iterate from bottom row (5) up to 0
        let rowToPlace = -1;
        for (let r = 5; r >= 0; r--) {
            const idx = r * 7 + col;
            if (room.board[idx] === null) {
                rowToPlace = r;
                break;
            }
        }

        if (rowToPlace === -1) return; // Column full

        const index = rowToPlace * 7 + col;
        room.board[index] = player;

        // Switch turn
        room.turn = room.turn === 'Red' ? 'Yellow' : 'Red';

        io.to(roomId).emit('c4-update-board', {
            row: rowToPlace,
            col: col,
            player: player,
            turn: room.turn
        });
    });

    socket.on('reset-c4', (roomId) => {
        const room = c4Rooms[roomId];
        if (room) {
            room.board = Array(42).fill(null);
            room.turn = 'Red';
            room.gameActive = true;
            io.to(roomId).emit('c4-reset');
        }
    });

    // --- Business Game Events ---
    const businessRooms = {};

    socket.on('create-business-room', (roomId) => {
        if (businessRooms[roomId]) {
            socket.emit('business-error', 'Room exists');
            return;
        }
        businessRooms[roomId] = {
            players: [{ id: socket.id, money: 1500, position: 0, properties: [] }],
            turnIndex: 0,
            gameActive: false
        };
        socket.join(roomId);
        socket.emit('business-joined', { roomId });
    });

    socket.on('join-business-room', (roomId) => {
        const room = businessRooms[roomId];
        if (!room) {
            socket.emit('business-error', 'Room not found');
            return;
        }
        if (room.players.length >= 4) {
            socket.emit('business-error', 'Room full');
            return;
        }

        room.players.push({ id: socket.id, money: 1500, position: 0, properties: [] });
        socket.join(roomId);
        socket.emit('business-joined', { roomId });

        // Auto-start if 2+ players (for testing) or wait for explicit start?
        // Let's auto-start for now or just broadcast update
        if (room.players.length >= 2) {
            io.to(roomId).emit('business-start', {
                players: room.players,
                turnIndex: room.turnIndex
            });
        }
    });

    socket.on('business-roll-dice', ({ roomId }) => {
        const room = businessRooms[roomId];
        if (!room) return;

        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const total = dice1 + dice2;

        const player = room.players[room.turnIndex];
        player.position = (player.position + total) % 40;

        // Next turn
        room.turnIndex = (room.turnIndex + 1) % room.players.length;

        io.to(roomId).emit('business-update', {
            players: room.players,
            turnIndex: room.turnIndex,
            lastDice: total
        });
    });

    socket.on('disconnect', () => {
        delete connectedUsers[socket.id];
        io.emit('update-player-list', Object.values(connectedUsers));
        io.emit('update-player-count', Object.keys(connectedUsers).length);

        console.log(`User disconnected: ${socket.id}. Total: ${Object.keys(connectedUsers).length}`);
        // Handle cleanup for Tic Tac Toe
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.players.includes(socket.id)) {
                room.players = room.players.filter(id => id !== socket.id);
                io.to(roomId).emit('player-left');
                if (room.players.length === 0) delete rooms[roomId];
            }
        }
        // Handle cleanup for Connect Four
        for (const roomId in c4Rooms) {
            const room = c4Rooms[roomId];
            if (room.players.includes(socket.id)) {
                room.players = room.players.filter(id => id !== socket.id);
                io.to(roomId).emit('c4-player-left');
                if (room.players.length === 0) delete c4Rooms[roomId];
            }
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
