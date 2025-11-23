const coinElement = document.getElementById('coin');
const coinStatus = document.getElementById('coinStatus');
const coinFlipBtn = document.getElementById('coinFlipBtn');

let coinIsFlipping = false;

function initCoinToss() {
    coinIsFlipping = false;
    if (coinElement) {
        coinElement.style.animation = 'none';
        coinElement.style.transform = 'rotateY(0)';
    }
    if (coinStatus) coinStatus.innerText = "Ready to Flip";
    if (coinFlipBtn) coinFlipBtn.disabled = false;
}

function flipCoin() {
    if (coinIsFlipping) return;

    coinIsFlipping = true;
    coinFlipBtn.disabled = true;
    coinStatus.innerText = "Flipping...";

    // Random result: 0 = Heads, 1 = Tails
    const result = Math.random() < 0.5 ? 'heads' : 'tails';

    // Reset animation
    coinElement.style.animation = 'none';
    // Trigger reflow
    coinElement.offsetHeight;

    // Animate
    // We want it to spin a lot and land on the result.
    // Heads = 0deg (or 360, 720...)
    // Tails = 180deg (or 540, 900...)

    const rotations = 5; // 5 full spins
    const degrees = result === 'heads' ? (rotations * 360) : (rotations * 360) + 180;

    coinElement.style.transition = 'transform 3s cubic-bezier(0.4, 2.0, 0.2, 1)'; // Bouncy effect
    coinElement.style.transform = `rotateY(${degrees}deg)`;

    setTimeout(() => {
        coinIsFlipping = false;
        coinFlipBtn.disabled = false;
        coinStatus.innerText = result === 'heads' ? "HEADS!" : "TAILS!";
    }, 3000);
}

// Expose
window.initCoinToss = initCoinToss;
window.flipCoin = flipCoin;
