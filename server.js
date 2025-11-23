const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Serve static files from the current directory
app.use(express.static(__dirname));

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle chat messages
    socket.on('chat-message', (msg) => {
        // Broadcast the message to all connected clients (including sender if we want, 
        // but usually sender adds it locally immediately. Let's broadcast to everyone else)
        // Actually, for simplicity, let's broadcast to everyone including sender so order is consistent?
        // Or standard pattern: sender sees it immediately, others see it via broadcast.
        // Let's use io.emit to send to everyone including sender for absolute consistency in this simple app.
        io.emit('chat-message', msg);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
