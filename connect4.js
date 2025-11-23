const C4_ROWS = 6;
const C4_COLS = 7;
const PLAYER_1_CLASS = 'player1'; // Red
const PLAYER_2_CLASS = 'player2'; // Yellow

let c4Board = [];
let c4CurrentPlayer = 1;
let c4GameActive = false;

const c4BoardElement = document.getElementById('c4Board');
const c4StatusDisplay = document.getElementById('c4StatusDisplay');

function initConnect4() {
    c4Board = Array(C4_ROWS).fill(null).map(() => Array(C4_COLS).fill(0));
    c4CurrentPlayer = 1;
    c4GameActive = true;
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

            // Set drop distance for animation (row index * 60px roughly)
            // Actually, we want it to fall from the top of the board.
            // The piece is inside the cell. 
            // If row is 0, it falls 0 distance? No, it falls from above.
            // Let's say it falls from "Row -1".
            // Distance = (Row Index + 1) * 60px (approx cell + gap)
            piece.style.setProperty('--fall-distance', `-${(r + 1) * 60}px`);

            cell.appendChild(piece);

            if (checkC4Win(r, col)) {
                c4GameActive = false;
                c4StatusDisplay.innerText = `Player ${c4CurrentPlayer} Wins!`;
            } else if (checkC4Draw()) {
                c4GameActive = false;
                c4StatusDisplay.innerText = "It's a Draw!";
            } else {
                c4CurrentPlayer = c4CurrentPlayer === 1 ? 2 : 1;
                updateC4Status();
            }
            return;
        }
    }
}

function updateC4Status() {
    c4StatusDisplay.innerHTML = `Player <span class="${c4CurrentPlayer === 1 ? 'text-red' : 'text-yellow'}">${c4CurrentPlayer === 1 ? 'Red' : 'Yellow'}</span>'s Turn`;
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
    // (This is a simplified check, iterating all diagonals is safer but more code. 
    // Let's do a robust check around the placed piece)
    return checkDirection(row, col, 1, 1) || // /
        checkDirection(row, col, 1, -1);  // \
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
