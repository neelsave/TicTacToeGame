let mathP1Score = 0;
let mathP2Score = 0;
let mathCorrectAnswer = 0;
let mathGameActive = false;

function initMathDuel() {
    mathP1Score = 0;
    mathP2Score = 0;
    mathGameActive = true;
    updateMathScores();
    generateMathProblem();

    document.getElementById('mathGameOver').classList.add('hidden');
}

function generateMathProblem() {
    if (!mathGameActive) return;

    // Simple arithmetic: +, -, *
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let a, b;
    if (operator === '*') {
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
    } else {
        a = Math.floor(Math.random() * 20) + 1;
        b = Math.floor(Math.random() * 20) + 1;
    }

    const question = `${a} ${operator} ${b}`;
    mathCorrectAnswer = eval(question);

    // Generate answers (1 correct, 2 wrong)
    let answers = [mathCorrectAnswer];
    while (answers.length < 3) {
        let wrong = mathCorrectAnswer + Math.floor(Math.random() * 10) - 5;
        if (wrong !== mathCorrectAnswer && !answers.includes(wrong)) {
            answers.push(wrong);
        }
    }

    // Shuffle answers
    answers.sort(() => Math.random() - 0.5);

    // Update UI for both players
    document.getElementById('mathQ1').innerText = question;
    document.getElementById('mathQ2').innerText = question;

    renderMathOptions('mathOptions1', answers, 1);
    renderMathOptions('mathOptions2', answers, 2);
}

function renderMathOptions(elementId, answers, player) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';

    answers.forEach(ans => {
        const btn = document.createElement('button');
        btn.className = 'math-option';
        btn.innerText = ans;
        btn.onclick = () => handleMathAnswer(player, ans);
        container.appendChild(btn);
    });
}

function handleMathAnswer(player, answer) {
    if (!mathGameActive) return;

    if (answer === mathCorrectAnswer) {
        // Correct!
        if (player === 1) mathP1Score++;
        else mathP2Score++;

        updateMathScores();

        if (mathP1Score >= 10 || mathP2Score >= 10) {
            endMathGame(player);
        } else {
            generateMathProblem();
        }
    } else {
        // Wrong! Deduct point or just ignore? Let's deduct to prevent spamming
        if (player === 1) mathP1Score = Math.max(0, mathP1Score - 1);
        else mathP2Score = Math.max(0, mathP2Score - 1);
        updateMathScores();

        // Visual feedback for wrong answer could be added here
        const container = document.getElementById(player === 1 ? 'mathOptions1' : 'mathOptions2');
        container.classList.add('shake');
        setTimeout(() => container.classList.remove('shake'), 500);
    }
}

function updateMathScores() {
    document.getElementById('mathScore1').innerText = `P1: ${mathP1Score}`;
    document.getElementById('mathScore2').innerText = `P2: ${mathP2Score}`;
}

function endMathGame(winner) {
    mathGameActive = false;
    const gameOverEl = document.getElementById('mathGameOver');
    gameOverEl.classList.remove('hidden');
    gameOverEl.innerHTML = `
        <h2>Player ${winner} Wins!</h2>
        <button class="btn-reset" onclick="initMathDuel()">Play Again</button>
        <button class="btn-home" onclick="showHome()">Home</button>
    `;
}

// Expose
window.initMathDuel = initMathDuel;
