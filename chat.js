const chatMessagesKey = 'global_chat_messages';
const chatUsernameKey = 'global_chat_username';

let chatMessages = [];
let chatUsername = 'Guest';
let chatSocket; // Socket.io instance

function initChat() {
    try {
        console.log("initChat called!");
        loadChatUsername();

        // Diagnostic: Check Protocol
        if (window.location.protocol === 'file:') {
            console.error("Running from file protocol!");
            updateConnectionStatus(false, "Error: You are opening this as a file. Please use http://localhost:3000");
            return;
        }
    } catch (e) {
        console.error("Critical Error in initChat:", e);
        alert("Chat Error: " + e.message);
    }

    // Initialize Socket.io if not already done
    if (!chatSocket && typeof io !== 'undefined') {
        try {
            // Reuse global socket from script.js if available
            if (window.socket) {
                console.log("Chat reusing global socket");
                chatSocket = window.socket;
            } else {
                console.log("Chat creating new socket");
                const SERVER_URL = 'https://tictactoegame-zyid.onrender.com';
                chatSocket = io(SERVER_URL);
            }

            // Listen for incoming messages
            chatSocket.on('chat-message', (msg) => {
                chatMessages.push(msg);
                renderChatMessages();
                scrollToBottom();
            });

            chatSocket.on('connect', () => {
                updateConnectionStatus(true);
            });

            chatSocket.on('connect_error', (err) => {
                console.error("Socket connection error:", err);
                updateConnectionStatus(false, "Connection Failed");
            });

            chatSocket.on('disconnect', () => {
                updateConnectionStatus(false, "Disconnected");
            });
        } catch (e) {
            console.error("Socket init error:", e);
            updateConnectionStatus(false, "Init Error");
        }
    } else if (typeof io === 'undefined') {
        console.warn("Socket.io library not loaded.");
        updateConnectionStatus(false, "Error: Socket.io library not loaded. Check server.");
    }

    // We don't load local messages anymore for the "Global" chat feeling, 
    // or we could keep them. For a true "online" feel, usually you fetch recent history from server.
    // Since our server doesn't save history yet, new users will see empty chat.
    // Let's keep local storage for now as a "cache" but it might get out of sync.
    // Actually, let's CLEAR local storage messages on init to simulate "joining" the room fresh,
    // OR just rely on incoming messages.
    // Decision: Clear local array on init to avoid stale/duplicate messages if we are going full online.
    // But wait, if I refresh, I lose chat. That's annoying.
    // Let's keep the local array empty initially and only show what comes in.
    chatMessages = [];

    renderChatMessages();
    scrollToBottom();

    // Check initial status if socket exists
    if (chatSocket && chatSocket.connected) {
        updateConnectionStatus(true);
    } else if (chatSocket) {
        updateConnectionStatus(false, "Connecting...");
    }
}

function updateConnectionStatus(connected, message) {
    let statusEl = document.getElementById('chatConnectionStatus');
    if (!statusEl) {
        // Create if doesn't exist
        const header = document.querySelector('.chat-header');
        if (header) {
            const div = document.createElement('div');
            div.id = 'chatConnectionStatus';
            div.style.fontSize = '0.8rem';
            div.style.marginTop = '5px';
            div.style.textAlign = 'center';
            header.appendChild(div);
            statusEl = div; // Assign the newly created element
        }
    }

    if (statusEl) {
        if (connected) {
            statusEl.innerText = "🟢 Connected to Server";
            statusEl.style.color = "#4ade80";
        } else {
            const msg = message || "Disconnected (Offline Mode)";
            statusEl.innerText = `🔴 ${msg}`;
            statusEl.style.color = "#ef4444";
        }
    }
}

function loadChatUsername() {
    const stored = localStorage.getItem(chatUsernameKey);
    if (stored) {
        chatUsername = stored;
    } else {
        chatUsername = 'Guest' + Math.floor(Math.random() * 1000);
        localStorage.setItem(chatUsernameKey, chatUsername);
    }
    updateChatHeader();
}

function changeChatName() {
    const newName = prompt("Enter your display name:", chatUsername);
    if (newName && newName.trim() !== "") {
        chatUsername = newName.trim();
        localStorage.setItem(chatUsernameKey, chatUsername);
        updateChatHeader();
    }
}

function updateChatHeader() {
    const headerName = document.getElementById('chatCurrentName');
    if (headerName) {
        headerName.innerText = chatUsername;
    }
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    const message = {
        id: Date.now(),
        user: chatUsername,
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    console.log("Attempting to send message:", message);

    // Emit to server
    if (chatSocket && chatSocket.connected) {
        chatSocket.emit('chat-message', message);
        console.log("Message emitted to server");
    } else if (chatSocket) {
        console.warn("Socket exists but not connected. Buffering...");
        chatSocket.emit('chat-message', message);
        alert("You are offline. Message will be sent when you reconnect.");
    } else {
        // Fallback if server not running (shouldn't happen if migrated)
        console.warn("Socket.io not connected");
        chatMessages.push(message);
        renderChatMessages();
    }

    input.value = '';
    // scrollToBottom called in listener
}

function renderChatMessages() {
    const container = document.getElementById('chatHistory');
    if (!container) return;

    container.innerHTML = '';

    chatMessages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('chat-message');

        if (msg.user === chatUsername) {
            msgDiv.classList.add('sent');
        } else {
            msgDiv.classList.add('received');
        }

        msgDiv.innerHTML = `
            <div class="msg-bubble">
                <div class="msg-info">
                    <span class="msg-user">${msg.user}</span>
                    <span class="msg-time">${msg.timestamp}</span>
                </div>
                <div class="msg-text">${msg.text}</div>
            </div>
        `;
        container.appendChild(msgDiv);
    });
}

function scrollToBottom() {
    const container = document.getElementById('chatHistory');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

function clearChat() {
    if (confirm("Are you sure you want to clear all chat history? This cannot be undone.")) {
        chatMessages = [];
        saveChatMessages();
        renderChatMessages();
    }
}

// Handle Enter key in input
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('chatInput');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});

// Expose
window.initChat = initChat;
window.sendMessage = sendMessage;
window.changeChatName = changeChatName;
window.clearChat = clearChat;
