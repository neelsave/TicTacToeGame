let rpsPlayer1Choice = null;
let rpsPlayer2Choice = null;
let rpsTurn = 1;

const rpsStatusDisplay = document.getElementById('rpsStatusDisplay');
const rpsSelectionArea = document.getElementById('rpsSelectionArea');
const rpsResultArea = document.getElementById('rpsResultArea');
const rpsP1Result = document.getElementById('rpsP1Result');
const rpsP2Result = document.getElementById('rpsP2Result');
const rpsWinnerDisplay = document.getElementById('rpsWinnerDisplay');

function initRPS() {
    rpsPlayer1Choice = null;
    rpsPlayer2Choice = null;
    rpsTurn = 1;

    rpsSelectionArea.classList.remove('hidden');
    rpsResultArea.classList.add('hidden');

    updateRPSStatus();
}

function makeRPSChoice(choice) {
    if (rpsTurn === 1) {
        rpsPlayer1Choice = choice;
        rpsTurn = 2;
        updateRPSStatus();
    } else {
        rpsPlayer2Choice = choice;
        showRPSResult();
    }
}

function updateRPSStatus() {
    if (rpsStatusDisplay) {
        rpsStatusDisplay.innerHTML = `Player <span class="${rpsTurn === 1 ? 'text-blue' : 'text-green'}">${rpsTurn}</span> is choosing... (Hide screen!)`;
    }
}

function showRPSResult() {
    rpsSelectionArea.classList.add('hidden');
    rpsResultArea.classList.remove('hidden');

    rpsP1Result.innerText = getRPSIcon(rpsPlayer1Choice);
    rpsP2Result.innerText = getRPSIcon(rpsPlayer2Choice);

    const winner = determineRPSWinner();
    rpsWinnerDisplay.innerText = winner;
}

function getRPSIcon(choice) {
    switch (choice) {
        case 'rock': return '🪨';
        case 'paper': return '📄';
        case 'scissors': return '✂️';
        default: return '?';
    }
}

function determineRPSWinner() {
    if (rpsPlayer1Choice === rpsPlayer2Choice) return "It's a Draw!";

    if (
        (rpsPlayer1Choice === 'rock' && rpsPlayer2Choice === 'scissors') ||
        (rpsPlayer1Choice === 'paper' && rpsPlayer2Choice === 'rock') ||
        (rpsPlayer1Choice === 'scissors' && rpsPlayer2Choice === 'paper')
    ) {
        return "Player 1 Wins!";
    } else {
        return "Player 2 Wins!";
    }
}

// Expose to global
window.initRPS = initRPS;
window.makeRPSChoice = makeRPSChoice;
