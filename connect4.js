const C4_ROWS = 6;
const C4_COLS = 7;
const PLAYER_1_CLASS = 'player1'; // Red
const PLAYER_2_CLASS = 'player2'; // Yellow

let c4Board = [];
let c4CurrentPlayer = 1;
let c4GameActive = false;
let c4P1Name = "Red";
let c4P2Name = "Yellow";

const c4BoardElement = document.getElementById('c4Board');
const c4StatusDisplay = document.getElementById('c4StatusDisplay');
const c4SetupScreen = document.getElementById('c4SetupScreen');
const c4GameContainer = document.getElementById('c4GameContainer');
const c4WinningMessageElement = document.getElementById('c4WinningMessage');
const c4WinningMessageTextElement = document.getElementById('c4WinningMessageText');

function initConnect4() {
    // Reset to setup screen
    showC4Setup();
}

function showC4Setup() {
    if (c4SetupScreen) {
        c4SetupScreen.classList.remove('hidden');
        c4SetupScreen.style.display = 'flex'; // Restore flex
    }
    if (c4GameContainer) {
        c4GameContainer.classList.add('hidden');
        c4GameContainer.style.display = 'none';
    }
    if (c4WinningMessageElement) {
        c4WinningMessageElement.classList.remove('show');
    }
}

function startConnect4Game(skip = false) {
    if (!skip) {
        const p1Input = document.getElementById('c4Player1Name');
        const p2Input = document.getElementById('c4Player2Name');

        if (p1Input) c4P1Name = p1Input.value.trim() || "Red";
        if (p2Input) c4P2Name = p2Input.value.trim() || "Yellow";
    } else {
        c4P1Name = "Red";
        c4P2Name = "Yellow";
    }

    if (c4SetupScreen) {
        c4SetupScreen.classList.add('hidden');
        c4SetupScreen.style.display = 'none'; // Force hide
    }

    if (c4GameContainer) {
        c4GameContainer.classList.remove('hidden');
        c4GameContainer.style.display = 'block'; // Force show (or flex if needed, but block is fine for container)
    }

    resetConnect4Board();
}

function resetConnect4Board() {
    c4Board = Array(C4_ROWS).fill(null).map(() => Array(C4_COLS).fill(0));
    c4CurrentPlayer = 1;
    c4GameActive = true;
    c4WinningMessageElement.classList.remove('show');
    renderC4BoardInitial();
    updateC4Status();
}

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

    for (let r = C4_ROWS - 1; r >= 0; r--) {
        if (c4Board[r][col] === 0) {
            c4Board[r][col] = c4CurrentPlayer;

            // Animate Drop
            const cell = c4BoardElement.querySelector(`.c4-cell[data-row="${r}"][data-col="${col}"]`);
            const piece = document.createElement('div');
            piece.classList.add('c4-piece');
            if (c4CurrentPlayer === 1) piece.classList.add(PLAYER_1_CLASS);
            else piece.classList.add(PLAYER_2_CLASS);

            // Set drop distance for animation
            piece.style.setProperty('--fall-distance', `-${(r + 1) * 60}px`);

            cell.appendChild(piece);

            if (checkC4Win(r, col)) {
                c4GameActive = false;
                endC4Game(false);
            } else if (checkC4Draw()) {
                c4GameActive = false;
                endC4Game(true);
            } else {
                c4CurrentPlayer = c4CurrentPlayer === 1 ? 2 : 1;
                updateC4Status();
            }
            return;
        }
    }
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

    // Horizontal
    let count = 0;
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

    // Check one way
    let r = row + rowDir;
    let c = col + colDir;
    while (r >= 0 && r < C4_ROWS && c >= 0 && c < C4_COLS && c4Board[r][c] === player) {
        count++;
        r += rowDir;
        c += colDir;
    }

    // Check other way
    r = row - rowDir;
    c = col - colDir;
    while (r >= 0 && r < C4_ROWS && c >= 0 && c < C4_COLS && c4Board[r][c] === player) {
        count++;
        r -= rowDir;
        c -= colDir;
    }

    return count >= 4;
}

function checkC4Draw() {
    return c4Board.every(row => row.every(cell => cell !== 0));
}

// Expose to global
window.initConnect4 = initConnect4;
window.startConnect4Game = startConnect4Game;
window.resetConnect4Board = resetConnect4Board;
window.showC4Setup = showC4Setup;
