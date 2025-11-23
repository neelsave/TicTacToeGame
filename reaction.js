let reactionP1Score = 0;
let reactionP2Score = 0;
let reactionState = 'idle'; // idle, waiting, go, ended
let reactionTimeout;

function initReactionDuel() {
    reactionP1Score = 0;
    reactionP2Score = 0;
    updateReactionScores();
    resetReactionRound();

    document.getElementById('reactionGameOver').classList.add('hidden');
}

function resetReactionRound() {
    reactionState = 'idle';
    document.getElementById('reactionArea1').className = 'reaction-area p1-area idle';
    document.getElementById('reactionArea2').className = 'reaction-area p2-area idle';
    document.getElementById('reactionMsg1').innerText = "Tap to Start";
    document.getElementById('reactionMsg2').innerText = "Tap to Start";
}

function startReactionRound() {
    if (reactionState === 'waiting' || reactionState === 'go') return;

    reactionState = 'waiting';
    document.getElementById('reactionArea1').className = 'reaction-area p1-area waiting';
    document.getElementById('reactionArea2').className = 'reaction-area p2-area waiting';
    document.getElementById('reactionMsg1').innerText = "WAIT...";
    document.getElementById('reactionMsg2').innerText = "WAIT...";

    // Random delay between 2 and 6 seconds
    const delay = Math.floor(Math.random() * 4000) + 2000;

    clearTimeout(reactionTimeout);
    reactionTimeout = setTimeout(() => {
        if (reactionState === 'waiting') {
            reactionState = 'go';
            document.getElementById('reactionArea1').className = 'reaction-area p1-area go';
            document.getElementById('reactionArea2').className = 'reaction-area p2-area go';
            document.getElementById('reactionMsg1').innerText = "TAP!";
            document.getElementById('reactionMsg2').innerText = "TAP!";
        }
    }, delay);
}

function handleReactionTap(player) {
    if (reactionState === 'idle') {
        startReactionRound();
        return;
    }

    if (reactionState === 'ended') return;

    if (reactionState === 'waiting') {
        // False start! Other player wins round
        handleRoundWin(player === 1 ? 2 : 1, "False Start!");
    } else if (reactionState === 'go') {
        // Valid win
        handleRoundWin(player, "Winner!");
    }
}

function handleRoundWin(winner, reason) {
    reactionState = 'ended';
    clearTimeout(reactionTimeout);

    if (winner === 1) reactionP1Score++;
    else reactionP2Score++;

    updateReactionScores();

    document.getElementById('reactionMsg1').innerText = winner === 1 ? reason : "Too Slow / False Start";
    document.getElementById('reactionMsg2').innerText = winner === 2 ? reason : "Too Slow / False Start";

    document.getElementById('reactionArea1').className = `reaction-area p1-area ${winner === 1 ? 'win' : 'lose'}`;
    document.getElementById('reactionArea2').className = `reaction-area p2-area ${winner === 2 ? 'win' : 'lose'}`;

    if (reactionP1Score >= 5 || reactionP2Score >= 5) {
        setTimeout(() => endReactionGame(winner), 1000);
    } else {
        setTimeout(resetReactionRound, 2000);
    }
}

function updateReactionScores() {
    document.getElementById('reactionScore1').innerText = `P1: ${reactionP1Score}`;
    document.getElementById('reactionScore2').innerText = `P2: ${reactionP2Score}`;
}

function endReactionGame(winner) {
    const gameOverEl = document.getElementById('reactionGameOver');
    gameOverEl.classList.remove('hidden');
    gameOverEl.innerHTML = `
        <h2>Player ${winner} Wins!</h2>
        <button class="btn-reset" onclick="initReactionDuel()">Play Again</button>
        <button class="btn-home" onclick="showHome()">Home</button>
    `;
}

// Expose
window.initReactionDuel = initReactionDuel;
window.handleReactionTap = handleReactionTap;
