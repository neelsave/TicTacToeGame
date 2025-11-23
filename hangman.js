const hangmanWordInput = document.getElementById('hangmanWordInput');
const hangmanSetup = document.getElementById('hangmanSetup');
const hangmanGame = document.getElementById('hangmanGame');
const hangmanWordDisplay = document.getElementById('hangmanWordDisplay');
const hangmanKeyboard = document.getElementById('hangmanKeyboard');
const hangmanStatus = document.getElementById('hangmanStatus');
const hangmanDrawing = document.getElementById('hangmanDrawing');

let hangmanWord = "";
let hangmanGuessedLetters = [];
let hangmanWrongGuesses = 0;
const MAX_WRONG_GUESSES = 6;

function initHangman() {
    hangmanWord = "";
    hangmanGuessedLetters = [];
    hangmanWrongGuesses = 0;

    hangmanSetup.classList.remove('hidden');
    hangmanGame.classList.add('hidden');
    hangmanWordInput.value = "";
    hangmanStatus.innerText = "";

    // Clear drawing
    if (hangmanDrawing) {
        hangmanDrawing.innerHTML = `
            <line x1="10" y1="190" x2="190" y2="190" stroke="white" stroke-width="4"/>
            <line x1="50" y1="190" x2="50" y2="20" stroke="white" stroke-width="4"/>
            <line x1="50" y1="20" x2="120" y2="20" stroke="white" stroke-width="4"/>
            <line x1="120" y1="20" x2="120" y2="40" stroke="white" stroke-width="4"/>
        `;
    }
}

function startHangmanGame() {
    const word = hangmanWordInput.value.trim().toUpperCase();
    if (!word || !/^[A-Z]+$/.test(word)) {
        alert("Please enter a valid word (letters only).");
        return;
    }

    hangmanWord = word;
    hangmanSetup.classList.add('hidden');
    hangmanGame.classList.remove('hidden');

    renderHangmanWord();
    renderHangmanKeyboard();
    hangmanStatus.innerText = "Player 2, guess the word!";
}

function renderHangmanWord() {
    hangmanWordDisplay.innerHTML = hangmanWord.split('').map(letter => `
        <span class="letter">
            ${hangmanGuessedLetters.includes(letter) ? letter : ''}
        </span>
    `).join('');

    checkHangmanWin();
}

function renderHangmanKeyboard() {
    hangmanKeyboard.innerHTML = '';
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    letters.split('').forEach(letter => {
        const btn = document.createElement('button');
        btn.innerText = letter;
        btn.classList.add('key-btn');
        if (hangmanGuessedLetters.includes(letter)) {
            btn.disabled = true;
            btn.classList.add('disabled');
        }
        btn.onclick = () => handleHangmanGuess(letter);
        hangmanKeyboard.appendChild(btn);
    });
}

function handleHangmanGuess(letter) {
    if (hangmanGuessedLetters.includes(letter)) return;

    hangmanGuessedLetters.push(letter);

    if (!hangmanWord.includes(letter)) {
        hangmanWrongGuesses++;
        drawHangmanPart(hangmanWrongGuesses);
    }

    renderHangmanWord();
    renderHangmanKeyboard();
    checkHangmanLoss();
}

function drawHangmanPart(part) {
    // Simple SVG parts
    const parts = [
        `<circle cx="120" cy="60" r="20" stroke="white" stroke-width="4" fill="none"/>`, // Head
        `<line x1="120" y1="80" x2="120" y2="140" stroke="white" stroke-width="4"/>`, // Body
        `<line x1="120" y1="100" x2="90" y2="130" stroke="white" stroke-width="4"/>`, // Left Arm
        `<line x1="120" y1="100" x2="150" y2="130" stroke="white" stroke-width="4"/>`, // Right Arm
        `<line x1="120" y1="140" x2="100" y2="180" stroke="white" stroke-width="4"/>`, // Left Leg
        `<line x1="120" y1="140" x2="140" y2="180" stroke="white" stroke-width="4"/>`  // Right Leg
    ];

    if (part <= parts.length) {
        hangmanDrawing.innerHTML += parts[part - 1];
    }
}

function checkHangmanWin() {
    const isWin = hangmanWord.split('').every(l => hangmanGuessedLetters.includes(l));
    if (isWin) {
        hangmanStatus.innerText = "Player 2 Wins! 🎉";
        disableKeyboard();
    }
}

function checkHangmanLoss() {
    if (hangmanWrongGuesses >= MAX_WRONG_GUESSES) {
        hangmanStatus.innerText = `Game Over! The word was ${hangmanWord}`;
        disableKeyboard();
    }
}

function disableKeyboard() {
    const buttons = hangmanKeyboard.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);
}

// Expose
window.initHangman = initHangman;
window.startHangmanGame = startHangmanGame;
