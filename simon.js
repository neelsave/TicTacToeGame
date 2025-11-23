let simonSequence = [];
let simonP1Input = [];
let simonP2Input = [];
let simonGameActive = false;
let simonIsShowingSequence = false;
let simonP1Eliminated = false;
let simonP2Eliminated = false;

const SIMON_COLORS = ['red', 'green', 'blue', 'yellow'];

function initSimonDuel() {
    simonSequence = [];
    simonP1Input = [];
    simonP2Input = [];
    simonGameActive = true;
    simonIsShowingSequence = false;
    simonP1Eliminated = false;
    simonP2Eliminated = false;

    document.getElementById('simonGameOver').classList.add('hidden');
    updateSimonStatus("Watch the Sequence!");

    setTimeout(startSimonRound, 1000);
}

function startSimonRound() {
    if (!simonGameActive) return;

    // Add new color to sequence
    const randomColor = SIMON_COLORS[Math.floor(Math.random() * SIMON_COLORS.length)];
    simonSequence.push(randomColor);

    simonP1Input = [];
    simonP2Input = [];
    simonIsShowingSequence = true;

    playSimonSequence();
}

function playSimonSequence() {
    let i = 0;
    const interval = setInterval(() => {
        if (i >= simonSequence.length) {
            clearInterval(interval);
            simonIsShowingSequence = false;
            updateSimonStatus("Repeat the Sequence!");
            return;
        }

        flashSimonColor(simonSequence[i]);
        i++;
    }, 800);
}

function flashSimonColor(color) {
    // Flash for both players
    const p1Btn = document.querySelector(`#simonP1 .simon-btn.${color}`);
    const p2Btn = document.querySelector(`#simonP2 .simon-btn.${color}`);

    if (p1Btn) p1Btn.classList.add('active');
    if (p2Btn) p2Btn.classList.add('active');

    // Play sound (optional, maybe later)

    setTimeout(() => {
        if (p1Btn) p1Btn.classList.remove('active');
        if (p2Btn) p2Btn.classList.remove('active');
    }, 400);
}

function handleSimonInput(player, color) {
    if (!simonGameActive || simonIsShowingSequence) return;
    if (player === 1 && simonP1Eliminated) return;
    if (player === 2 && simonP2Eliminated) return;

    // Visual feedback
    const btn = document.querySelector(`#simonP${player} .simon-btn.${color}`);
    btn.classList.add('active');
    setTimeout(() => btn.classList.remove('active'), 200);

    // Check logic
    const currentInput = player === 1 ? simonP1Input : simonP2Input;
    currentInput.push(color);

    const currentIndex = currentInput.length - 1;

    if (currentInput[currentIndex] !== simonSequence[currentIndex]) {
        // Mistake!
        eliminateSimonPlayer(player);
    } else {
        // Correct so far
        if (currentInput.length === simonSequence.length) {
            // Finished sequence
            checkSimonRoundComplete();
        }
    }
}

function eliminateSimonPlayer(player) {
    if (player === 1) simonP1Eliminated = true;
    else simonP2Eliminated = true;

    document.querySelector(`#simonP${player}`).classList.add('eliminated');

    if (simonP1Eliminated && simonP2Eliminated) {
        endSimonGame(0); // Tie (both failed same round)
    } else if (simonP1Eliminated) {
        endSimonGame(2);
    } else if (simonP2Eliminated) {
        endSimonGame(1);
    }
}

function checkSimonRoundComplete() {
    // If both active players have finished the sequence, start next round
    const p1Done = simonP1Eliminated || simonP1Input.length === simonSequence.length;
    const p2Done = simonP2Eliminated || simonP2Input.length === simonSequence.length;

    if (p1Done && p2Done) {
        if (!simonP1Eliminated && !simonP2Eliminated) {
            updateSimonStatus("Correct! Next Round...");
            setTimeout(startSimonRound, 1500);
        }
    }
}

function updateSimonStatus(msg) {
    document.getElementById('simonStatus').innerText = msg;
}

function endSimonGame(winner) {
    simonGameActive = false;
    const msg = winner === 0 ? "Both Failed! Tie!" : `Player ${winner} Wins!`;

    const gameOverEl = document.getElementById('simonGameOver');
    gameOverEl.classList.remove('hidden');
    gameOverEl.innerHTML = `
        <h2>${msg}</h2>
        <p>Score: ${simonSequence.length - 1}</p>
        <button class="btn-reset" onclick="initSimonDuel()">Play Again</button>
        <button class="btn-home" onclick="showHome()">Home</button>
    `;
}

// Expose
window.initSimonDuel = initSimonDuel;
window.handleSimonInput = handleSimonInput;
