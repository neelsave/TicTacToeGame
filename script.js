const X_CLASS = 'x';
const O_CLASS = 'o';
const WINNING_COMBINATIONS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

const tileElements = document.querySelectorAll('.tile');
const board = document.getElementById('gameBoard');
const winningMessageElement = document.getElementById('winningMessage');
const winningMessageTextElement = document.querySelector('[data-winning-message-text]');
const restartButton = document.getElementById('restartBtn');
const statusDisplay = document.getElementById('statusDisplay');
const resetButton = document.getElementById('resetBtn');

// New Elements
const setupScreen = document.getElementById('setupScreen');
const gameContainer = document.getElementById('gameContainer');
const startGameBtn = document.getElementById('startGameBtn');
const playerXInput = document.getElementById('playerXName');
const playerOInput = document.getElementById('playerOName');
const scoreNameX = document.getElementById('scoreNameX');
const scoreNameO = document.getElementById('scoreNameO');
const scoreValueX = document.getElementById('scoreValueX');
const scoreValueO = document.getElementById('scoreValueO');
const changePlayersBtn = document.getElementById('changePlayersBtn');
const skipBtn = document.getElementById('skipBtn'); // Added skipBtn

let circleTurn;
let playerXName = '';
let playerOName = '';
let scoreX = parseInt(localStorage.getItem('tictactoe_scoreX')) || 0;
let scoreO = parseInt(localStorage.getItem('tictactoe_scoreO')) || 0;

function initTicTacToe() {
    // Default names if not set
    if (!playerXName) playerXName = 'X';
    if (!playerOName) playerOName = 'O';

    scoreNameX.innerText = playerXName;
    scoreNameO.innerText = playerOName;

    // Show setup screen so user can choose mode
    setupScreen.classList.remove('hidden');
    gameContainer.classList.add('hidden');

    // Reset mode to local by default
    setMode('local');
}

startGameBtn.addEventListener('click', handleStartGame);
if (skipBtn) { // Added conditional listener for skipBtn
    skipBtn.addEventListener('click', () => {
        playerXInput.value = '';
        playerOInput.value = '';
        handleStartGame();
    });
}

restartButton.addEventListener('click', handleRestart);
resetButton.addEventListener('click', handleRestart); // Use same handler for both
changePlayersBtn.addEventListener('click', handleChangePlayers);

function handleRestart() {
    if (isOnline) {
        if (socket && currentRoomId) {
            socket.emit('reset-game', currentRoomId);
        }
    } else {
        startGame();
    }
}

function handleStartGame() {
    playerXName = playerXInput.value || 'X';
    playerOName = playerOInput.value || 'O';

    scoreNameX.innerText = playerXName;
    scoreNameO.innerText = playerOName;

    setupScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');

    startGame();
}

function handleChangePlayers() {
    gameContainer.classList.add('hidden');
    setupScreen.classList.remove('hidden');
    scoreX = 0;
    scoreO = 0;
    updateScoreboard();
}

// --- Global Presence & Username ---
let globalUsername = 'Guest';
const globalUsernameKey = 'neel_creations_username';

function initGlobalPresence() {
    // 1. Load/Generate Username
    const stored = localStorage.getItem(globalUsernameKey);
    if (stored) {
        globalUsername = stored;
    } else {
        globalUsername = 'Guest' + Math.floor(Math.random() * 10000);
        localStorage.setItem(globalUsernameKey, globalUsername);
    }
    updateGlobalStatusUI();

    // 2. Connect Socket for Player Count
    if (typeof io !== 'undefined') {
        if (!socket) {
            const SERVER_URL = 'https://tictactoegame-zyid.onrender.com';
            socket = io(SERVER_URL);
        }

        socket.on('connect', () => {
            console.log("Global socket connected");
            const el = document.getElementById('onlineCountDisplay');
            if (el) el.innerText = "Online: Connected";
        });

        socket.on('connect_error', (err) => {
            console.error("Global socket error:", err);
            const el = document.getElementById('onlineCountDisplay');
            if (el) el.innerText = "Online: Offline";
        });

        socket.on('update-player-count', (count) => {
            console.log("Player count received:", count);
            const el = document.getElementById('onlineCountDisplay');
            if (el) el.innerText = `Online: ${count}`;
        });
    }
}

function updateGlobalStatusUI() {
    const el = document.getElementById('globalUsernameDisplay');
    if (el) el.innerText = `You: ${globalUsername}`;
}

function changeGlobalName() {
    const newName = prompt("Enter your display name:", globalUsername);
    if (newName && newName.trim() !== "") {
        globalUsername = newName.trim();
        localStorage.setItem(globalUsernameKey, globalUsername);
        updateGlobalStatusUI();

        // Also update chat name if it exists
        if (typeof chatUsername !== 'undefined') {
            chatUsername = globalUsername;
            localStorage.setItem('chat_username', globalUsername); // Sync keys if needed
            if (typeof updateChatHeader === 'function') updateChatHeader();
        }
    }
}

// Call immediately
initGlobalPresence();

// --- Online Variables ---
let isOnline = false;
let socket;
let currentRoomId = null;
let myPlayer = null; // 'X' or 'O'
let onlineTurn = 'X'; // Server source of truth

// --- Mode Selection ---
const modeLocalBtn = document.getElementById('modeLocalBtn');
const modeOnlineBtn = document.getElementById('modeOnlineBtn');
const localSetup = document.getElementById('localSetup');
const onlineSetup = document.getElementById('onlineSetup');
const roomIdInput = document.getElementById('roomIdInput');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const onlineStatus = document.getElementById('onlineStatus');

if (modeLocalBtn && modeOnlineBtn) {
    modeLocalBtn.addEventListener('click', () => setMode('local'));
    modeOnlineBtn.addEventListener('click', () => setMode('online'));
}

function setMode(mode) {
    if (mode === 'local') {
        isOnline = false;
        modeLocalBtn.classList.add('active');
        modeOnlineBtn.classList.remove('active');
        localSetup.classList.remove('hidden');
        onlineSetup.classList.add('hidden');
    } else {
        isOnline = true;
        modeLocalBtn.classList.remove('active');
        modeOnlineBtn.classList.add('active');
        localSetup.classList.add('hidden');
        onlineSetup.classList.remove('hidden');
        initSocket();
    }
}

function initSocket() {
    if (!socket && typeof io !== 'undefined') {
        // Use same URL strategy as chat
        // PRODUCTION: Replace with your Render URL
        const SERVER_URL = 'https://tictactoegame-zyid.onrender.com';
        // const SERVER_URL = ''; // For localhost

        socket = io(SERVER_URL);

        socket.on('room-created', (id) => {
            onlineStatus.innerText = `Room Created: ${id}. Waiting for player...`;
            onlineStatus.style.color = '#4ade80';
            currentRoomId = id;
        });

        socket.on('room-joined', (id) => {
            onlineStatus.innerText = `Joined Room: ${id}`;
            currentRoomId = id;
        });

        socket.on('room-error', (msg) => {
            onlineStatus.innerText = msg;
            onlineStatus.style.color = '#ef4444';
        });

        socket.on('player-assigned', (role) => {
            myPlayer = role;
            console.log("Assigned role:", role);
        });

        socket.on('game-start', ({ turn }) => {
            console.log("Game Start Event Received!");
            onlineStatus.innerText = "Game Starting...";

            try {
                if (!setupScreen || !gameContainer) {
                    throw new Error("UI elements not found");
                }

                setupScreen.classList.add('hidden');
                gameContainer.classList.remove('hidden');

                onlineTurn = turn;
                playerXName = 'Player X'; // Generic for online
                playerOName = 'Player O';
                scoreNameX.innerText = playerXName;
                scoreNameO.innerText = playerOName;

                startGame();
                updateStatusDisplay();
            } catch (e) {
                console.error("Game Start Error:", e);
                onlineStatus.innerText = "Error starting game: " + e.message;
                onlineStatus.style.color = '#ef4444';
            }
        });

        socket.on('update-board', ({ board, turn }) => {
            onlineTurn = turn;
            circleTurn = turn === 'O'; // Sync local turn var
            updateBoardFromOnline(board);
            updateStatusDisplay();

            // Check win locally to show message
            if (checkWin(X_CLASS)) endGame(false, 'X');
            else if (checkWin(O_CLASS)) endGame(false, 'O');
            else if (isDraw()) endGame(true);
        });

        socket.on('player-left', () => {
            alert("Opponent disconnected.");
            location.reload(); // Simple reset
        });

        socket.on('reset-board', () => {
            onlineTurn = 'X'; // Reset turn to X
            startGame();
            updateStatusDisplay();
        });
    }
}

if (createRoomBtn) {
    createRoomBtn.addEventListener('click', () => {
        const id = roomIdInput.value.trim();
        if (id && socket) {
            socket.emit('create-room', id);
        } else {
            onlineStatus.innerText = "Enter a Room ID";
        }
    });
}

if (joinRoomBtn) {
    joinRoomBtn.addEventListener('click', () => {
        const id = roomIdInput.value.trim();
        if (id && socket) {
            socket.emit('join-room', id);
        } else {
            onlineStatus.innerText = "Enter a Room ID";
        }
    });
}

function updateBoardFromOnline(serverBoard) {
    tileElements.forEach((tile, index) => {
        const val = serverBoard[index];
        tile.classList.remove(X_CLASS, O_CLASS, 'taken');
        tile.innerText = '';

        if (val === 'X') {
            tile.classList.add(X_CLASS, 'taken');
            tile.innerText = 'X';
        } else if (val === 'O') {
            tile.classList.add(O_CLASS, 'taken');
            tile.innerText = 'O';
        }
    });
}

// --- Modified Game Logic ---

function startGame() {
    circleTurn = false; // X starts
    tileElements.forEach(tile => {
        tile.classList.remove(X_CLASS);
        tile.classList.remove(O_CLASS);
        tile.classList.remove('taken');
        tile.textContent = '';
        tile.removeEventListener('click', handleClick);
        tile.addEventListener('click', handleClick); // Remove {once: true} to handle invalid clicks manually
    });
    setBoardHoverClass();
    winningMessageElement.classList.remove('show');
    updateStatusDisplay();
}

function handleClick(e) {
    const tile = e.target;

    // Online Check
    if (isOnline) {
        // Prevent move if not my turn or tile taken
        if (onlineTurn !== myPlayer) return;
        if (tile.classList.contains('taken')) return;

        // Emit move
        const index = [...tileElements].indexOf(tile);
        socket.emit('make-move', { roomId: currentRoomId, index, player: myPlayer });
        return; // Wait for server update
    }

    // Local Logic (Existing)
    if (tile.classList.contains('taken')) return; // Safety

    const currentClass = circleTurn ? O_CLASS : X_CLASS;
    placeMark(tile, currentClass);

    if (checkWin(currentClass)) {
        endGame(false);
    } else if (isDraw()) {
        endGame(true);
    } else {
        swapTurns();
        setBoardHoverClass();
        updateStatusDisplay();
    }
}

function endGame(draw, winnerOverride) {
    if (draw) {
        winningMessageTextElement.innerText = 'Draw!';
    } else {
        let winnerName;
        if (isOnline && winnerOverride) {
            winnerName = winnerOverride === 'X' ? "Player X" : "Player O";
        } else {
            winnerName = circleTurn ? playerOName : playerXName;
        }
        winningMessageTextElement.innerText = `${winnerName} Wins!`;

        if (!isOnline) { // Only update local score for local games
            if (circleTurn) scoreO++;
            else scoreX++;
            updateScoreboard();
        }
    }
    winningMessageElement.classList.add('show');
}

function updateScoreboard() {
    scoreValueX.innerText = scoreX;
    scoreValueO.innerText = scoreO;
    localStorage.setItem('tictactoe_scoreX', scoreX);
    localStorage.setItem('tictactoe_scoreO', scoreO);
}

function isDraw() {
    return [...tileElements].every(tile => {
        return tile.classList.contains(X_CLASS) || tile.classList.contains(O_CLASS);
    });
}

function checkWin(currentClass) {
    return WINNING_COMBINATIONS.some(combination => {
        return combination.every(index => {
            return tileElements[index].classList.contains(currentClass);
        });
    });
}

function placeMark(tile, currentClass) {
    tile.classList.add(currentClass);
    tile.classList.add('taken');
    tile.textContent = currentClass === X_CLASS ? 'X' : 'O';
}

function swapTurns() {
    circleTurn = !circleTurn;
}

function setBoardHoverClass() {
    board.classList.remove(X_CLASS);
    board.classList.remove(O_CLASS);
    if (circleTurn) {
        board.classList.add(O_CLASS);
    } else {
        board.classList.add(X_CLASS);
    }
}

function updateStatusDisplay() {
    if (isOnline) {
        const isMyTurn = onlineTurn === myPlayer;
        statusDisplay.innerHTML = isMyTurn ?
            `<span style="color: #4ade80">Your Turn (${myPlayer})</span>` :
            `<span style="color: #ef4444">Opponent's Turn</span>`;
    } else {
        const currentPlayerName = circleTurn ? playerOName : playerXName;
        statusDisplay.innerHTML = `<span class="current-player" style="color: var(--accent-${circleTurn ? 'o' : 'x'})">${currentPlayerName}</span>'s Turn`;
    }
}

// --- App Navigation ---
// --- App Navigation ---
let homeScrollPosition = 0;

function showApp(appName) {
    // Save scroll position before hiding home
    const homeScreen = document.getElementById('home-screen');
    if (homeScreen && !homeScreen.classList.contains('hidden')) {
        homeScrollPosition = window.scrollY;
    }

    // Hide all views
    document.querySelectorAll('.app-view').forEach(view => {
        view.classList.add('hidden');
    });

    // Show target view
    const appView = document.getElementById(`app-${appName}`);
    if (appView) {
        appView.classList.remove('hidden');
        // Scroll to top of the app
        window.scrollTo(0, 0);
    }
}

function showHome() {
    document.querySelectorAll('.app-view').forEach(view => {
        view.classList.add('hidden');
    });
    const homeScreen = document.getElementById('home-screen');
    homeScreen.classList.remove('hidden');

    // Restore scroll position
    // We need a slight timeout to ensure the browser has re-rendered the layout
    setTimeout(() => {
        window.scrollTo(0, homeScrollPosition);
    }, 0);
}

// --- Water Tracker Logic ---
let currentWater = 0;
const waterGoal = 2000;
const waterCircle = document.querySelector('.progress-ring__circle');
const excessCircle = document.querySelector('.progress-ring__circle-excess');
const currentWaterDisplay = document.getElementById('currentWater');
const customWaterInput = document.getElementById('customWaterInput');

// Initialize circle
if (waterCircle && excessCircle) {
    const radius = waterCircle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;

    waterCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    waterCircle.style.strokeDashoffset = circumference;

    excessCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    excessCircle.style.strokeDashoffset = circumference;

    function setProgress(percent, circle) {
        const offset = circumference - (percent / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }

    function addWater(amount) {
        currentWater += amount;
        localStorage.setItem('water_currentWater', currentWater);
        updateWaterUI();
    }

    function addCustomWater() {
        const amount = parseInt(customWaterInput.value);
        if (amount > 0) {
            addWater(amount);
            customWaterInput.value = '';
        }
    }

    function resetWater() {
        currentWater = 0;
        localStorage.setItem('water_currentWater', currentWater);
        updateWaterUI();
    }

    function updateDate() {
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            const options = { weekday: 'long', month: 'long', day: 'numeric' };
            const today = new Date().toLocaleDateString('en-US', options);
            dateElement.innerText = today;
        }
    }

    function updateWaterUI() {
        currentWaterDisplay.innerText = currentWater;

        // Main Circle Progress (max 100%)
        const mainPercent = Math.min((currentWater / waterGoal) * 100, 100);
        setProgress(mainPercent, waterCircle);

        // Excess Circle Progress
        let excessPercent = 0;
        if (currentWater > waterGoal) {
            const excessAmount = currentWater - waterGoal;
            // Calculate excess as percentage of goal (wrapping around)
            // or just fill it up. Let's make it fill up based on another goal unit?
            // For now, let's map it to the same scale: 2000ml = full circle
            excessPercent = (excessAmount / waterGoal) * 100;
            // Cap it at 100% for visual sanity or let it loop? 
            // Let's cap at 100% for this iteration so it doesn't look broken if they drink 4000ml
            excessPercent = Math.min(excessPercent, 100);
        }
        setProgress(excessPercent, excessCircle);

        const waterContainer = document.querySelector('.water-container');

        // Remove all states first
        waterContainer.classList.remove('goal-reached', 'goal-exceeded');

        if (currentWater > waterGoal) {
            waterContainer.classList.add('goal-exceeded');
            // Ensure main circle stays green by adding goal-reached as well if needed, 
            // or relying on CSS cascading. Let's add both to be safe/flexible.
            waterContainer.classList.add('goal-reached');
        } else if (currentWater >= waterGoal) {
            waterContainer.classList.add('goal-reached');
        }
    }

    // Initialize Date
    updateDate();
    updateWaterUI(); // Update UI on load to reflect persisted data

    // Expose functions to global scope for onclick handlers
    window.addWater = addWater;
    window.addCustomWater = addCustomWater;
    window.resetWater = resetWater;
}

// --- Expense Tracker Logic ---
const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const expenseDashboard = document.getElementById('expense-dashboard');
const expenseHistory = document.getElementById('expense-history');
const navDashboard = document.getElementById('nav-dashboard');
const navHistory = document.getElementById('nav-history');
const categoryChipsContainer = document.getElementById('category-chips');

// Quick Select Options
const categories = [
    { name: 'Salary', type: 'income' },
    { name: 'Bonus', type: 'income' },
    { name: 'Freelance', type: 'income' },
    { name: 'Food', type: 'expense' },
    { name: 'Shopping', type: 'expense' },
    { name: 'Travel', type: 'expense' },
    { name: 'Bills', type: 'expense' },
    { name: 'Rent', type: 'expense' },
    { name: 'Entertainment', type: 'expense' },
    { name: 'Health', type: 'expense' }
];

function renderChips() {
    categoryChipsContainer.innerHTML = '';
    categories.forEach(cat => {
        const chip = document.createElement('div');
        chip.classList.add('chip', cat.type);
        chip.innerText = cat.name;
        chip.onclick = (event) => selectCategory(cat.name, cat.type, event); // Pass event
        categoryChipsContainer.appendChild(chip);
    });
}

function selectCategory(name, type, event) { // Accept event
    text.value = name;
    // Visual feedback
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');

    // Optional: Auto-focus amount?
    amount.focus();
}

// Dummy transactions for testing or empty initially
let transactions = JSON.parse(localStorage.getItem('expense_transactions')) || [];

function addTransaction(e) {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '') {
        alert('Please add a text and amount');
    } else {
        const transaction = {
            id: generateID(),
            text: text.value,
            amount: +amount.value,
            date: new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };

        transactions.push(transaction);

        addTransactionDOM(transaction);
        updateValues();
        updateLocalStorage();

        text.value = '';
        amount.value = '';
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));

        // Optional: Switch to history to show added item? 
        // User said "adding expense is very simple tab", so maybe keep them on dashboard.
        // But let's show a quick alert or toast? For now, just stay on dashboard.
    }
}

function generateID() {
    return Math.floor(Math.random() * 100000000);
}

function addTransactionDOM(transaction) {
    // Get sign
    const sign = transaction.amount < 0 ? '-' : '+';

    const item = document.createElement('li');

    // Add class based on value
    item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

    item.innerHTML = `
        <div class="transaction-info">
            <span>${transaction.text}</span>
            <span>${sign}₹${Math.abs(transaction.amount)}</span>
        </div>
        <span class="transaction-date">${transaction.date}</span>
        <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
    `;

    list.appendChild(item);
}

function updateValues() {
    const amounts = transactions.map(transaction => transaction.amount);

    const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);

    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => (acc += item), 0)
        .toFixed(2);

    const expense = (
        amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) *
        -1
    ).toFixed(2);

    balance.innerText = `₹${total}`;
    money_plus.innerText = `+₹${income}`;
    money_minus.innerText = `-₹${expense}`;
}

function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    updateLocalStorage();
    initExpenseTracker();
}

function updateLocalStorage() {
    localStorage.setItem('expense_transactions', JSON.stringify(transactions));
}

function initExpenseTracker() {
    list.innerHTML = '';
    transactions.forEach(addTransactionDOM);
    updateValues();
    renderChips();
}

function showExpenseDashboard() {
    expenseDashboard.classList.remove('hidden');
    expenseHistory.classList.add('hidden');
    navDashboard.classList.add('active');
    navHistory.classList.remove('active');
}

function showExpenseHistory() {
    expenseDashboard.classList.add('hidden');
    expenseHistory.classList.remove('hidden');
    navDashboard.classList.remove('active');
    navHistory.classList.add('active');
}

// Initialize Expense Tracker
initExpenseTracker();

// Expose Expense Tracker functions
window.addTransaction = addTransaction;
window.removeTransaction = removeTransaction;
window.showExpenseDashboard = showExpenseDashboard;
window.showExpenseHistory = showExpenseHistory;

// Expose navigation to global scope
window.showApp = showApp;
window.showHome = showHome;
window.initTicTacToe = initTicTacToe;
