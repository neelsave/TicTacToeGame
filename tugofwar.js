const tugProgress = document.getElementById('tugProgress');
const tugStatus = document.getElementById('tugStatus');
const tugP1Btn = document.getElementById('tugP1Btn');
const tugP2Btn = document.getElementById('tugP2Btn');

let tugPosition = 50; // 0 to 100, 50 is center
let tugGameActive = false;

function initTugOfWar() {
    tugPosition = 50;
    tugGameActive = true;
    updateTugUI();
    if (tugStatus) tugStatus.innerText = "MASH BUTTONS! (A vs L)";

    // Enable buttons for mobile/click support
    if (tugP1Btn) tugP1Btn.disabled = false;
    if (tugP2Btn) tugP2Btn.disabled = false;
}

function updateTugUI() {
    if (tugProgress) {
        tugProgress.style.width = `${tugPosition}%`;
    }
}

function handleTug(player) {
    if (!tugGameActive) return;

    const pullStrength = 2; // How much it moves per tap

    if (player === 1) {
        tugPosition -= pullStrength;
    } else {
        tugPosition += pullStrength;
    }

    updateTugUI();
    checkTugWin();
}

function checkTugWin() {
    if (tugPosition <= 0) {
        endTugGame(1);
    } else if (tugPosition >= 100) {
        endTugGame(2);
    }
}

function endTugGame(winner) {
    tugGameActive = false;
    if (tugStatus) tugStatus.innerText = `Player ${winner} Wins! 💪`;

    if (tugP1Btn) tugP1Btn.disabled = true;
    if (tugP2Btn) tugP2Btn.disabled = true;
}

// Keyboard Controls
window.addEventListener('keydown', (e) => {
    if (!tugGameActive) return;

    if (e.key.toLowerCase() === 'a') {
        handleTug(1);
    }
    if (e.key.toLowerCase() === 'l') {
        handleTug(2);
    }
});

// Expose
window.initTugOfWar = initTugOfWar;
window.handleTug = handleTug;
