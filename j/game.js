// ================= MAP SETUP =================
const map = L.map('map').setView([59.4841, 19.4568], 9);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Disable map movement (board game style)
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

// ================= ISLANDS =================
const islands = [
  { id: 0, name: "Vaxholm", coords: [59.4007, 18.2876], connections: [1,2] },
  { id: 1, name: "Grinda", coords: [59.3671, 18.7112], connections: [0,3,4] },
  { id: 2, name: "Fjäderholmarna", coords: [59.3225, 18.1502], connections: [0,5] },
  { id: 3, name: "Sandhamn", coords: [59.3204, 19.3428], connections: [1,6,7] },
  { id: 4, name: "Gällnö", coords: [59.403, 18.682], connections: [1,8] },
  { id: 5, name: "Lidingö", coords: [59.366, 18.15], connections: [2,9] },
  { id: 6, name: "Runmarö", coords: [59.283, 18.75], connections: [3] },
  { id: 7, name: "Stavsnäs", coords: [59.283, 18.683], connections: [3] },
  { id: 8, name: "Möja", coords: [59.416, 18.85], connections: [4] },
  { id: 9, name: "Nacka", coords: [59.31, 18.2], connections: [5] }
];

// Draw connections (board paths)
islands.forEach(island => {
  island.connections.forEach(connId => {
    const target = islands.find(i => i.id === connId);
    L.polyline([island.coords, target.coords], {
      color: 'gray',
      weight: 2,
      dashArray: '5,5'
    }).addTo(map);
  });
});

// ================= PLAYERS =================
let turn = 'thief';

let thief = {
  name: "Thief",
  island: islands[0],
  treasures: 0,
  marker: null,
  skipTurn: false,
  doubleMove: false,
  reduceMove: 0,
  skipReveal: false
};

let police = [
  { name: "Police1", island: islands[2], marker: null },
  { name: "Police2", island: islands[4], marker: null }
];

// ================= TREASURES =================
let treasures = [islands[1], islands[2], islands[3]];
const treasureMarkers = [];

treasures.forEach((t, i) => {
  const marker = L.marker(t.coords, {
    icon: L.icon({
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Gold_coin_icon.png',
      iconSize: [24, 24]
    })
  }).addTo(map).bindPopup("Treasure");
  treasureMarkers.push(marker);
});

// ================= MARKERS =================
thief.marker = L.circleMarker(thief.island.coords, { color: 'red', radius: 10 }).addTo(map);

police.forEach(p => {
  p.marker = L.circleMarker(p.island.coords, { color: 'blue', radius: 10 }).addTo(map);
});

// ================= DICE =================
function rollDice() {
  return Math.floor(Math.random() * 3) + 1;
}

// ================= EVENTS =================
const cardIcons = {
  "Thief": "https://upload.wikimedia.org/wikipedia/commons/1/1b/Red_circle.png",
  "Police": "https://upload.wikimedia.org/wikipedia/commons/2/29/Blue_circle.png",
  "Both": "https://upload.wikimedia.org/wikipedia/commons/6/60/Yellow_circle.png"
};

const events = [
  { name: "Storm", type:"Police", effect:()=>{ thief.skipTurn=true; message.innerHTML="Storm! Thief skips turn."; }},
  { name: "Secret Passage", type:"Thief", effect:()=>{ thief.doubleMove=true; }},
  { name: "Police Alert", type:"Police", effect:()=>{ thief.marker.setStyle({opacity:1}); }},
  { name: "Foggy Night", type:"Thief", effect:()=>{ policeSkipNext=true; }},
  { name: "Reinforcements", type:"Police", effect:()=>{ policeExtraMove=1; }},
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
  cardType.innerText = `Type: ${event.type}`;
  cardEffect.innerText = event.name;

  eventCardDiv.className = `event-card ${event.type.toLowerCase()}`;
  cardIcon.src = cardIcons[event.type];

  eventCardDiv.style.display = 'block';
  setTimeout(()=>{ eventCardDiv.style.display='none'; },3000);
}

// ================= MOVEMENT =================
function getReachableIslands(start, steps){
  let visited = new Set();
  let frontier = [start];

  for(let i=0;i<steps;i++){
    let next = [];
    frontier.forEach(island=>{
      island.connections.forEach(id=>{
        const target = islands.find(i=>i.id===id);
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

function movePlayer(player,targetIsland){
  player.island = targetIsland;
  player.marker.setLatLng(targetIsland.coords);

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
      message.innerHTML = "Police caught the thief!";
      stopGame();
    }
  });
}

function nextTurn(){
  turn = (turn === 'thief') ? 'police' : 'thief';
  turnInfo.innerHTML = `${turn}'s turn`;
}

function stopGame(){
  clearInterval(policeInterval);
}

// ================= ISLAND CLICK =================
islands.forEach(island => {
  const marker = L.marker(island.coords).addTo(map).bindPopup(island.name);

  marker.on('click', () => {
    if(turn !== 'thief') return;

    if(thief.skipTurn){
      thief.skipTurn = false;
      nextTurn();
      return;
    }

    maybeDrawEvent();

    let dice = rollDice();
    if(thief.doubleMove){ dice *= 2; thief.doubleMove = false; }

    const validMoves = getReachableIslands(thief.island, dice);

    if(!validMoves.includes(island)){
      message.innerHTML = `Invalid move (${dice} steps max)`;
      return;
    }

    movePlayer(thief, island);
    message.innerHTML = `Moved to ${island.name} (dice: ${dice})`;
  });
});

// ================= POLICE AI =================
let policeSkipNext = false;
let policeExtraMove = 0;

function movePolice(){
  police.forEach(p=>{
    let nearest = islands[0];
    let minDist = map.distance(L.latLng(p.island.coords), L.latLng(thief.island.coords));

    islands.forEach(i=>{
      const d = map.distance(L.latLng(i.coords), L.latLng(thief.island.coords));
      if(d < minDist){
        nearest = i;
        minDist = d;
      }
    });

    movePlayer(p, nearest);

    if(policeExtraMove > 0){
      movePlayer(p, nearest);
      policeExtraMove--;
    }
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
