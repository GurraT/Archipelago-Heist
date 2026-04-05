// ================= MAP SETUP =================
const map = L.map('map').setView([59.4841, 19.4568], 9);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Disable map movement
map.dragging.disable();
map.scrollWheelZoom.disable();
map.doubleClickZoom.disable();
map.boxZoom.disable();
map.keyboard.disable();

// ================= UI =================
const message = document.getElementById('message');
const turnInfo = document.getElementById('turnInfo');
const treasureCount = document.getElementById('treasureCount');

const eventCardDiv = document.getElementById('eventCard');
const cardName = document.getElementById('cardName');
const cardType = document.getElementById('cardType');
const cardEffect = document.getElementById('cardEffect');
const cardIcon = document.getElementById('cardIcon');


//===================DICE EVENT=======================

rollBtn.addEventListener('click', () => {
  if(turn !== 'thief') return;

  diceRolled = false;

  let rolls = 10;
  let interval = setInterval(() => {
    diceResultDiv.innerText = Math.floor(Math.random()*6)+1;
    rolls--;

    if(rolls <= 0){
      clearInterval(interval);

      currentDice = Math.floor(Math.random()*3)+1; // keep your 1–3 system
      diceResultDiv.innerText = currentDice;

      diceRolled = true;

      // Highlight moves AFTER roll
      let moves = currentDice;

      if(thief.doubleMove){
        moves *= 2;
      }

      highlightMoves(getReachableIslands(thief.island, moves));
    }
  }, 80);
});

// ================= ISLANDS =================
const islands = [
  { id: 0, name: "Island 1", coords: [59.50, 18.00], connections: [1,10] },
  { id: 1, name: "Island 2", coords: [59.50, 18.10], connections: [0,2,11] },
  { id: 2, name: "Island 3", coords: [59.50, 18.20], connections: [1,3,12] },
  { id: 3, name: "Island 4", coords: [59.50, 18.30], connections: [2,4,13] },
  { id: 4, name: "Island 5", coords: [59.50, 18.40], connections: [3,5,14] },
  { id: 5, name: "Island 6", coords: [59.50, 18.50], connections: [4,6,15] },
  { id: 6, name: "Island 7", coords: [59.50, 18.60], connections: [5,7,16] },
  { id: 7, name: "Island 8", coords: [59.50, 18.70], connections: [6,8,17] },
  { id: 8, name: "Island 9", coords: [59.50, 18.80], connections: [7,9,18] },
  { id: 9, name: "Island 10", coords: [59.50, 18.90], connections: [8,19] },

  { id: 10, name: "Island 11", coords: [59.45, 18.00], connections: [0,11,20] },
  { id: 11, name: "Island 12", coords: [59.45, 18.10], connections: [1,10,12,21] },
  { id: 12, name: "Island 13", coords: [59.45, 18.20], connections: [2,11,13,22] },
  { id: 13, name: "Island 14", coords: [59.45, 18.30], connections: [3,12,14,23] },
  { id: 14, name: "Island 15", coords: [59.45, 18.40], connections: [4,13,15,24] },
  { id: 15, name: "Island 16", coords: [59.45, 18.50], connections: [5,14,16,25] },
  { id: 16, name: "Island 17", coords: [59.45, 18.60], connections: [6,15,17,26] },
  { id: 17, name: "Island 18", coords: [59.45, 18.70], connections: [7,16,18,27] },
  { id: 18, name: "Island 19", coords: [59.45, 18.80], connections: [8,17,19,28] },
  { id: 19, name: "Island 20", coords: [59.45, 18.90], connections: [9,18,29] },

  { id: 20, name: "Island 21", coords: [59.40, 18.00], connections: [10,21,30] },
  { id: 21, name: "Island 22", coords: [59.40, 18.10], connections: [11,20,22,31] },
  { id: 22, name: "Island 23", coords: [59.40, 18.20], connections: [12,21,23,32] },
  { id: 23, name: "Island 24", coords: [59.40, 18.30], connections: [13,22,24,33] },
  { id: 24, name: "Island 25", coords: [59.40, 18.40], connections: [14,23,25,34] },
  { id: 25, name: "Island 26", coords: [59.40, 18.50], connections: [15,24,26,35] },
  { id: 26, name: "Island 27", coords: [59.40, 18.60], connections: [16,25,27,36] },
  { id: 27, name: "Island 28", coords: [59.40, 18.70], connections: [17,26,28,37] },
  { id: 28, name: "Island 29", coords: [59.40, 18.80], connections: [18,27,29,38] },
  { id: 29, name: "Island 30", coords: [59.40, 18.90], connections: [19,28,39] },

  { id: 30, name: "Island 31", coords: [59.35, 18.00], connections: [20,31,40] },
  { id: 31, name: "Island 32", coords: [59.35, 18.10], connections: [21,30,32,41] },
  { id: 32, name: "Island 33", coords: [59.35, 18.20], connections: [22,31,33,42] },
  { id: 33, name: "Island 34", coords: [59.35, 18.30], connections: [23,32,34,43] },
  { id: 34, name: "Island 35", coords: [59.35, 18.40], connections: [24,33,35,44] },
  { id: 35, name: "Island 36", coords: [59.35, 18.50], connections: [25,34,36,45] },
  { id: 36, name: "Island 37", coords: [59.35, 18.60], connections: [26,35,37,46] },
  { id: 37, name: "Island 38", coords: [59.35, 18.70], connections: [27,36,38,47] },
  { id: 38, name: "Island 39", coords: [59.35, 18.80], connections: [28,37,39,48] },
  { id: 39, name: "Island 40", coords: [59.35, 18.90], connections: [29,38,49] },

  { id: 40, name: "Island 41", coords: [59.30, 18.00], connections: [30,41] },
  { id: 41, name: "Island 42", coords: [59.30, 18.10], connections: [31,40,42] },
  { id: 42, name: "Island 43", coords: [59.30, 18.20], connections: [32,41,43] },
  { id: 43, name: "Island 44", coords: [59.30, 18.30], connections: [33,42,44] },
  { id: 44, name: "Island 45", coords: [59.30, 18.40], connections: [34,43,45] },
  { id: 45, name: "Island 46", coords: [59.30, 18.50], connections: [35,44,46] },
  { id: 46, name: "Island 47", coords: [59.30, 18.60], connections: [36,45,47] },
  { id: 47, name: "Island 48", coords: [59.30, 18.70], connections: [37,46,48] },
  { id: 48, name: "Island 49", coords: [59.30, 18.80], connections: [38,47,49] },
  { id: 49, name: "Island 50", coords: [59.30, 18.90], connections: [39,48] }
];

// ================= PLAYERS =================
let turn = 'thief';

let thief = {
  name: "Thief",
  island: islands[22],
  treasures: 0,
  marker: null,
  skipTurn: false,
  doubleMove: false
};

let police = [
  { name: "Police1", island: islands[0], marker: null },
  { name: "Police2", island: islands[49], marker: null }
];

// ================= TREASURES =================
let treasures = [islands[5], islands[24], islands[44]];
const treasureMarkers = [];

// ================= DRAW CONNECTIONS =================
islands.forEach(island => {
  island.connections.forEach(connId => {
    const target = islands.find(i => i.id === connId);

    L.polyline([island.coords, target.coords], {
      color: '#888',
      weight: 3,
      opacity: 0.7
    }).addTo(map);
  });
});

// ================= DRAW ISLANDS =================
islands.forEach(island => {
  const marker = L.circleMarker(island.coords, {
    radius: 8,
    color: '#333',
    fillColor: '#fff',
    fillOpacity: 1
  }).addTo(map);

  island.marker = marker;

  marker.bindPopup(island.name);

  marker.on('click', () => handleIslandClick(island));
});

// ================= TREASURE MARKERS =================
treasures.forEach((t, i) => {
  const marker = L.marker(t.coords, {
    icon: L.icon({
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Gold_coin_icon.png',
      iconSize: [24, 24]
    })
  }).addTo(map);

  treasureMarkers.push(marker);
});

// ================= PLAYER MARKERS =================
thief.marker = L.circleMarker(thief.island.coords, {
  color: 'red',
  fillColor: 'red',
  radius: 10
}).addTo(map);

police.forEach(p => {
  p.marker = L.circleMarker(p.island.coords, {
    color: 'blue',
    fillColor: 'blue',
    radius: 10
  }).addTo(map);
});

// ================= DICE =================
function rollDice() {
  return Math.floor(Math.random() * 3) + 1;
}

// ================= EVENTS =================
let policeSkipNext = false;

const events = [
  { name: "Storm", effect: () => { thief.skipTurn = true; message.innerHTML = "Storm! Skip turn."; }},
  { name: "Boost", effect: () => { thief.doubleMove = true; }},
  { name: "Fog", effect: () => { policeSkipNext = true; }}
];

function maybeDrawEvent(){
  if(Math.random() < 0.5){
    const event = events[Math.floor(Math.random()*events.length)];
    showEventCard(event);
    event.effect();
  }
}

function showEventCard(event){
  cardName.innerText = event.name;
  cardType.innerText = "Event";
  cardEffect.innerText = event.name;

  eventCardDiv.style.display = 'block';
  setTimeout(()=> eventCardDiv.style.display='none', 2000);
}

// ================= MOVEMENT =================
function getReachableIslands(start, steps){
  let visited = new Set();
  let frontier = [start];

  for(let i=0;i<steps;i++){
    let next = [];
    frontier.forEach(i=>{
      i.connections.forEach(id=>{
        const target = islands.find(x=>x.id===id);
        if(!visited.has(target)){
          visited.add(target);
          next.push(target);
        }
      });
    });
    frontier = next;
  }
  return Array.from(visited);
}

function highlightMoves(valid){
  islands.forEach(i=>{
    i.marker.setStyle({ fillColor:'#fff', radius:8 });
  });

  valid.forEach(i=>{
    i.marker.setStyle({ fillColor:'#4CAF50', radius:12 });
  });
}

function movePlayer(player, island){
  player.island = island;
  player.marker.setLatLng(island.coords);

  if(player.name === "Thief") checkTreasure();

  checkCatch();
  nextTurn();
}

// ================= GAME LOGIC =================
function checkTreasure(){
  treasures.forEach((t,i)=>{
    if(t === thief.island){
      thief.treasures++;
      map.removeLayer(treasureMarkers[i]);
      treasures.splice(i,1);
      treasureMarkers.splice(i,1);
      treasureCount.innerHTML = `Treasures: ${thief.treasures}`;
    }
  });

  if(thief.treasures >= 3){
    message.innerHTML = "Thief wins!";
    stopGame();
  }
}

function checkCatch(){
  police.forEach(p=>{
    if(p.island === thief.island){
      message.innerHTML = "Police wins!";
      stopGame();
    }
  });
}

function nextTurn(){
  turn = (turn === 'thief') ? 'police' : 'thief';
  turnInfo.innerHTML = `${turn}'s turn`;

  diceRolled = false;
  diceResultDiv.innerText = "-";
}

function stopGame(){
  clearInterval(policeInterval);
}

// ================= CLICK =================
function handleIslandClick(island){
  if(turn !== 'thief') return;

  if(!diceRolled){
    message.innerHTML = "Roll the dice first!";
    return;
  }

  if(thief.skipTurn){
    thief.skipTurn = false;
    diceRolled = false;
    nextTurn();
    return;
  }

  maybeDrawEvent();

  let moves = currentDice;

  if(thief.doubleMove){
    moves *= 2;
    thief.doubleMove = false;
  }

  const valid = getReachableIslands(thief.island, moves);

  if(!valid.includes(island)){
    message.innerHTML = "Invalid move";
    return;
  }

  movePlayer(thief, island);

  message.innerHTML = `Moved ${moves} steps`;
  diceRolled = false;
}

// ================= POLICE AI =================
function movePolice(){
  police.forEach(p=>{
    let target = thief.island;
    movePlayer(p, target);
  });
}

const policeInterval = setInterval(()=>{
  if(turn === 'police'){
    if(!policeSkipNext){
      movePolice();
    } else {
      policeSkipNext = false;
      nextTurn();
    }
  }
}, 3000);
