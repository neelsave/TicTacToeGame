const chatMessagesKey = 'global_chat_messages';
const chatUsernameKey = 'global_chat_username';

let chatMessages = [];
let chatUsername = 'Guest';

function initChat() {
    loadChatUsername();
    loadChatMessages();
    renderChatMessages();
    scrollToBottom();
}

function loadChatMessages() {
    const stored = localStorage.getItem(chatMessagesKey);
    if (stored) {
        chatMessages = JSON.parse(stored);
    }
}

function saveChatMessages() {
    localStorage.setItem(chatMessagesKey, JSON.stringify(chatMessages));
}

function loadChatUsername() {
    const stored = localStorage.getItem(chatUsernameKey);
    if (stored) {
        chatUsername = stored;
    } else {
        // Default random guest name if not set
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
        // Re-render to update "sent" vs "received" styles if needed (though usually based on name match)
        renderChatMessages();
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

    chatMessages.push(message);
    saveChatMessages();
    renderChatMessages();
    input.value = '';
    scrollToBottom();
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
