// Map setup
const map = L.map('map').setView([59.4841, 19.4568], 9);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Islands
const islands = [
  { name: "Vaxholm", coords: [59.4007, 18.2876] },
  { name: "Grinda", coords: [59.3671, 18.7112] },
  { name: "Sandhamn", coords: [59.3204, 19.3428] },
  { name: "Utö", coords: [58.9538, 18.5622] },
  { name: "Fjäderholmarna", coords: [59.3225, 18.1502] }
];

// Treasure islands
let treasures = [islands[1], islands[2], islands[3]]; // Grinda, Sandhamn, Utö
const treasureMarkers = [];

// Players
let thief = { name: "Thief", island: islands[0], treasures: 0, marker: null };
let police = [
  { name: "Police1", island: islands[2], marker: null },
  { name: "Police2", island: islands[4], marker: null }
];

// UI elements
const message = document.getElementById('message');
const turnInfo = document.getElementById('turnInfo');
const treasureCount = document.getElementById('treasureCount');
let turn = 'thief';

// Dice roll
function rollDice(){ return Math.floor(Math.random()*3)+1; }

// Add island markers
islands.forEach(i=>{
  L.marker(i.coords).addTo(map)
    .bindPopup(`<strong>${i.name}</strong>`);
});

// Add treasure markers
treasures.forEach((t,i)=>{
  const marker = L.marker(t.coords, { 
    icon: L.icon({ 
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Gold_coin_icon.png', 
      iconSize: [24,24] 
    }) 
  }).addTo(map).bindPopup("Treasure");
  treasureMarkers.push(marker);
});

// Add Thief marker (initially visible)
thief.marker = L.circleMarker(thief.island.coords, { color: 'red', radius: 10 }).addTo(map);

// Add Police markers
police.forEach(p=>{
  p.marker = L.circleMarker(p.island.coords, { color: 'blue', radius: 10 }).addTo(map);
});

// Update visibility of Thief for stealth mode
function updateStealth(){
  let visible = false;
  police.forEach(p=>{
    const dist = map.distance(L.latLng(p.island.coords), L.latLng(thief.island.coords));
    if(dist<30000) visible = true; // police within ~30km
  });
  thief.marker.setStyle({ opacity: visible?1:0 }); // hide if far
}

// Move player
function movePlayer(player, targetIsland){
  player.island = targetIsland;
  player.marker.setLatLng(targetIsland.coords);
  if(player.name==='Thief') checkTreasure();
  checkCatch();
  updateStealth();
  nextTurn();
}

// Check treasure
function checkTreasure(){
  treasures.forEach((t,i)=>{
    if(t===thief.island){
      thief.treasures += 1;
      message.innerHTML = `Thief picked up treasure on ${t.name}! Total: ${thief.treasures}`;
      map.removeLayer(treasureMarkers[i]);
      treasures.splice(i,1);
      treasureMarkers.splice(i,1);
      treasureCount.innerHTML = `Treasures collected: ${thief.treasures}`;
    }
  });
  if(thief.treasures === 3){
    message.innerHTML = "Thief wins! Escaped with all treasures!";
    stopGame();
  }
}

// Check police catch
function checkCatch(){
  police.forEach(p=>{
    if(p.island===thief.island){
      message.innerHTML = `Police caught the Thief on ${p.island.name}! Police wins!`;
      stopGame();
    }
  });
}

// Next turn
function nextTurn(){
  turn = (turn==='thief')?'police':'thief';
  turnInfo.innerHTML = turn.charAt(0).toUpperCase()+turn.slice(1)+"'s turn";
}

// Game stop
function stopGame(){
  clearInterval(policeInterval);
  map.off('click');
}

// Thief movement by clicking nearest island within dice range
map.on('click', e=>{
  if(turn!=='thief') return;
  const dice = rollDice();
  let nearest = islands[0];
  let minDist = map.distance(e.latlng, L.latLng(nearest.coords));
  islands.forEach(i=>{
    const d = map.distance(e.latlng, L.latLng(i.coords));
    if(d<minDist) nearest=i;
  });
  const distToIsland = map.distance(L.latLng(thief.island.coords), L.latLng(nearest.coords));
  if(distToIsland <= dice*30000){
    movePlayer(thief, nearest);
    message.innerHTML = `Thief rolled a ${dice} and moved to ${nearest.name}`;
  } else {
    message.innerHTML = `Thief rolled a ${dice}, but ${nearest.name} is too far.`;
  }
});

// Police auto-move toward Thief
function movePolice(){
  police.forEach(p=>{
    let nearest = islands[0];
    let minDist = map.distance(L.latLng(p.island.coords), L.latLng(thief.island.coords));
    islands.forEach(i=>{
      const d = map.distance(L.latLng(i.coords), L.latLng(thief.island.coords));
      if(d<minDist){ nearest=i; minDist=d; }
    });
    movePlayer(p, nearest);
  });
}

// Police turn every 3s
const policeInterval = setInterval(()=>{
  if(turn==='police') movePolice();
},3000);
