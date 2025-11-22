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

let circleTurn;
let playerXName = '';
let playerOName = '';
let scoreX = 0;
let scoreO = 0;

startGameBtn.addEventListener('click', handleStartGame);
restartButton.addEventListener('click', startGame);
resetButton.addEventListener('click', startGame);
changePlayersBtn.addEventListener('click', handleChangePlayers);

function handleStartGame() {
    playerXName = playerXInput.value || 'Player X';
    playerOName = playerOInput.value || 'Player O';

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

function startGame() {
    circleTurn = false;
    tileElements.forEach(tile => {
        tile.classList.remove(X_CLASS);
        tile.classList.remove(O_CLASS);
        tile.classList.remove('taken');
        tile.textContent = '';
        tile.removeEventListener('click', handleClick);
        tile.addEventListener('click', handleClick, { once: true });
    });
    setBoardHoverClass();
    winningMessageElement.classList.remove('show');
    updateStatusDisplay();
}

function handleClick(e) {
    const tile = e.target;
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

function endGame(draw) {
    if (draw) {
        winningMessageTextElement.innerText = 'Draw!';
    } else {
        const winnerName = circleTurn ? playerOName : playerXName;
        winningMessageTextElement.innerText = `${winnerName} Wins!`;

        if (circleTurn) {
            scoreO++;
        } else {
            scoreX++;
        }
        updateScoreboard();
    }
    winningMessageElement.classList.add('show');
}

function updateScoreboard() {
    scoreValueX.innerText = scoreX;
    scoreValueO.innerText = scoreO;
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
    const currentPlayerName = circleTurn ? playerOName : playerXName;
    statusDisplay.innerHTML = `<span class="current-player" style="color: var(--accent-${circleTurn ? 'o' : 'x'})">${currentPlayerName}</span>'s Turn`;
}
