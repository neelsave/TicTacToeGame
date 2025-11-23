const DOTS_ROWS = 4;
const DOTS_COLS = 4;
let dotsP1Score = 0;
let dotsP2Score = 0;
let dotsCurrentPlayer = 1;
let dotsLines = {}; // Key: "r,c,dir" (dir: 'h' or 'v')
let dotsBoxes = {}; // Key: "r,c"
let dotsGameActive = false;

function initDotsBoxes() {
    dotsP1Score = 0;
    dotsP2Score = 0;
    dotsCurrentPlayer = 1;
    dotsLines = {};
    dotsBoxes = {};
    dotsGameActive = true;

    updateDotsUI();
    renderDotsGrid();
    document.getElementById('dotsGameOver').classList.add('hidden');
}

function renderDotsGrid() {
    const grid = document.getElementById('dotsGrid');
    grid.innerHTML = '';

    // Create grid structure
    // We need (ROWS) * (COLS) dots
    // (ROWS) * (COLS-1) horizontal lines
    // (ROWS-1) * (COLS) vertical lines
    // (ROWS-1) * (COLS-1) boxes

    // Using CSS Grid for layout
    // 2*COLS - 1 columns (dot, h-line, dot...)
    // 2*ROWS - 1 rows (dot, v-line, dot...)

    grid.style.gridTemplateColumns = `repeat(${DOTS_COLS}, 10px 50px) 10px`;
    grid.style.gridTemplateRows = `repeat(${DOTS_ROWS}, 10px 50px) 10px`;

    for (let r = 0; r <= DOTS_ROWS; r++) {
        for (let c = 0; c <= DOTS_COLS; c++) {
            // Dot
            const dot = document.createElement('div');
            dot.className = 'dot';
            grid.appendChild(dot);

            // Horizontal Line (if not last col)
            if (c < DOTS_COLS) {
                const hLine = document.createElement('div');
                hLine.className = `line h-line ${dotsLines[`${r},${c},h`] ? 'taken' : ''}`;
                hLine.onclick = () => handleLineClick(r, c, 'h');
                grid.appendChild(hLine);
            }
        }

        // Vertical Lines and Boxes (if not last row)
        if (r < DOTS_ROWS) {
            for (let c = 0; c <= DOTS_COLS; c++) {
                // Vertical Line
                const vLine = document.createElement('div');
                vLine.className = `line v-line ${dotsLines[`${r},${c},v`] ? 'taken' : ''}`;
                vLine.onclick = () => handleLineClick(r, c, 'v');
                grid.appendChild(vLine);

                // Box (if not last col)
                if (c < DOTS_COLS) {
                    const box = document.createElement('div');
                    const owner = dotsBoxes[`${r},${c}`];
                    box.className = `box ${owner ? (owner === 1 ? 'p1' : 'p2') : ''}`;
                    grid.appendChild(box);
                }
            }
        }
    }
}

function handleLineClick(r, c, dir) {
    if (!dotsGameActive) return;
    const key = `${r},${c},${dir}`;

    if (dotsLines[key]) return; // Already taken

    dotsLines[key] = dotsCurrentPlayer;

    // Check if this line completed any boxes
    let boxCompleted = false;

    // Check box associated with this line
    // Horizontal line at r,c completes box at r,c (top) and r-1,c (bottom)
    // Vertical line at r,c completes box at r,c (left) and r,c-1 (right)

    if (dir === 'h') {
        if (checkAndClaimBox(r, c)) boxCompleted = true;     // Box below line
        if (checkAndClaimBox(r - 1, c)) boxCompleted = true; // Box above line
    } else {
        if (checkAndClaimBox(r, c)) boxCompleted = true;     // Box right of line
        if (checkAndClaimBox(r, c - 1)) boxCompleted = true; // Box left of line
    }

    if (boxCompleted) {
        if (dotsCurrentPlayer === 1) dotsP1Score++;
        else dotsP2Score++;

        // Check win condition
        if (Object.keys(dotsBoxes).length === DOTS_ROWS * DOTS_COLS) {
            endDotsGame();
        }
    } else {
        dotsCurrentPlayer = dotsCurrentPlayer === 1 ? 2 : 1;
    }

    updateDotsUI();
    renderDotsGrid(); // Re-render to show changes
}

function checkAndClaimBox(r, c) {
    if (r < 0 || r >= DOTS_ROWS || c < 0 || c >= DOTS_COLS) return false;
    if (dotsBoxes[`${r},${c}`]) return false; // Already claimed

    // Box is defined by:
    // Top: h-line at r,c
    // Bottom: h-line at r+1,c
    // Left: v-line at r,c
    // Right: v-line at r,c+1

    const top = dotsLines[`${r},${c},h`];
    const bottom = dotsLines[`${r + 1},${c},h`];
    const left = dotsLines[`${r},${c},v`];
    const right = dotsLines[`${r},${c + 1},v`];

    if (top && bottom && left && right) {
        dotsBoxes[`${r},${c}`] = dotsCurrentPlayer;
        return true;
    }
    return false;
}

function updateDotsUI() {
    document.getElementById('dotsScore1').innerText = `P1: ${dotsP1Score}`;
    document.getElementById('dotsScore2').innerText = `P2: ${dotsP2Score}`;
    document.getElementById('dotsTurn').innerText = `Turn: Player ${dotsCurrentPlayer}`;
    document.getElementById('dotsTurn').className = `status-display ${dotsCurrentPlayer === 1 ? 'p1-turn' : 'p2-turn'}`;
}

function endDotsGame() {
    dotsGameActive = false;
    const winner = dotsP1Score > dotsP2Score ? 1 : (dotsP2Score > dotsP1Score ? 2 : 0);
    const msg = winner === 0 ? "It's a Tie!" : `Player ${winner} Wins!`;

    const gameOverEl = document.getElementById('dotsGameOver');
    gameOverEl.classList.remove('hidden');
    gameOverEl.innerHTML = `
        <h2>${msg}</h2>
        <button class="btn-reset" onclick="initDotsBoxes()">Play Again</button>
        <button class="btn-home" onclick="showHome()">Home</button>
    `;
}

// Expose
window.initDotsBoxes = initDotsBoxes;
