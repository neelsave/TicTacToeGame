const snakeCanvas = document.getElementById('snakeCanvas');
const snakeCtx = snakeCanvas ? snakeCanvas.getContext('2d') : null;
const snakeStatus = document.getElementById('snakeStatus');

let snakeGameActive = false;
let snakeAnimationId;

const GRID_SIZE = 20;
const TILE_COUNT = 20; // 400x400 canvas

// Player 1 (Green)
let snake1 = {
    body: [{ x: 5, y: 10 }],
    dx: 1,
    dy: 0,
    color: '#4ade80',
    nextDx: 1,
    nextDy: 0
};

// Player 2 (Blue)
let snake2 = {
    body: [{ x: 15, y: 10 }],
    dx: -1,
    dy: 0,
    color: '#38bdf8',
    nextDx: -1,
    nextDy: 0
};

function initSnake() {
    if (!snakeCanvas) return;

    snakeCanvas.width = 400;
    snakeCanvas.height = 400;

    // Reset Snakes
    snake1 = {
        body: [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }],
        dx: 1,
        dy: 0,
        color: '#4ade80',
        nextDx: 1,
        nextDy: 0
    };

    snake2 = {
        body: [{ x: 15, y: 10 }, { x: 16, y: 10 }, { x: 17, y: 10 }],
        dx: -1,
        dy: 0,
        color: '#38bdf8',
        nextDx: -1,
        nextDy: 0
    };

    snakeGameActive = true;
    snakeStatus.innerText = "Avoid walls and each other!";

    if (snakeAnimationId) clearInterval(snakeAnimationId);
    snakeAnimationId = setInterval(gameLoopSnake, 100);
}

function gameLoopSnake() {
    if (!snakeGameActive) return;

    updateSnake(snake1);
    updateSnake(snake2);

    if (checkCollisions()) {
        snakeGameActive = false;
        clearInterval(snakeAnimationId);
        return;
    }

    renderSnake();
}

function updateSnake(snake) {
    snake.dx = snake.nextDx;
    snake.dy = snake.nextDy;

    const head = { x: snake.body[0].x + snake.dx, y: snake.body[0].y + snake.dy };
    snake.body.unshift(head);
    snake.body.pop(); // No food, just survival/tron style? Or grow? 
    // Let's do Tron style (infinite growth? No, constant length but leave trail? 
    // Or standard snake but 2 players?
    // Let's do standard snake movement, but if you hit wall or other snake you die.
    // To make it interesting without food, let's make them grow slowly automatically?
    // Or just keep constant length and try to cut each other off?
    // Let's add growth every 5 ticks to make it harder over time.
    // For simplicity now: Constant length, just survival.
}

function checkCollisions() {
    // Check Wall Collisions
    if (checkWall(snake1)) {
        snakeStatus.innerText = "Player 2 Wins! (P1 hit wall)";
        return true;
    }
    if (checkWall(snake2)) {
        snakeStatus.innerText = "Player 1 Wins! (P2 hit wall)";
        return true;
    }

    // Check Head-to-Head
    if (snake1.body[0].x === snake2.body[0].x && snake1.body[0].y === snake2.body[0].y) {
        snakeStatus.innerText = "Draw! Head-on collision.";
        return true;
    }

    // Check Body Collisions (P1 hits P2 or self)
    if (checkBody(snake1, snake2) || checkBody(snake1, snake1)) {
        snakeStatus.innerText = "Player 2 Wins! (P1 crashed)";
        return true;
    }

    // Check Body Collisions (P2 hits P1 or self)
    if (checkBody(snake2, snake1) || checkBody(snake2, snake2)) {
        snakeStatus.innerText = "Player 1 Wins! (P2 crashed)";
        return true;
    }

    return false;
}

function checkWall(snake) {
    const head = snake.body[0];
    return head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT;
}

function checkBody(snake, targetSnake) {
    const head = snake.body[0];
    // Start from 1 if checking self, 0 if checking other
    const startIndex = (snake === targetSnake) ? 1 : 0;

    for (let i = startIndex; i < targetSnake.body.length; i++) {
        if (head.x === targetSnake.body[i].x && head.y === targetSnake.body[i].y) {
            return true;
        }
    }
    return false;
}

function renderSnake() {
    // Clear
    snakeCtx.fillStyle = '#0f172a';
    snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);

    // Draw P1
    snakeCtx.fillStyle = snake1.color;
    snake1.body.forEach(part => {
        snakeCtx.fillRect(part.x * GRID_SIZE, part.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
    });

    // Draw P2
    snakeCtx.fillStyle = snake2.color;
    snake2.body.forEach(part => {
        snakeCtx.fillRect(part.x * GRID_SIZE, part.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
    });
}

// Controls
window.addEventListener('keydown', (e) => {
    // P1 (WASD)
    if (e.key === 'w' && snake1.dy !== 1) { snake1.nextDx = 0; snake1.nextDy = -1; }
    if (e.key === 's' && snake1.dy !== -1) { snake1.nextDx = 0; snake1.nextDy = 1; }
    if (e.key === 'a' && snake1.dx !== 1) { snake1.nextDx = -1; snake1.nextDy = 0; }
    if (e.key === 'd' && snake1.dx !== -1) { snake1.nextDx = 1; snake1.nextDy = 0; }

    // P2 (Arrows)
    if (e.key === 'ArrowUp' && snake2.dy !== 1) { snake2.nextDx = 0; snake2.nextDy = -1; }
    if (e.key === 'ArrowDown' && snake2.dy !== -1) { snake2.nextDx = 0; snake2.nextDy = 1; }
    if (e.key === 'ArrowLeft' && snake2.dx !== 1) { snake2.nextDx = -1; snake2.nextDy = 0; }
    if (e.key === 'ArrowRight' && snake2.dx !== -1) { snake2.nextDx = 1; snake2.nextDy = 0; }
});

// Expose
window.initSnake = initSnake;
