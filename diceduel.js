let diceP1Score = 0;
let diceP2Score = 0;
let diceP1Roll = 0;
let diceP2Roll = 0;
let diceGameActive = false;
let diceIsRolling = false;

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function initDiceDuel() {
    diceP1Score = 0;
    diceP2Score = 0;
    diceP1Roll = 0;
    diceP2Roll = 0;
    diceGameActive = true;
    diceIsRolling = false;

    updateDiceUI();
    resetDiceRound();
    document.getElementById('diceGameOver').classList.add('hidden');
}

function resetDiceRound() {
    diceP1Roll = 0;
    diceP2Roll = 0;
    diceIsRolling = false;

    document.getElementById('diceP1Display').innerText = "?";
    document.getElementById('diceP2Display').innerText = "?";
    document.getElementById('diceStatus').innerText = "Roll the Dice!";

    document.getElementById('diceBtn1').disabled = false;
    document.getElementById('diceBtn2').disabled = false;
    document.getElementById('diceBtn1').classList.remove('hidden');
    document.getElementById('diceBtn2').classList.remove('hidden');
}

function rollDice(player) {
    if (!diceGameActive || diceIsRolling) return;

    // Check if this player already rolled
    if (player === 1 && diceP1Roll !== 0) return;
    if (player === 2 && diceP2Roll !== 0) return;

    const roll = Math.floor(Math.random() * 6) + 1;

    if (player === 1) {
        diceP1Roll = roll;
        document.getElementById('diceP1Display').innerText = DICE_FACES[roll - 1];
        document.getElementById('diceBtn1').classList.add('hidden');
    } else {
        diceP2Roll = roll;
        document.getElementById('diceP2Display').innerText = DICE_FACES[roll - 1];
        document.getElementById('diceBtn2').classList.add('hidden');
    }

    checkDiceRound();
}

function checkDiceRound() {
    if (diceP1Roll !== 0 && diceP2Roll !== 0) {
        diceIsRolling = true;

        let msg = "";
        if (diceP1Roll > diceP2Roll) {
            diceP1Score++;
            msg = "Player 1 Wins Round!";
        } else if (diceP2Roll > diceP1Roll) {
            diceP2Score++;
            msg = "Player 2 Wins Round!";
        } else {
            msg = "It's a Tie!";
        }

        document.getElementById('diceStatus').innerText = msg;
        updateDiceUI();

        if (diceP1Score >= 5 || diceP2Score >= 5) {
            setTimeout(() => endDiceGame(diceP1Score >= 5 ? 1 : 2), 1500);
        } else {
            setTimeout(resetDiceRound, 2000);
        }
    }
}

function updateDiceUI() {
    document.getElementById('diceScore1').innerText = `P1: ${diceP1Score}`;
    document.getElementById('diceScore2').innerText = `P2: ${diceP2Score}`;
}

function endDiceGame(winner) {
    diceGameActive = false;
    const gameOverEl = document.getElementById('diceGameOver');
    gameOverEl.classList.remove('hidden');
    gameOverEl.innerHTML = `
        <h2>Player ${winner} Wins!</h2>
        <button class="btn-reset" onclick="initDiceDuel()">Play Again</button>
        <button class="btn-home" onclick="showHome()">Home</button>
    `;
}

// Expose
window.initDiceDuel = initDiceDuel;
window.rollDice = rollDice;
