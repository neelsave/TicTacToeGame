const pongCanvas = document.getElementById('pongCanvas');
const pongCtx = pongCanvas ? pongCanvas.getContext('2d') : null;
const pongScore1 = document.getElementById('pongScore1');
const pongScore2 = document.getElementById('pongScore2');

let pongGameActive = false;
let pongAnimationId;

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

function initPong() {
    if (!pongCanvas) return;

    // Set canvas size
    pongCanvas.width = 600;
    pongCanvas.height = 400;

    // Reset positions
    paddle1.y = pongCanvas.height / 2 - paddleHeight / 2;
    paddle2.x = pongCanvas.width - paddleWidth - 10;
    paddle2.y = pongCanvas.height / 2 - paddleHeight / 2;

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
    if (keys.w && paddle1.y > 0) {
        paddle1.y -= paddle1.speed;
    }
    if (keys.s && paddle1.y < pongCanvas.height - paddle1.height) {
        paddle1.y += paddle1.speed;
    }
    if (keys.ArrowUp && paddle2.y > 0) {
        paddle2.y -= paddle2.speed;
    }
    if (keys.ArrowDown && paddle2.y < pongCanvas.height - paddle2.height) {
        paddle2.y += paddle2.speed;
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

// Event Listeners
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

// Expose to global
window.initPong = initPong;
