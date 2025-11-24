const C4_ROWS = 6;
const C4_COLS = 7;
const PLAYER_1_CLASS = 'player1'; // Red
const PLAYER_2_CLASS = 'player2'; // Yellow

let c4Board = [];
let c4CurrentPlayer = 1;
let c4GameActive = false;
let c4P1Name = "Red";
let c4P2Name = "Yellow";
let c4IsOnline = false;
let c4VsComputer = false;
let c4MyPlayer = null; // 'Red' or 'Yellow'
let c4RoomId = null;

const c4BoardElement = document.getElementById('c4Board');
const c4StatusDisplay = document.getElementById('c4StatusDisplay');
const c4SetupScreen = document.getElementById('c4SetupScreen');
const c4GameContainer = document.getElementById('c4GameContainer');
const c4WinningMessageElement = document.getElementById('c4WinningMessage');
const c4WinningMessageTextElement = document.getElementById('c4WinningMessageText');

// UI Elements for Setup
const c4ModeLocalBtn = document.getElementById('c4ModeLocalBtn');
const c4ModeOnlineBtn = document.getElementById('c4ModeOnlineBtn');
const c4LocalSetup = document.getElementById('c4LocalSetup');
const c4OnlineSetup = document.getElementById('c4OnlineSetup');
const c4RoomIdInput = document.getElementById('c4RoomIdInput');
const c4CreateRoomBtn = document.getElementById('c4CreateRoomBtn');
const c4JoinRoomBtn = document.getElementById('c4JoinRoomBtn');
const c4OnlineStatus = document.getElementById('c4OnlineStatus');
const c4StartGameBtn = document.getElementById('c4StartGameBtn');

if (c4StartGameBtn) {
    c4StartGameBtn.addEventListener('click', () => startConnect4Game());
}

function initConnect4() {
    // Reset to setup screen
    showC4Setup();
    setC4Mode('local');
}

function showC4Setup() {
    if (c4SetupScreen) {
        c4SetupScreen.classList.remove('hidden');
        c4SetupScreen.style.display = 'flex';
    }
    if (c4GameContainer) {
        c4GameContainer.classList.add('hidden');
        c4GameContainer.style.display = 'none';
    }
    if (c4WinningMessageElement) {
        c4WinningMessageElement.classList.remove('show');
    }
}

// Mode Switching
const c4ModeComputerBtn = document.getElementById('c4ModeComputerBtn');

if (c4ModeLocalBtn && c4ModeOnlineBtn && c4ModeComputerBtn) {
    c4ModeLocalBtn.addEventListener('click', () => setC4Mode('local'));
    c4ModeOnlineBtn.addEventListener('click', () => setC4Mode('online'));
    c4ModeComputerBtn.addEventListener('click', () => setC4Mode('computer'));
}

function setC4Mode(mode) {
    // Reset
    c4ModeLocalBtn.classList.remove('active');
    c4ModeOnlineBtn.classList.remove('active');
    c4ModeComputerBtn.classList.remove('active');
    c4LocalSetup.classList.add('hidden');
    c4OnlineSetup.classList.add('hidden');

    if (mode === 'local') {
        c4IsOnline = false;
        c4VsComputer = false;
        c4ModeLocalBtn.classList.add('active');
        c4LocalSetup.classList.remove('hidden');
    } else if (mode === 'online') {
        c4IsOnline = true;
        c4VsComputer = false;
        c4ModeOnlineBtn.classList.add('active');
        c4OnlineSetup.classList.remove('hidden');
        initC4Socket();
    } else if (mode === 'computer') {
        c4IsOnline = false;
        c4VsComputer = true;
        c4ModeComputerBtn.classList.add('active');
        c4LocalSetup.classList.remove('hidden');
        // Pre-fill Player 2 name
        const p2Input = document.getElementById('c4Player2Name');
        if (p2Input) p2Input.value = "Computer";
    }
}

// Online Controls
if (c4CreateRoomBtn) {
    c4CreateRoomBtn.addEventListener('click', () => {
        const roomId = c4RoomIdInput.value.trim() || 'ROOM-' + Math.floor(Math.random() * 1000);
        c4RoomIdInput.value = roomId;
        joinC4Room(roomId);
    });
}

if (c4JoinRoomBtn) {
    c4JoinRoomBtn.addEventListener('click', () => {
        const roomId = c4RoomIdInput.value.trim();
        if (roomId) joinC4Room(roomId);
        else alert("Please enter a Room ID");
    });
}

// Socket Logic
function initC4Socket() {
    if (typeof io === 'undefined') return;

    // Reuse global socket from script.js if available, else create
    if (!socket) {
        socket = io('https://tictactoegame-zyid.onrender.com');
    }

    // Remove old listeners to prevent duplicates
    socket.off('c4-player-assigned');
    socket.off('c4-start');
    socket.off('c4-update-board');
    socket.off('c4-reset');
    socket.off('c4-error');
    socket.off('c4-player-left');

    socket.on('c4-player-assigned', (color) => {
        c4MyPlayer = color;
        c4OnlineStatus.innerText = `Joined Room! You are ${color}. Waiting for opponent...`;
        c4OnlineStatus.style.color = '#fbbf24';
    });

    socket.on('c4-start', ({ turn }) => {
        c4OnlineStatus.innerText = "Game Starting!";
        c4P1Name = "Player Red";
        c4P2Name = "Player Yellow";
        startConnect4Game(true); // Skip setup, go to game
        updateC4Status(); // Show turn
    });

    socket.on('c4-update-board', ({ row, col, player, turn }) => {
        // Apply move from server
        c4Board[row][col] = player === 'Red' ? 1 : 2;

        // Animate
        animateDrop(row, col, player === 'Red' ? 1 : 2);

        // Check Win/Draw locally
        if (checkC4Win(row, col)) {
            c4GameActive = false;
            endC4Game(false);
        } else if (checkC4Draw()) {
            c4GameActive = false;
            endC4Game(true);
        } else {
            c4CurrentPlayer = turn === 'Red' ? 1 : 2;
            updateC4Status();
        }
    });

    socket.on('c4-reset', () => {
        resetConnect4Board();
    });

    socket.on('c4-error', (msg) => {
        alert(msg);
        c4OnlineStatus.innerText = msg;
        c4OnlineStatus.style.color = '#ef4444';
    });

    socket.on('c4-player-left', () => {
        alert("Opponent left the game.");
        showC4Setup();
    });
}

function joinC4Room(roomId) {
    if (!socket) initC4Socket();
    c4RoomId = roomId;
    socket.emit('join-c4', roomId);
    c4OnlineStatus.innerText = "Connecting to room...";
}


function startConnect4Game(skip = false) {
    if (!c4IsOnline) {
        // Local Setup
        if (!skip) {
            const p1Input = document.getElementById('c4P1Input');
            const p2Input = document.getElementById('c4P2Input');
            if (p1Input) c4P1Name = p1Input.value.trim() || "Red";
            if (p2Input) c4P2Name = p2Input.value.trim() || "Yellow";
        } else {
            c4P1Name = "Red";
            c4P2Name = "Yellow";
        }
    }

    if (c4SetupScreen) {
        c4SetupScreen.classList.add('hidden');
        c4SetupScreen.style.display = 'none';
    }

    if (c4GameContainer) {
        c4GameContainer.classList.remove('hidden');
        c4GameContainer.style.display = 'block';
    }

    resetConnect4Board();
}

function resetConnect4Board() {
    c4Board = Array(C4_ROWS).fill(null).map(() => Array(C4_COLS).fill(0));
    c4CurrentPlayer = 1; // Red starts
    c4GameActive = true;
    c4WinningMessageElement.classList.remove('show');
    renderC4BoardInitial();
    updateC4Status();

    // If online and I clicked reset, emit it
    // Wait, this function is called by socket.on('c4-reset') too.
    // We need to differentiate user action vs server event?
    // Actually, usually reset button calls a handler.
}

// Add Reset Button Handler
const c4ResetBtn = document.getElementById('c4ResetBtn'); // Need to add this ID to HTML if not there
// Wait, index.html doesn't have a specific reset button for C4 inside the game container?
// It has "New Game" in winning message.
// Let's check index.html... It has a generic "Reset Board" button in Tic Tac Toe, but C4?
// I need to check if C4 has a reset button in HTML.

function renderC4BoardInitial() {
    c4BoardElement.innerHTML = '';
    for (let r = 0; r < C4_ROWS; r++) {
        for (let c = 0; c < C4_COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('c4-cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.onclick = () => handleC4Click(c);
            c4BoardElement.appendChild(cell);
        }
    }
}

function handleC4Click(col) {
    if (!c4GameActive) return;

    // Online Check
    if (c4IsOnline) {
        // Check turn
        const myTurn = (c4MyPlayer === 'Red' && c4CurrentPlayer === 1) ||
            (c4MyPlayer === 'Yellow' && c4CurrentPlayer === 2);

        if (!myTurn) return;

        // Emit move
        socket.emit('make-move-c4', {
            roomId: c4RoomId,
            col: col,
            player: c4MyPlayer
        });
        return; // Wait for server update
    }

    // Local Logic
    for (let r = C4_ROWS - 1; r >= 0; r--) {
        if (c4Board[r][col] === 0) {
            c4Board[r][col] = c4CurrentPlayer;
            animateDrop(r, col, c4CurrentPlayer);

            if (checkC4Win(r, col)) {
                c4GameActive = false;
                endC4Game(false);
            } else if (checkC4Draw()) {
                c4GameActive = false;
                endC4Game(true);
            } else {
                c4CurrentPlayer = c4CurrentPlayer === 1 ? 2 : 1;
                updateC4Status();

                // Computer Turn
                if (c4VsComputer && c4CurrentPlayer === 2) {
                    setTimeout(makeC4ComputerMove, 600);
                }
            }
            return;
        }
    }
}

function animateDrop(r, col, player) {
    const cell = c4BoardElement.querySelector(`.c4-cell[data-row="${r}"][data-col="${col}"]`);
    if (!cell) return;

    const piece = document.createElement('div');
    piece.classList.add('c4-piece');
    if (player === 1) piece.classList.add(PLAYER_1_CLASS);
    else piece.classList.add(PLAYER_2_CLASS);

    piece.style.setProperty('--fall-distance', `-${(r + 1) * 60}px`);
    cell.appendChild(piece);
}

function updateC4Status() {
    const currentPlayerName = c4CurrentPlayer === 1 ? c4P1Name : c4P2Name;
    const colorClass = c4CurrentPlayer === 1 ? 'text-red' : 'text-yellow';
    c4StatusDisplay.innerHTML = `<span class="${colorClass}">${currentPlayerName}</span>'s Turn`;
}

function endC4Game(draw) {
    if (draw) {
        c4WinningMessageTextElement.innerText = "It's a Draw!";
    } else {
        const winnerName = c4CurrentPlayer === 1 ? c4P1Name : c4P2Name;
        c4WinningMessageTextElement.innerText = `${winnerName} Wins!`;
    }
    c4WinningMessageElement.classList.add('show');
}

function checkC4Win(row, col) {
    const player = c4Board[row][col];
    let count = 0;
    // Horizontal
    for (let c = 0; c < C4_COLS; c++) {
        if (c4Board[row][c] === player) count++;
        else count = 0;
        if (count >= 4) return true;
    }
    // Vertical
    count = 0;
    for (let r = 0; r < C4_ROWS; r++) {
        if (c4Board[r][col] === player) count++;
        else count = 0;
        if (count >= 4) return true;
    }
    // Diagonal /
    if (checkDirection(row, col, 1, 1)) return true;
    // Diagonal \
    if (checkDirection(row, col, 1, -1)) return true;
    return false;
}

function checkDirection(row, col, rowDir, colDir) {
    const player = c4Board[row][col];
    let count = 1;
    let r = row + rowDir;
    let c = col + colDir;
    while (r >= 0 && r < C4_ROWS && c >= 0 && c < C4_COLS && c4Board[r][c] === player) {
        count++;
        r += rowDir;
        c += colDir;
    }
    r = row - rowDir;
    c = col - colDir;
    while (r >= 0 && r < C4_ROWS && c >= 0 && c < C4_COLS && c4Board[r][c] === player) {
        count++;
        r -= rowDir;
        c -= colDir;
    }
    return count >= 4;
}
// AI Logic
function makeC4ComputerMove() {
    if (!c4GameActive) return;

    // Simple AI: Pick random valid column
    // TODO: Implement Minimax for smarter AI
    const validCols = [];
    for (let c = 0; c < C4_COLS; c++) {
        if (c4Board[0][c] === 0) {
            validCols.push(c);
        }
    }

    if (validCols.length > 0) {
        const randomCol = validCols[Math.floor(Math.random() * validCols.length)];
        handleC4Click(randomCol);
    }
}
function checkC4Draw() {
    return c4Board.every(row => row.every(cell => cell !== 0));
}

// Restart Handler (for button in Winning Message)
const c4RestartBtn = document.getElementById('c4RestartBtn'); // Need to ensure this ID exists
if (c4RestartBtn) {
    c4RestartBtn.addEventListener('click', () => {
        if (c4IsOnline && socket) {
            socket.emit('reset-c4', c4RoomId);
        } else {
            resetConnect4Board();
        }
    });
}

// Expose to global
window.initConnect4 = initConnect4;
window.startConnect4Game = startConnect4Game;
window.resetConnect4Board = resetConnect4Board;
window.showC4Setup = showC4Setup;
