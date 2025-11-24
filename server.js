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

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

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

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Handle cleanup
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.players.includes(socket.id)) {
                // Remove player
                room.players = room.players.filter(id => id !== socket.id);
                // Notify other player
                io.to(roomId).emit('player-left');
                // Delete room if empty
                if (room.players.length === 0) {
                    delete rooms[roomId];
                }
            }
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
