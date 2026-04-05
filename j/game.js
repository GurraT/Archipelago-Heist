// ================= MAP SETUP =================
const map = L.map('map').setView([59.4841, 19.4568], 9);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Lock map (board game feel)
map.dragging.disable();
map.scrollWheelZoom.disable();
map.doubleClickZoom.disable();
map.boxZoom.disable();
map.keyboard.disable();

// ================= UI =================
const message = document.getElementById('message');
const turnInfo = document.getElementById('turnInfo');
const treasureCount = document.getElementById('treasureCount');

const rollBtn = document.getElementById('rollDice');
const diceResultDiv = document.getElementById('diceResult');

const eventCardDiv = document.getElementById('eventCard');
const cardName = document.getElementById('cardName');
const cardType = document.getElementById('cardType');
const cardEffect = document.getElementById('cardEffect');

// ================= DICE STATE =================
let diceRolled = false;
let currentDice = 0;

// ================= ISLANDS (50 GRID) =================
const islands = [];
let id = 0;

for(let row=0; row<5; row++){
  for(let col=0; col<10; col++){
    islands.push({
      id: id,
      name: `Island ${id+1}`,
      coords: [59.50 - row*0.05, 18.00 + col*0.10],
      connections: []
    });
    id++;
  }
}

// Auto-connect grid
islands.forEach(i=>{
  let r = Math.floor(i.id / 10);
  let c = i.id % 10;

  if(c > 0) i.connections.push(i.id - 1);
  if(c < 9) i.connections.push(i.id + 1);
  if(r > 0) i.connections.push(i.id - 10);
  if(r < 4) i.connections.push(i.id + 10);
});

// ================= PLAYERS =================
let turn = 'thief';

let thief = {
  island: islands[22],
  treasures: 0,
  marker: null,
  skipTurn: false,
  doubleMove: false
};

let police = [
  { island: islands[0], marker: null },
  { island: islands[49], marker: null }
];

// ================= TREASURES =================
let treasures = [islands[5], islands[24], islands[44]];
const treasureMarkers = [];

// ================= DRAW CONNECTIONS =================
islands.forEach(i=>{
  i.connections.forEach(cid=>{
    const target = islands[cid];
    L.polyline([i.coords, target.coords], {
      color:'#888', weight:2
    }).addTo(map);
  });
});

// ================= DRAW ISLANDS =================
islands.forEach(i=>{
  const marker = L.circleMarker(i.coords, {
    radius:8,
    color:'#333',
    fillColor:'#fff',
    fillOpacity:1
  }).addTo(map);

  i.marker = marker;

  marker.on('click', ()=>handleIslandClick(i));
});

// ================= TREASURE MARKERS =================
treasures.forEach(t=>{
  const m = L.marker(t.coords, {
    icon: L.icon({
      iconUrl:'https://upload.wikimedia.org/wikipedia/commons/9/9b/Gold_coin_icon.png',
      iconSize:[24,24]
    })
  }).addTo(map);

  treasureMarkers.push(m);
});

// ================= PLAYER MARKERS =================
thief.marker = L.circleMarker(thief.island.coords,{
  color:'red', fillColor:'red', radius:10
}).addTo(map);

police.forEach(p=>{
  p.marker = L.circleMarker(p.island.coords,{
    color:'blue', fillColor:'blue', radius:10
  }).addTo(map);
});

const thiefIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854894.png",
  iconSize: [32,32]
});

const policeIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
  iconSize: [32,32]
});

// ================= DICE BUTTON =================
rollBtn.addEventListener('click', () => {
  if(turn !== 'thief') return;

  diceRolled = false;

  let rolls = 10;
  let interval = setInterval(() => {
    diceResultDiv.innerText = Math.floor(Math.random()*6)+1;
    rolls--;

    if(rolls <= 0){
      clearInterval(interval);

      currentDice = Math.floor(Math.random()*3)+1;
      diceResultDiv.innerText = currentDice;

      diceRolled = true;

      let moves = currentDice;
      if(thief.doubleMove) moves *= 2;

      highlightMoves(getReachableIslands(thief.island, moves));
    }
  }, 80);
});

// ================= EVENTS =================
let policeSkipNext = false;

const events = [
  { name:"Storm", effect:()=>{ thief.skipTurn=true; }},
  { name:"Boost", effect:()=>{ thief.doubleMove=true; }},
  { name:"Fog", effect:()=>{ policeSkipNext=true; }}
];

function maybeDrawEvent(){
  if(Math.random() < 0.5){
    const e = events[Math.floor(Math.random()*events.length)];
    showEventCard(e);
    e.effect();
  }
}

function showEventCard(e){
  cardName.innerText = e.name;
  cardType.innerText = "Event";
  cardEffect.innerText = e.name;

  eventCardDiv.style.display='block';
  setTimeout(()=>eventCardDiv.style.display='none',2000);
}

// ================= MOVEMENT =================
function getReachableIslands(start, steps){
  let visited = new Set();
  let frontier = [start];

  for(let i=0;i<steps;i++){
    let next=[];
    frontier.forEach(n=>{
      n.connections.forEach(id=>{
        const t = islands[id];
        if(!visited.has(t)){
          visited.add(t);
          next.push(t);
        }
      });
    });
    frontier = next;
  }
  return [...visited];
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

  if(player === thief) checkTreasure();

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
      treasureCount.innerText = thief.treasures;
    }
  });

  if(thief.treasures >= 3){
    message.innerText = "Thief wins!";
    stopGame();
  }
}

function checkCatch(){
  police.forEach(p=>{
    if(p.island === thief.island){
      message.innerText = "Police wins!";
      stopGame();
    }
  });
}

function nextTurn(){
  turn = (turn === 'thief') ? 'police' : 'thief';
  turnInfo.innerText = turn;

  diceRolled = false;
  diceResultDiv.innerText = "-";

  highlightMoves([]);
}

function stopGame(){
  clearInterval(policeInterval);
}

// ================= CLICK =================
function handleIslandClick(island){
  if(turn !== 'thief') return;

  if(!diceRolled){
    message.innerText = "Roll dice first!";
    return;
  }

  if(thief.skipTurn){
    thief.skipTurn=false;
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
    message.innerText = "Invalid move";
    return;
  }

  movePlayer(thief, island);

  message.innerText = `Moved ${moves} steps`;
  diceRolled = false;
}

// ================= POLICE AI =================
function movePolice(){
  police.forEach(p=>{
    const options = p.island.connections.map(id=>islands[id]);
    const target = options[Math.floor(Math.random()*options.length)];
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
}, 2500);
