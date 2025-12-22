const pongCanvas = document.getElementById('pongCanvas');
const pongCtx = pongCanvas ? pongCanvas.getContext('2d') : null;
const pongScore1 = document.getElementById('pongScore1');
const pongScore2 = document.getElementById('pongScore2');
const pongSetupScreen = document.getElementById('pongSetupScreen');
const pongGameContainer = document.getElementById('pongGameContainer');
const pongModeLocalBtn = document.getElementById('pongModeLocalBtn');
const pongModeComputerBtn = document.getElementById('pongModeComputerBtn');
const pongStartBtn = document.getElementById('pongStartBtn');

let pongGameActive = false;
let pongAnimationId;
let pongMode = 'local'; // 'local' or 'computer'

// Game Objects
const ball = {
    x: 0,
    y: 0,
    radius: 10,
    speed: 5,
    dx: 5,
    dy: 5,
    color: '#fff'
};

const paddleHeight = 100;
const paddleWidth = 10;
const paddle1 = {
    x: 10,
    y: 0, // Set in init
    width: paddleWidth,
    height: paddleHeight,
    color: '#38bdf8', // Blue
    score: 0,
    dy: 0,
    speed: 8
};

const paddle2 = {
    x: 0, // Set in init
    y: 0, // Set in init
    width: paddleWidth,
    height: paddleHeight,
    color: '#f472b6', // Pink
    score: 0,
    dy: 0,
    speed: 8
};

// Controls
const keys = {
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false
};

// Touch State
let touchY = null;

function initPong() {
    // Show setup first
    showPongSetup();
}

function showPongSetup() {
    if (pongSetupScreen) pongSetupScreen.classList.remove('hidden');
    if (pongGameContainer) pongGameContainer.classList.add('hidden');
    pongGameActive = false;
    if (pongAnimationId) cancelAnimationFrame(pongAnimationId);
}

function startGame() {
    if (!pongCanvas) return;

    if (pongSetupScreen) pongSetupScreen.classList.add('hidden');
    if (pongGameContainer) pongGameContainer.classList.remove('hidden');

    // Set canvas size responsive
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Reset positions
    resetPaddles();
    resetBall();

    // Reset scores
    paddle1.score = 0;
    paddle2.score = 0;
    updatePongScores();

    pongGameActive = true;

    // Start loop
    if (pongAnimationId) cancelAnimationFrame(pongAnimationId);
    gameLoop();
}

function resizeCanvas() {
    if (!pongCanvas) return;
    const container = document.getElementById('pongArea');
    if (container) {
        pongCanvas.width = container.clientWidth;
        pongCanvas.height = Math.min(400, container.clientWidth * 0.6); // Aspect ratio
    }
    resetPaddles();
}

function resetPaddles() {
    paddle1.y = pongCanvas.height / 2 - paddleHeight / 2;
    paddle2.x = pongCanvas.width - paddleWidth - 10;
    paddle2.y = pongCanvas.height / 2 - paddleHeight / 2;
}

function resetBall() {
    ball.x = pongCanvas.width / 2;
    ball.y = pongCanvas.height / 2;
    ball.speed = 5;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.dy = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
}

function drawRect(x, y, w, h, color) {
    pongCtx.fillStyle = color;
    pongCtx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
    pongCtx.fillStyle = color;
    pongCtx.beginPath();
    pongCtx.arc(x, y, r, 0, Math.PI * 2, false);
    pongCtx.closePath();
    pongCtx.fill();
}

function drawNet() {
    for (let i = 0; i <= pongCanvas.height; i += 20) {
        drawRect(pongCanvas.width / 2 - 1, i, 2, 10, '#fff');
    }
}

function updatePong() {
    // Move paddles
    // Player 1 (Left) - Controlled by W/S or Touch
    if (keys.w && paddle1.y > 0) {
        paddle1.y -= paddle1.speed;
    }
    if (keys.s && paddle1.y < pongCanvas.height - paddle1.height) {
        paddle1.y += paddle1.speed;
    }

    // Touch Control for Player 1
    if (touchY !== null) {
        // Center paddle on touch
        let targetY = touchY - paddle1.height / 2;
        // Clamp
        targetY = Math.max(0, Math.min(pongCanvas.height - paddle1.height, targetY));
        // Smooth move
        paddle1.y += (targetY - paddle1.y) * 0.2;
    }

    // Player 2 (Right) - Controlled by Arrows or AI
    if (pongMode === 'computer') {
        // Simple AI
        let targetY = ball.y - paddle2.height / 2;
        // Add some imperfection/reaction delay based on ball x distance
        // If ball is moving away, return to center
        if (ball.dx < 0) {
            targetY = pongCanvas.height / 2 - paddle2.height / 2;
        }

        // Clamp
        targetY = Math.max(0, Math.min(pongCanvas.height - paddle2.height, targetY));

        // Move towards target with speed limit
        if (paddle2.y < targetY) {
            paddle2.y += Math.min(paddle2.speed * 0.8, targetY - paddle2.y); // Slightly slower than player
        } else if (paddle2.y > targetY) {
            paddle2.y -= Math.min(paddle2.speed * 0.8, paddle2.y - targetY);
        }

    } else {
        // Local Multiplayer
        if (keys.ArrowUp && paddle2.y > 0) {
            paddle2.y -= paddle2.speed;
        }
        if (keys.ArrowDown && paddle2.y < pongCanvas.height - paddle2.height) {
            paddle2.y += paddle2.speed;
        }
    }

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collision (top/bottom)
    if (ball.y + ball.radius > pongCanvas.height || ball.y - ball.radius < 0) {
        ball.dy *= -1;
    }

    // Paddle collision
    let player = (ball.x < pongCanvas.width / 2) ? paddle1 : paddle2;

    if (collision(ball, player)) {
        // Hit logic
        let collidePoint = (ball.y - (player.y + player.height / 2));
        collidePoint = collidePoint / (player.height / 2);

        let angleRad = (Math.PI / 4) * collidePoint;

        let direction = (ball.x < pongCanvas.width / 2) ? 1 : -1;

        ball.speed += 0.5; // Increase speed
        ball.dx = direction * ball.speed * Math.cos(angleRad);
        ball.dy = ball.speed * Math.sin(angleRad);
    }

    // Score update
    if (ball.x - ball.radius < 0) {
        paddle2.score++;
        updatePongScores();
        resetBall();
    } else if (ball.x + ball.radius > pongCanvas.width) {
        paddle1.score++;
        updatePongScores();
        resetBall();
    }
}

function collision(b, p) {
    p.top = p.y;
    p.bottom = p.y + p.height;
    p.left = p.x;
    p.right = p.x + p.width;

    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;

    return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
}

function renderPong() {
    // Clear canvas
    drawRect(0, 0, pongCanvas.width, pongCanvas.height, '#0f172a');

    drawNet();
    drawRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height, paddle1.color);
    drawRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height, paddle2.color);
    drawCircle(ball.x, ball.y, ball.radius, ball.color);
}

function gameLoop() {
    if (!pongGameActive) return;
    updatePong();
    renderPong();
    pongAnimationId = requestAnimationFrame(gameLoop);
}

function updatePongScores() {
    if (pongScore1) pongScore1.innerText = paddle1.score;
    if (pongScore2) pongScore2.innerText = paddle2.score;
}

// Setup Event Listeners
if (pongModeLocalBtn) {
    pongModeLocalBtn.addEventListener('click', () => {
        pongMode = 'local';
        pongModeLocalBtn.classList.add('active');
        pongModeComputerBtn.classList.remove('active');
    });
}

if (pongModeComputerBtn) {
    pongModeComputerBtn.addEventListener('click', () => {
        pongMode = 'computer';
        pongModeComputerBtn.classList.add('active');
        pongModeLocalBtn.classList.remove('active');
    });
}

if (pongStartBtn) {
    pongStartBtn.addEventListener('click', startGame);
}

// Game Controls
window.addEventListener('keydown', (e) => {
    if (e.key === 'w') keys.w = true;
    if (e.key === 's') keys.s = true;
    if (e.key === 'ArrowUp') keys.ArrowUp = true;
    if (e.key === 'ArrowDown') keys.ArrowDown = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'w') keys.w = false;
    if (e.key === 's') keys.s = false;
    if (e.key === 'ArrowUp') keys.ArrowUp = false;
    if (e.key === 'ArrowDown') keys.ArrowDown = false;
});

// Touch Controls
if (pongCanvas) {
    pongCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = pongCanvas.getBoundingClientRect();
        const touch = e.touches[0];
        touchY = (touch.clientY - rect.top) * (pongCanvas.height / rect.height);
    }, { passive: false });

    pongCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = pongCanvas.getBoundingClientRect();
        const touch = e.touches[0];
        touchY = (touch.clientY - rect.top) * (pongCanvas.height / rect.height);
    }, { passive: false });

    pongCanvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        touchY = null;
    });
}

// Expose to global
window.initPong = initPong;
window.showPongSetup = showPongSetup;
