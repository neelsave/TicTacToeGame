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

const memoryBoardElement = document.getElementById('memoryBoard');
const memoryStatusDisplay = document.getElementById('memoryStatusDisplay');
const memoryScore1 = document.getElementById('memoryScore1');
const memoryScore2 = document.getElementById('memoryScore2');

// UI Elements
const memorySetupScreen = document.getElementById('memorySetupScreen');
const memoryGameContainer = document.getElementById('memoryGameContainer');
const memoryModeLocalBtn = document.getElementById('memoryModeLocalBtn');
const memoryModeOnlineBtn = document.getElementById('memoryModeOnlineBtn');
const memoryLocalSetup = document.getElementById('memoryLocalSetup');
const memoryOnlineSetup = document.getElementById('memoryOnlineSetup');
const memoryRoomInput = document.getElementById('memoryRoomInput');
const memoryCreateBtn = document.getElementById('memoryCreateBtn');
const memoryJoinBtn = document.getElementById('memoryJoinBtn');
const memoryOnlineStatus = document.getElementById('memoryOnlineStatus');
const memoryStartLocalBtn = document.getElementById('memoryStartLocalBtn');

let memoryListenersAttached = false;

function initMemory() {
    showMemorySetup();
    attachMemoryListeners();
    setMemoryMode('local');
}

function attachMemoryListeners() {
    if (memoryListenersAttached) return;

    const localBtn = document.getElementById('memoryModeLocalBtn');
    const onlineBtn = document.getElementById('memoryModeOnlineBtn');
    const startLocalBtn = document.getElementById('memoryStartLocalBtn');

    if (localBtn && onlineBtn && startLocalBtn) {
        localBtn.addEventListener('click', () => setMemoryMode('local'));
        onlineBtn.addEventListener('click', () => setMemoryMode('online'));
        startLocalBtn.addEventListener('click', startLocalMemoryGame);
        memoryListenersAttached = true;
        console.log("Memory Match listeners attached");
    } else {
        console.error("Memory Match buttons not found");
    }
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

    memorySetupScreen.classList.add('hidden');
    memoryGameContainer.classList.remove('hidden');
}

function renderMemoryBoard() {
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
            let winner = memoryPlayer1Score > memoryPlayer2Score ? 'Player 1' : (memoryPlayer2Score > memoryPlayer1Score ? 'Player 2' : 'Draw');
            memoryStatusDisplay.innerText = `Game Over! ${winner === 'Draw' ? 'It\'s a Draw!' : winner + ' Wins!'}`;
        }, 500);
    }
}

function unflipCards() {
    memoryLockBoard = true;
    setTimeout(() => {
        memoryFlippedCards.forEach(item => {
            const card = memoryBoardElement.children[item.index];
            if (card) card.classList.remove('flipped');
        });
        memoryFlippedCards = [];
        memoryLockBoard = false;

        // Switch turn
        memoryCurrentPlayer = memoryCurrentPlayer === 1 ? 2 : 1;
        updateMemoryStatus();

        // If online, we need to ensure turn sync happens naturally via moves, 
        // but since we execute logic on both clients, it should stay synced.
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
    if (memoryScore1) memoryScore1.innerText = memoryPlayer1Score;
    if (memoryScore2) memoryScore2.innerText = memoryPlayer2Score;
}

function updateMemoryStatus() {
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
    if (typeof io === 'undefined') return;
    if (!socket) socket = io('https://tictactoegame-zyid.onrender.com');

    socket.off('memory-joined');
    socket.off('memory-start');
    socket.off('memory-flip');
    socket.off('memory-reset');
    socket.off('memory-error');

    socket.on('memory-joined', (data) => {
        memoryMyPlayer = data.player; // 1 or 2
        memoryRoomId = data.roomId;
        memoryOnlineStatus.innerText = `Joined Room: ${data.roomId}. You are Player ${data.player}. Waiting...`;
    });

    socket.on('memory-start', (data) => {
        memoryOnlineStatus.innerText = "Game Starting!";
        startGameLogic(data.grid);
    });

    socket.on('memory-flip', (data) => {
        performFlip(data.index, data.icon);
    });

    socket.on('memory-reset', (data) => {
        startGameLogic(data.grid);
    });

    socket.on('memory-error', (msg) => { alert(msg); });
}

if (memoryCreateBtn) {
    memoryCreateBtn.addEventListener('click', () => {
        const roomId = memoryRoomInput.value.trim() || 'MEM-' + Math.floor(Math.random() * 1000);
        socket.emit('create-memory-room', roomId);
    });
}

if (memoryJoinBtn) {
    memoryJoinBtn.addEventListener('click', () => {
        const roomId = memoryRoomInput.value.trim();
        if (roomId) socket.emit('join-memory-room', roomId);
        else alert("Enter Room ID");
    });
}

window.initMemory = initMemory;
window.resetMemoryGame = resetMemoryGame;
