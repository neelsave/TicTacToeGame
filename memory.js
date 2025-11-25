const MEMORY_CARDS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
let memoryGrid = [];
let memoryFlippedCards = [];
let memoryMatchedPairs = 0;
let memoryPlayer1Score = 0;
let memoryPlayer2Score = 0;
let memoryCurrentPlayer = 1;
let memoryLockBoard = false;
let memoryIsOnline = false;
let memoryMyPlayer = 1; // 1 or 2
let memoryRoomId = null;
let memoryListenersAttached = false;

function initMemory() {
    showMemorySetup();
    attachMemoryListeners();
    setMemoryMode('local');
}

function showMemorySetup() {
    const memorySetupScreen = document.getElementById('memorySetupScreen');
    const memoryGameContainer = document.getElementById('memoryGameContainer');
    if (memorySetupScreen) memorySetupScreen.classList.remove('hidden');
    if (memoryGameContainer) memoryGameContainer.classList.add('hidden');
}

function setMemoryMode(mode) {
    const memoryModeLocalBtn = document.getElementById('memoryModeLocalBtn');
    const memoryModeOnlineBtn = document.getElementById('memoryModeOnlineBtn');
    const memoryLocalSetup = document.getElementById('memoryLocalSetup');
    const memoryOnlineSetup = document.getElementById('memoryOnlineSetup');

    if (!memoryModeLocalBtn || !memoryModeOnlineBtn) return;

    memoryModeLocalBtn.classList.remove('active');
    memoryModeOnlineBtn.classList.remove('active');
    memoryLocalSetup.classList.add('hidden');
    memoryOnlineSetup.classList.add('hidden');

    if (mode === 'local') {
        memoryIsOnline = false;
        memoryModeLocalBtn.classList.add('active');
        memoryLocalSetup.classList.remove('hidden');
    } else {
        memoryIsOnline = true;
        memoryModeOnlineBtn.classList.add('active');
        memoryOnlineSetup.classList.remove('hidden');
        initMemorySocket();
    }
}

function attachMemoryListeners() {
    if (memoryListenersAttached) return;

    const localBtn = document.getElementById('memoryModeLocalBtn');
    const onlineBtn = document.getElementById('memoryModeOnlineBtn');
    const startLocalBtn = document.getElementById('memoryStartLocalBtn');
    const createBtn = document.getElementById('memoryCreateBtn');
    const joinBtn = document.getElementById('memoryJoinBtn');

    if (localBtn) localBtn.addEventListener('click', () => setMemoryMode('local'));
    if (onlineBtn) onlineBtn.addEventListener('click', () => setMemoryMode('online'));
    if (startLocalBtn) startLocalBtn.addEventListener('click', startLocalMemoryGame);

    if (createBtn) {
        createBtn.addEventListener('click', () => {
            const memoryRoomInput = document.getElementById('memoryRoomInput');
            const roomId = memoryRoomInput.value.trim() || 'MEM-' + Math.floor(Math.random() * 1000);
            socket.emit('create-memory-room', roomId);
        });
    }

    if (joinBtn) {
        joinBtn.addEventListener('click', () => {
            const memoryRoomInput = document.getElementById('memoryRoomInput');
            const roomId = memoryRoomInput.value.trim();
            if (roomId) socket.emit('join-memory-room', roomId);
            else alert("Enter Room ID");
        });
    }

    memoryListenersAttached = true;
    console.log("Memory Match listeners attached");
}

function startLocalMemoryGame() {
    memoryIsOnline = false;
    memoryMyPlayer = 1; // Local play control both
    startGameLogic();
}

function startGameLogic(gridData = null) {
    if (gridData) {
        memoryGrid = gridData;
    } else {
        memoryGrid = [...MEMORY_CARDS, ...MEMORY_CARDS];
        memoryGrid.sort(() => 0.5 - Math.random());
    }

    memoryFlippedCards = [];
    memoryMatchedPairs = 0;
    memoryPlayer1Score = 0;
    memoryPlayer2Score = 0;
    memoryCurrentPlayer = 1;
    memoryLockBoard = false;

    updateMemoryScore();
    updateMemoryStatus();
    renderMemoryBoard();

    const memorySetupScreen = document.getElementById('memorySetupScreen');
    const memoryGameContainer = document.getElementById('memoryGameContainer');
    if (memorySetupScreen) memorySetupScreen.classList.add('hidden');
    if (memoryGameContainer) memoryGameContainer.classList.remove('hidden');
}

function renderMemoryBoard() {
    const memoryBoardElement = document.getElementById('memoryBoard');
    if (!memoryBoardElement) return;

    memoryBoardElement.innerHTML = '';
    memoryGrid.forEach((icon, index) => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.index = index;
        card.onclick = () => handleCardClick(index, icon);

        const front = document.createElement('div');
        front.classList.add('front');
        front.innerText = '?';

        const back = document.createElement('div');
        back.classList.add('back');
        back.innerText = icon;

        card.appendChild(front);
        card.appendChild(back);
        memoryBoardElement.appendChild(card);
    });
}

function handleCardClick(index, icon) {
    if (memoryLockBoard) return;

    // Online check
    if (memoryIsOnline) {
        if (memoryCurrentPlayer !== memoryMyPlayer) return;
    }

    const memoryBoardElement = document.getElementById('memoryBoard');
    const card = memoryBoardElement.children[index];
    if (card.classList.contains('flipped')) return;

    // If online, emit move
    if (memoryIsOnline) {
        socket.emit('memory-flip', { roomId: memoryRoomId, index, icon });
    } else {
        performFlip(index, icon);
    }
}

function performFlip(index, icon) {
    const memoryBoardElement = document.getElementById('memoryBoard');
    const card = memoryBoardElement.children[index];
    card.classList.add('flipped');
    memoryFlippedCards.push({ index, icon, card });

    if (memoryFlippedCards.length === 2) {
        checkMatch();
    }
}

function checkMatch() {
    const [c1, c2] = memoryFlippedCards;
    const isMatch = c1.icon === c2.icon;

    if (isMatch) {
        disableCards();
        updateScore(true);
    } else {
        unflipCards();
    }
}

function disableCards() {
    memoryFlippedCards = [];
    memoryMatchedPairs++;
    if (memoryMatchedPairs === MEMORY_CARDS.length) {
        setTimeout(() => {
            const memoryStatusDisplay = document.getElementById('memoryStatusDisplay');
            let winner = memoryPlayer1Score > memoryPlayer2Score ? 'Player 1' : (memoryPlayer2Score > memoryPlayer1Score ? 'Player 2' : 'Draw');
            if (memoryStatusDisplay) memoryStatusDisplay.innerText = `Game Over! ${winner === 'Draw' ? 'It\'s a Draw!' : winner + ' Wins!'}`;
        }, 500);
    }
}

function unflipCards() {
    memoryLockBoard = true;
    setTimeout(() => {
        const memoryBoardElement = document.getElementById('memoryBoard');
        memoryFlippedCards.forEach(item => {
            const card = memoryBoardElement.children[item.index];
            if (card) card.classList.remove('flipped');
        });
        memoryFlippedCards = [];
        memoryLockBoard = false;

        // Switch turn
        memoryCurrentPlayer = memoryCurrentPlayer === 1 ? 2 : 1;
        updateMemoryStatus();
    }, 1000);
}

function updateScore(match) {
    if (match) {
        if (memoryCurrentPlayer === 1) memoryPlayer1Score++;
        else memoryPlayer2Score++;
        updateMemoryScore();
    }
}

function updateMemoryScore() {
    const memoryScore1 = document.getElementById('memoryScore1');
    const memoryScore2 = document.getElementById('memoryScore2');
    if (memoryScore1) memoryScore1.innerText = memoryPlayer1Score;
    if (memoryScore2) memoryScore2.innerText = memoryPlayer2Score;
}

function updateMemoryStatus() {
    const memoryStatusDisplay = document.getElementById('memoryStatusDisplay');
    if (memoryStatusDisplay) {
        if (memoryIsOnline) {
            const isMyTurn = memoryCurrentPlayer === memoryMyPlayer;
            memoryStatusDisplay.innerHTML = isMyTurn ?
                `<span style="color: #4ade80">Your Turn</span>` :
                `<span style="color: #ef4444">Opponent's Turn</span>`;
        } else {
            memoryStatusDisplay.innerHTML = `Player <span class="${memoryCurrentPlayer === 1 ? 'text-blue' : 'text-green'}">${memoryCurrentPlayer}</span>'s Turn`;
        }
    }
}

function resetMemoryGame() {
    if (memoryIsOnline) {
        socket.emit('memory-reset', memoryRoomId);
    } else {
        startLocalMemoryGame();
    }
}

// --- Online Logic ---
function initMemorySocket() {
    if (typeof io === 'undefined') {
        console.error("Socket.io library not loaded");
        return;
    }

    // Use global socket or create new one
    if (!window.socket) {
        window.socket = io('https://tictactoegame-zyid.onrender.com');
    }
    // Ensure local reference uses global socket
    socket = window.socket;

    socket.off('memory-joined');
    socket.off('memory-start');
    socket.off('memory-flip');
    socket.off('memory-reset');
    socket.off('memory-error');

    socket.on('memory-joined', (data) => {
        memoryMyPlayer = data.player; // 1 or 2
        memoryRoomId = data.roomId;
        const memoryOnlineStatus = document.getElementById('memoryOnlineStatus');
        if (memoryOnlineStatus) memoryOnlineStatus.innerText = `Joined Room: ${data.roomId}. You are Player ${data.player}. Waiting...`;
        console.log(`Joined memory room: ${data.roomId} as Player ${data.player}`);
    });

    socket.on('memory-start', (data) => {
        const memoryOnlineStatus = document.getElementById('memoryOnlineStatus');
        if (memoryOnlineStatus) memoryOnlineStatus.innerText = "Game Starting!";
        startGameLogic(data.grid);
    });

    socket.on('memory-flip', (data) => {
        performFlip(data.index, data.icon);
    });

    socket.on('memory-reset', (data) => {
        startGameLogic(data.grid);
    });

    socket.on('memory-error', (msg) => {
        alert(msg);
        console.error("Memory socket error:", msg);
    });

    socket.on('room-list-update', (data) => {
        if (data.type === 'memory') {
            renderMemoryRoomList(data.rooms);
        }
    });

    // Request initial list
    socket.emit('get-rooms', 'memory');
}

function renderMemoryRoomList(rooms) {
    const list = document.getElementById('memoryRoomList');
    if (!list) return;
    list.innerHTML = '<h3>Available Rooms:</h3>';
    if (rooms.length === 0) {
        list.innerHTML += '<p>No active rooms</p>';
        return;
    }
    rooms.forEach(room => {
        const div = document.createElement('div');
        div.className = 'room-item';
        div.innerHTML = `<span>${room.id} (${room.count}/2)</span>`;
        const btn = document.createElement('button');
        btn.innerText = 'Join';
        btn.onclick = () => {
            const input = document.getElementById('memoryRoomInput');
            if (input) input.value = room.id;
            socket.emit('join-memory-room', room.id);
        };
        div.appendChild(btn);
        list.appendChild(div);
    });
}

window.initMemory = initMemory;
window.resetMemoryGame = resetMemoryGame;
```
