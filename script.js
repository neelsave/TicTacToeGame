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

// --- App Navigation ---
function showApp(appName) {
    // Hide all views
    document.querySelectorAll('.app-view').forEach(view => {
        view.classList.add('hidden');
    });

    // Show target view
    const appView = document.getElementById(`app-${appName}`);
    if (appView) {
        appView.classList.remove('hidden');
    }
}

function showHome() {
    document.querySelectorAll('.app-view').forEach(view => {
        view.classList.add('hidden');
    });
    document.getElementById('home-screen').classList.remove('hidden');
}

// --- Water Tracker Logic ---
let currentWater = 0;
const waterGoal = 2000;
const waterCircle = document.querySelector('.progress-ring__circle');
const currentWaterDisplay = document.getElementById('currentWater');
const customWaterInput = document.getElementById('customWaterInput');

// Initialize circle
if (waterCircle) {
    const radius = waterCircle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    waterCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    waterCircle.style.strokeDashoffset = circumference;

    function setProgress(percent) {
        const offset = circumference - (percent / 100) * circumference;
        waterCircle.style.strokeDashoffset = offset;
    }

    function addWater(amount) {
        currentWater += amount;
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
        updateWaterUI();
    }

    function updateWaterUI() {
        currentWaterDisplay.innerText = currentWater;
        const percent = Math.min((currentWater / waterGoal) * 100, 100);
        setProgress(percent);
    }

    // Expose functions to global scope for onclick handlers
    window.addWater = addWater;
    window.addCustomWater = addCustomWater;
    window.resetWater = resetWater;
}

// Expose navigation to global scope
window.showApp = showApp;
window.showHome = showHome;

// --- Calculator Logic ---
class Calculator {
    constructor(previousOperandTextElement, currentOperandTextElement) {
        this.previousOperandTextElement = previousOperandTextElement;
        this.currentOperandTextElement = currentOperandTextElement;
        this.clear();
    }

    clear() {
        this.currentOperand = '';
        this.previousOperand = '';
        this.operation = undefined;
    }

    delete() {
        this.currentOperand = this.currentOperand.toString().slice(0, -1);
    }

    appendNumber(number) {
        if (number === '.' && this.currentOperand.includes('.')) return;
        this.currentOperand = this.currentOperand.toString() + number.toString();
    }

    chooseOperation(operation) {
        if (this.currentOperand === '') return;
        if (this.previousOperand !== '') {
            this.compute();
        }
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '';
    }

    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        if (isNaN(prev) || isNaN(current)) return;
        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '*':
                computation = prev * current;
                break;
            case '÷':
                computation = prev / current;
                break;
            case '%':
                computation = prev % current;
                break;
            default:
                return;
        }
        this.currentOperand = computation;
        this.operation = undefined;
        this.previousOperand = '';
    }

    getDisplayNumber(number) {
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        let integerDisplay;
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 });
        }
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }

    updateDisplay() {
        this.currentOperandTextElement.innerText =
            this.getDisplayNumber(this.currentOperand);
        if (this.operation != null) {
            this.previousOperandTextElement.innerText =
                `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandTextElement.innerText = '';
        }
    }
}

const numberButtons = document.querySelectorAll('[data-number]');
const operationButtons = document.querySelectorAll('[data-operation]');
const equalsButton = document.querySelector('[data-equals]');
const deleteButton = document.querySelector('[data-delete]');
const allClearButton = document.querySelector('[data-all-clear]');
const previousOperandTextElement = document.querySelector('[data-previous-operand]');
const currentOperandTextElement = document.querySelector('[data-current-operand]');

const calculator = new Calculator(previousOperandTextElement, currentOperandTextElement);

numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.appendNumber(button.innerText);
        calculator.updateDisplay();
    });
});

operationButtons.forEach(button => {
    button.addEventListener('click', () => {
        calculator.chooseOperation(button.innerText);
        calculator.updateDisplay();
    });
});

equalsButton.addEventListener('click', button => {
    calculator.compute();
    calculator.updateDisplay();
});

allClearButton.addEventListener('click', button => {
    calculator.clear();
    calculator.updateDisplay();
});

deleteButton.addEventListener('click', button => {
    calculator.delete();
    calculator.updateDisplay();
});
