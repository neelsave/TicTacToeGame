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

let currentRotation = 0;

function flipCoin() {
    if (coinIsFlipping) return;

    coinIsFlipping = true;
    coinFlipBtn.disabled = true;
    coinStatus.innerText = "Flipping...";

    // Random result: 0 = Heads, 1 = Tails
    const result = Math.random() < 0.5 ? 'heads' : 'tails';

    // Calculate new rotation
    // We want to add 5 full spins (1800 degrees) plus the target offset
    // If currently at 0, heads -> 1800, tails -> 1800 + 180
    // But we need to add to the *current* rotation to keep it spinning forward

    const spins = 5;
    const degreesPerSpin = 360;
    const extra = result === 'heads' ? 0 : 180;

    // We need to ensure we land on the correct face relative to 0
    // But since we just keep adding, we can just add (spins * 360) + adjustment
    // Wait, if we are at 180 (tails), and we want heads, we need to land on a multiple of 360.
    // If we are at 180 (tails), and we want tails, we need to land on 180 + 360*N.

    // Simplest way:
    // 1. Add 5 full spins to current
    currentRotation += (spins * degreesPerSpin);

    // 2. Adjust for result
    // If result is heads, we want modulo 360 to be 0.
    // If result is tails, we want modulo 360 to be 180.

    const currentMod = currentRotation % 360;

    if (result === 'heads') {
        // We want 0. If we are at 180, add 180. If at 0, add 0.
        if (currentMod !== 0) {
            currentRotation += (360 - currentMod);
        }
    } else {
        // We want 180. If we are at 0, add 180. If at 180, add 0.
        if (currentMod !== 180) {
            currentRotation += (180 - currentMod);
            // Or just currentRotation += 180 if we assume we are at 0 or 180.
            // But let's be safe with the math.
            // Actually, if currentMod is 0, we add 180.
            // If currentMod is 180, we add 0.
        }
    }

    // Ensure we are moving forward significantly
    // The above logic might just adjust by 180. We want the spins too.
    // So let's just add the spins *after* aligning? Or just add a big number?

    // Let's try a simpler approach:
    // Always add 1800 (5 spins).
    // Then check if we need 180 more to match the target.
    // But we need to know where we started.

    // Let's just track the target.
    // If target is Heads, we need a multiple of 360.
    // If target is Tails, we need multiple of 360 + 180.

    // Next target minimum = currentRotation + 1800.
    let nextTarget = currentRotation + 1800;

    const isHeads = result === 'heads';
    const targetMod = nextTarget % 360;

    if (isHeads) {
        // We want mod 0
        if (targetMod !== 0) {
            nextTarget += (360 - targetMod);
        }
    } else {
        // We want mod 180
        if (targetMod !== 180) {
            nextTarget += (180 + 360 - targetMod) % 360;
            // If targetMod is 0, we add 180. 
            // If targetMod is 180, we add 0.
        }
    }

    currentRotation = nextTarget;

    coinElement.style.transition = 'transform 3s cubic-bezier(0.4, 2.0, 0.2, 1)';
    coinElement.style.transform = `rotateY(${currentRotation}deg)`;

    setTimeout(() => {
        coinIsFlipping = false;
        coinFlipBtn.disabled = false;
        coinStatus.innerText = result === 'heads' ? "HEADS!" : "TAILS!";
    }, 3000);
}

// Expose
window.initCoinToss = initCoinToss;
window.flipCoin = flipCoin;
