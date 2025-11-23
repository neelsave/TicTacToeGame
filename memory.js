const MEMORY_CARDS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
let memoryGrid = [];
let memoryFlippedCards = [];
let memoryMatchedPairs = 0;
let memoryPlayer1Score = 0;
let memoryPlayer2Score = 0;
let memoryCurrentPlayer = 1;
let memoryLockBoard = false;

const memoryBoardElement = document.getElementById('memoryBoard');
const memoryStatusDisplay = document.getElementById('memoryStatusDisplay');
const memoryScore1 = document.getElementById('memoryScore1');
const memoryScore2 = document.getElementById('memoryScore2');

function initMemory() {
    memoryGrid = [...MEMORY_CARDS, ...MEMORY_CARDS];
    memoryGrid.sort(() => 0.5 - Math.random());

    memoryFlippedCards = [];
    memoryMatchedPairs = 0;
    memoryPlayer1Score = 0;
    memoryPlayer2Score = 0;
    memoryCurrentPlayer = 1;
    memoryLockBoard = false;

    updateMemoryScore();
    updateMemoryStatus();
    renderMemoryBoard();
}

function renderMemoryBoard() {
    memoryBoardElement.innerHTML = '';
    memoryGrid.forEach((icon, index) => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.dataset.index = index;
        card.onclick = () => flipCard(card, icon);

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

function flipCard(card, icon) {
    if (memoryLockBoard) return;
    if (card.classList.contains('flipped')) return;
    if (memoryFlippedCards.length === 2) return; // Should be handled by lockBoard but safety check

    card.classList.add('flipped');
    memoryFlippedCards.push({ card, icon });

    if (memoryFlippedCards.length === 2) {
        checkMatch();
    }
}

function checkMatch() {
    const [card1, card2] = memoryFlippedCards;
    const isMatch = card1.icon === card2.icon;

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
        memoryFlippedCards.forEach(item => item.card.classList.remove('flipped'));
        memoryFlippedCards = [];
        memoryLockBoard = false;
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
    if (memoryScore1) memoryScore1.innerText = memoryPlayer1Score;
    if (memoryScore2) memoryScore2.innerText = memoryPlayer2Score;
}

function updateMemoryStatus() {
    if (memoryStatusDisplay) memoryStatusDisplay.innerHTML = `Player <span class="${memoryCurrentPlayer === 1 ? 'text-blue' : 'text-green'}">${memoryCurrentPlayer}</span>'s Turn`;
}

// Expose to global
window.initMemory = initMemory;
