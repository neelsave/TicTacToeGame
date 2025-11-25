const BUSINESS_BOARD = [
    { id: 0, name: "GO", type: "corner", color: "white" },
    { id: 1, name: "Guwahati", type: "property", color: "brown", price: 60, rent: 2 },
    { id: 2, name: "Community Chest", type: "chest", color: "white" },
    { id: 3, name: "Bhubaneswar", type: "property", color: "brown", price: 60, rent: 4 },
    { id: 4, name: "Income Tax", type: "tax", color: "white", price: 200 },
    { id: 5, name: "South Railway", type: "railroad", color: "black", price: 200, rent: 25 },
    { id: 6, name: "Jaipur", type: "property", color: "lightblue", price: 100, rent: 6 },
    { id: 7, name: "Chance", type: "chance", color: "white" },
    { id: 8, name: "Lucknow", type: "property", color: "lightblue", price: 100, rent: 6 },
    { id: 9, name: "Surat", type: "property", color: "lightblue", price: 120, rent: 8 },
    { id: 10, name: "Jail", type: "corner", color: "white" },
    { id: 11, name: "Pune", type: "property", color: "pink", price: 140, rent: 10 },
    { id: 12, name: "Electric Company", type: "utility", color: "white", price: 150 },
    { id: 13, name: "Hyderabad", type: "property", color: "pink", price: 140, rent: 10 },
    { id: 14, name: "Ahmedabad", type: "property", color: "pink", price: 160, rent: 12 },
    { id: 15, name: "West Railway", type: "railroad", color: "black", price: 200, rent: 25 },
    { id: 16, name: "Kolkata", type: "property", color: "orange", price: 180, rent: 14 },
    { id: 17, name: "Community Chest", type: "chest", color: "white" },
    { id: 18, name: "Chennai", type: "property", color: "orange", price: 180, rent: 14 },
    { id: 19, name: "Bangalore", type: "property", color: "orange", price: 200, rent: 16 },
    { id: 20, name: "Club", type: "corner", color: "white" }, // Free Parking
    { id: 21, name: "Delhi", type: "property", color: "red", price: 220, rent: 18 },
    { id: 22, name: "Chance", type: "chance", color: "white" },
    { id: 23, name: "Mumbai", type: "property", color: "red", price: 220, rent: 18 },
    { id: 24, name: "Chandigarh", type: "property", color: "red", price: 240, rent: 20 },
    { id: 25, name: "North Railway", type: "railroad", color: "black", price: 200, rent: 25 },
    { id: 26, name: "Goa", type: "property", color: "yellow", price: 260, rent: 22 },
    { id: 27, name: "Indore", type: "property", color: "yellow", price: 260, rent: 22 },
    { id: 28, name: "Water Works", type: "utility", color: "white", price: 150 },
    { id: 29, name: "Kochi", type: "property", color: "yellow", price: 280, rent: 24 },
    { id: 30, name: "Rest House", type: "corner", color: "white" }, // Go to Jail
    { id: 31, name: "Patna", type: "property", color: "green", price: 300, rent: 26 },
    { id: 32, name: "Bhopal", type: "property", color: "green", price: 300, rent: 26 },
    { id: 33, name: "Community Chest", type: "chest", color: "white" },
    { id: 34, name: "Nagpur", type: "property", color: "green", price: 320, rent: 28 },
    { id: 35, name: "East Railway", type: "railroad", color: "black", price: 200, rent: 25 },
    { id: 36, name: "Chance", type: "chance", color: "white" },
    { id: 37, name: "Agra", type: "property", color: "darkblue", price: 350, rent: 35 },
    { id: 38, name: "Luxury Tax", type: "tax", color: "white", price: 100 },
    { id: 39, name: "Varanasi", type: "property", color: "darkblue", price: 400, rent: 50 }
];

let businessPlayers = [];
let businessMyId = null;
let businessRoomId = null;
let businessTurnIndex = 0;
let businessGameActive = false;
let businessIsOnline = false;

const businessBoardElement = document.getElementById('businessBoard');
const businessStatus = document.getElementById('businessStatus');
const businessDiceBtn = document.getElementById('businessDiceBtn');
const businessDiceDisplay = document.getElementById('businessDiceDisplay');
const businessPlayersList = document.getElementById('businessPlayersList');

// Setup UI
const businessSetupScreen = document.getElementById('businessSetupScreen');
const businessGameContainer = document.getElementById('businessGameContainer');
const businessRoomInput = document.getElementById('businessRoomInput');
const businessJoinBtn = document.getElementById('businessJoinBtn');
const businessCreateBtn = document.getElementById('businessCreateBtn');

function initBusiness() {
    showBusinessSetup();
    // Initialize socket if not already done
    initBusinessSocket();

    // Attach Local Play Listener
    const localBtn = document.getElementById('businessLocalBtn');
    if (localBtn) {
        localBtn.onclick = startLocalBusinessGame;
    }
}

function showBusinessSetup() {
    if (businessSetupScreen) businessSetupScreen.classList.remove('hidden');
    if (businessGameContainer) businessGameContainer.classList.add('hidden');
}

function initBusinessSocket() {
    if (typeof io === 'undefined') {
        console.error("Socket.io library not loaded");
        return;
    }

    // Use global socket or create new one
    if (!window.socket) {
        window.socket = io('https://tictactoegame-zyid.onrender.com');
    }
    // Assign the global socket to the local 'socket' variable for convenience if it's not already global
    // Assuming 'socket' is a global variable or implicitly refers to window.socket
    socket = window.socket;

    // Remove existing listeners to avoid duplicates
    socket.off('business-joined');
    socket.off('business-start');
    socket.off('business-update');
    socket.off('business-error');

    socket.on('business-joined', (data) => {
        businessMyId = socket.id;
        businessRoomId = data.roomId;
        updateBusinessStatus(`Joined Room: ${data.roomId}. Waiting for players...`);
    });

    socket.on('business-start', (data) => {
        businessIsOnline = true;
        businessPlayers = data.players;
        businessTurnIndex = data.turnIndex;
        businessGameActive = true;

        businessSetupScreen.classList.add('hidden');
        businessGameContainer.classList.remove('hidden');

        renderBusinessBoard();
        updateBusinessUI();
    });

    socket.on('business-update', (data) => {
        businessPlayers = data.players;
        businessTurnIndex = data.turnIndex;
        if (data.lastDice) {
            const display = document.getElementById('centerDiceDisplay');
            if (display) display.innerText = `Dice: ${data.lastDice}`;
        }
        updateBusinessUI();
    });

    socket.on('business-error', (msg) => {
        alert(msg);
    });

    socket.on('room-list-update', (data) => {
        if (data.type === 'business') {
            renderBusinessRoomList(data.rooms);
        }
    });

    // Request initial list
    socket.emit('get-rooms', 'business');
}

function renderBusinessRoomList(rooms) {
    const list = document.getElementById('businessRoomList');
    if (!list) return;
    list.innerHTML = '<h3>Available Rooms:</h3>';
    if (rooms.length === 0) {
        list.innerHTML += '<p>No active rooms</p>';
        return;
    }
    rooms.forEach(room => {
        const div = document.createElement('div');
        div.className = 'room-item';
        div.innerHTML = `<span>${room.id} (${room.count}/4)</span>`;
        const btn = document.createElement('button');
        btn.innerText = 'Join';
        btn.onclick = () => {
            const input = document.getElementById('businessRoomInput');
            if (input) input.value = room.id;
            socket.emit('join-business-room', room.id);
        };
        div.appendChild(btn);
        list.appendChild(div);
    });
}

if (businessCreateBtn) {
    businessCreateBtn.addEventListener('click', () => {
        const roomId = businessRoomInput.value.trim() || 'BIZ-' + Math.floor(Math.random() * 1000);
        socket.emit('create-business-room', roomId);
    });
}

if (businessJoinBtn) {
    businessJoinBtn.addEventListener('click', () => {
        const roomId = businessRoomInput.value.trim();
        if (roomId) socket.emit('join-business-room', roomId);
        else alert("Enter Room ID");
    });
}



// ... (existing variables)

function startLocalBusinessGame() {
    businessIsOnline = false;
    businessPlayers = [
        { id: 'P1', money: 1500, position: 0, properties: [], color: 'red' },
        { id: 'P2', money: 1500, position: 0, properties: [], color: 'blue' },
        { id: 'P3', money: 1500, position: 0, properties: [], color: 'green' },
        { id: 'P4', money: 1500, position: 0, properties: [], color: 'orange' }
    ];
    businessProperties = {}; // Reset properties
    businessTurnIndex = 0;
    businessGameActive = true;
    businessMyId = null;

    businessSetupScreen.classList.add('hidden');
    businessGameContainer.classList.remove('hidden');

    renderBusinessBoard();
    updateBusinessUI();
}

// ... (initBusinessSocket remains mostly same, but sets businessIsOnline = true on start)

// Re-select elements dynamically or use global references if they are created dynamically
// We will create them in renderBusinessBoard, so we need to attach listeners there or delegate.
// Let's use a persistent object for the center controls to avoid re-creating them every render?
// Actually, renderBusinessBoard is called once on start.
// But updateBusinessUI is called often.
// Let's make renderBusinessBoard create the structure.

function renderBusinessBoard() {
    businessBoardElement.innerHTML = '';

    // Center Container
    const centerDiv = document.createElement('div');
    centerDiv.className = 'center-controls';
    centerDiv.style.gridColumn = "2 / span 9";
    centerDiv.style.gridRow = "2 / span 9";

    // Title
    centerDiv.innerHTML = `
        <div class="center-title">BUSINESS</div>
        <div class="center-subtitle">Indian Edition</div>
        
        <div class="dice-area">
            <div id="centerDiceDisplay" class="dice-display">Dice: -</div>
            <button id="centerDiceBtn" class="btn-roll">ROLL DICE</button>
        </div>
        
        <div class="center-players">
            <ul id="centerPlayersList"></ul>
        </div>
    `;

    businessBoardElement.appendChild(centerDiv);

    // Attach Listeners to new elements
    const diceBtn = document.getElementById('centerDiceBtn');
    if (diceBtn) {
        diceBtn.onclick = handleDiceRoll;
    }

    // Render Cells
    BUSINESS_BOARD.forEach((cell, index) => {
        const cellDiv = document.createElement('div');
        cellDiv.className = `business-cell ${cell.type} ${cell.color}`;
        cellDiv.id = `cell-${cell.id}`; // Add ID for easy access
        cellDiv.dataset.id = cell.id;

        // Grid Positioning Logic
        let row, col;
        if (index === 0) { row = 11; col = 11; }
        else if (index < 10) { row = 11; col = 11 - index; }
        else if (index === 10) { row = 11; col = 1; }
        else if (index < 20) { row = 11 - (index - 10); col = 1; }
        else if (index === 20) { row = 1; col = 1; }
        else if (index < 30) { row = 1; col = 1 + (index - 20); }
        else if (index === 30) { row = 1; col = 11; }
        else { row = 1 + (index - 30); col = 11; }

        cellDiv.style.gridRow = row;
        cellDiv.style.gridColumn = col;

        // Inner Content - No Color Bar, Full Background
        const name = document.createElement('div');
        name.className = 'cell-name';
        name.innerText = cell.name;
        cellDiv.appendChild(name);

        if (cell.price) {
            const price = document.createElement('div');
            price.className = 'cell-price';
            price.innerText = `₹${cell.price}`;
            cellDiv.appendChild(price);
        }

        const playersContainer = document.createElement('div');
        playersContainer.className = 'cell-players';
        playersContainer.id = `cell-players-${cell.id}`;
        cellDiv.appendChild(playersContainer);

        businessBoardElement.appendChild(cellDiv);
    });
}

let isAnimating = false;

function handleDiceRoll() {
    if (!businessGameActive || isAnimating) return;

    if (businessIsOnline) {
        // ... Online logic (keep as is for now, or update to match local)
        if (businessPlayers[businessTurnIndex].id !== businessMyId) {
            alert("Not your turn!");
            return;
        }
        socket.emit('business-roll-dice', { roomId: businessRoomId });
    } else {
        // Local Play
        const dice = Math.floor(Math.random() * 6) + 1; // 1-6
        const display = document.getElementById('centerDiceDisplay');
        if (display) display.innerText = `Dice: ${dice}`;

        moveTokenAnimated(businessTurnIndex, dice);
    }
}

function moveTokenAnimated(playerIdx, steps) {
    isAnimating = true;
    let stepsLeft = steps;
    const player = businessPlayers[playerIdx];

    const interval = setInterval(() => {
        if (stepsLeft > 0) {
            player.position = (player.position + 1) % 40;
            stepsLeft--;
            updateBusinessUI(); // Re-render tokens
        } else {
            clearInterval(interval);
            isAnimating = false;
            handleTurnEnd(playerIdx);
        }
    }, 300); // 300ms per step
}

function handleTurnEnd(playerIdx) {
    const player = businessPlayers[playerIdx];
    const cell = BUSINESS_BOARD[player.position];

    // Check Cell Type
    if (cell.type === 'property' || cell.type === 'railroad' || cell.type === 'utility') {
        handlePropertyLand(player, cell, playerIdx);
    } else if (cell.type === 'tax') {
        player.money -= cell.price;
        alert(`Paid Tax: ₹${cell.price}`);
        nextTurn();
    } else if (cell.type === 'corner') {
        // GO, Jail, etc.
        if (cell.id === 30) { // Go To Jail
            player.position = 10; // Jail
            alert("Go to Jail!");
            updateBusinessUI();
        }
        nextTurn();
    } else {
        nextTurn();
    }
}

function handlePropertyLand(player, cell, playerIdx) {
    const prop = businessProperties[cell.id];

    if (!prop) {
        // Unowned - Buy?
        if (player.money >= cell.price) {
            // Show Modal
            showBuyModal(cell, player, playerIdx);
        } else {
            // Not enough money
        }
        // Note: nextTurn() is called after modal choice or if not enough money
        if (player.money < cell.price) nextTurn();
    } else {
        // Owned
        if (prop.owner !== playerIdx) {
            // Pay Rent
            const owner = businessPlayers[prop.owner];
            let rent = cell.rent || 0;

            if (player.money >= rent) {
                player.money -= rent;
                owner.money += rent;
                alert(`Paid Rent ₹${rent} to P${prop.owner + 1}`);
            } else {
                owner.money += player.money;
                player.money = 0;
                alert(`Paid Rent ₹${player.money} (Bankrupt!)`);
            }
        }
        nextTurn();
    }
}

function showBuyModal(cell, player, playerIdx) {
    const modal = document.getElementById('businessBuyModal');
    const title = document.getElementById('buyModalTitle');
    const text = document.getElementById('buyModalText');
    const yesBtn = document.getElementById('buyModalYesBtn');
    const noBtn = document.getElementById('buyModalNoBtn');

    if (!modal) {
        // Fallback if modal missing
        if (confirm(`Buy ${cell.name} for ₹${cell.price}?`)) {
            buyProperty(cell, player, playerIdx);
        }
        nextTurn();
        return;
    }

    title.innerText = `Buy ${cell.name}?`;
    text.innerText = `Price: ₹${cell.price} | Your Money: ₹${player.money}`;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    // One-time listeners (cleared by cloning or simple replacement)
    const newYes = yesBtn.cloneNode(true);
    const newNo = noBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYes, yesBtn);
    noBtn.parentNode.replaceChild(newNo, noBtn);

    newYes.onclick = () => {
        buyProperty(cell, player, playerIdx);
        closeBuyModal();
        nextTurn();
    };

    newNo.onclick = () => {
        closeBuyModal();
        nextTurn();
    };
}

function closeBuyModal() {
    const modal = document.getElementById('businessBuyModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

function buyProperty(cell, player, playerIdx) {
    player.money -= cell.price;
    businessProperties[cell.id] = { owner: playerIdx };
    player.properties.push(cell.id);
    // Alert is okay for confirmation, or just update UI
    // alert(`Bought ${cell.name}!`); 
    updateBusinessUI();
}

function nextTurn() {
    businessTurnIndex = (businessTurnIndex + 1) % businessPlayers.length;
    updateBusinessUI();
}

function updateBusinessUI() {
    // Update Status
    const currentName = businessPlayers[businessTurnIndex].id === businessMyId ? "You" : `Player ${businessTurnIndex + 1}`;
    if (businessStatus) businessStatus.innerText = `Turn: ${currentName}`;

    // Update Player Positions
    document.querySelectorAll('.cell-players').forEach(el => el.innerHTML = '');
    businessPlayers.forEach((p, idx) => {
        const container = document.getElementById(`cell-players-${p.position}`);
        if (container) {
            const token = document.createElement('div');
            token.className = `player-token p${idx + 1}`;
            token.innerText = `P${idx + 1}`;
            container.appendChild(token);
        }
    });

    // Update Property Ownership Visuals
    document.querySelectorAll('.business-cell').forEach(el => {
        el.classList.remove('owned-p1', 'owned-p2', 'owned-p3', 'owned-p4');
        const id = el.dataset.id;
        if (businessProperties[id]) {
            el.classList.add(`owned-p${businessProperties[id].owner + 1}`);
        }
    });

    // Update Center Player List
    const list = document.getElementById('centerPlayersList');
    if (list) {
        list.innerHTML = '';
        businessPlayers.forEach((p, idx) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>P${idx + 1}</span> <span>₹${p.money}</span>`;
            if (idx === businessTurnIndex) li.classList.add('active-turn');

            // Add Sell Button if current player (simplified)
            // For now just show money

            list.appendChild(li);
        });
    }
}

// Global exposure
window.initBusiness = initBusiness;
