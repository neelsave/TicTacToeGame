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
    initBusinessSocket();
}

function showBusinessSetup() {
    if (businessSetupScreen) businessSetupScreen.classList.remove('hidden');
    if (businessGameContainer) businessGameContainer.classList.add('hidden');
}

function initBusinessSocket() {
    if (typeof io === 'undefined' || !socket) {
        if (typeof io !== 'undefined') socket = io('https://tictactoegame-zyid.onrender.com');
        else return;
    }

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
        if (data.lastDice) businessDiceDisplay.innerText = `Dice: ${data.lastDice}`;
        updateBusinessUI();
    });

    socket.on('business-error', (msg) => {
        alert(msg);
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

if (businessDiceBtn) {
    businessDiceBtn.addEventListener('click', () => {
        if (!businessGameActive) return;
        // Check if my turn
        if (businessPlayers[businessTurnIndex].id !== businessMyId) {
            alert("Not your turn!");
            return;
        }
        socket.emit('business-roll-dice', { roomId: businessRoomId });
    });
}

function renderBusinessBoard() {
    businessBoardElement.innerHTML = '';
    // Simple Grid Render (40 cells)
    // We need a proper layout: Bottom (10), Left (10), Top (10), Right (10)
    // For simplicity in this version, we might just render a list or a simple flex wrap
    // But user asked for "Board Game". Let's try a CSS Grid approach in style.css

    BUSINESS_BOARD.forEach(cell => {
        const cellDiv = document.createElement('div');
        cellDiv.className = `business-cell ${cell.type} ${cell.color}`;
        cellDiv.dataset.id = cell.id;

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

        // Placeholder for players
        const playersContainer = document.createElement('div');
        playersContainer.className = 'cell-players';
        playersContainer.id = `cell-players-${cell.id}`;
        cellDiv.appendChild(playersContainer);

        businessBoardElement.appendChild(cellDiv);
    });
}

function updateBusinessUI() {
    // Update Turn
    const currentName = businessPlayers[businessTurnIndex].id === businessMyId ? "You" : `Player ${businessTurnIndex + 1}`;
    businessStatus.innerText = `Turn: ${currentName}`;

    // Update Player Positions
    // Clear all previous positions
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

    // Update Player List (Money, etc.)
    businessPlayersList.innerHTML = '';
    businessPlayers.forEach((p, idx) => {
        const li = document.createElement('li');
        li.innerText = `P${idx + 1}: ₹${p.money} - ${p.id === businessMyId ? '(You)' : ''}`;
        if (idx === businessTurnIndex) li.style.fontWeight = 'bold';
        businessPlayersList.appendChild(li);
    });
}

// Global exposure
window.initBusiness = initBusiness;
