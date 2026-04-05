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
let thief = { name: "Thief", island: islands[0], treasures: 0, marker: null, skipTurn:false, doubleMove:false };
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

// Add Thief marker
thief.marker = L.circleMarker(thief.island.coords, { color: 'red', radius: 10 }).addTo(map);

// Add Police markers
police.forEach(p=>{
  p.marker = L.circleMarker(p.island.coords, { color: 'blue', radius: 10 }).addTo(map);
});

// Event deck
const events = [
  { name: "Storm", type:"Police", effect:()=>{ message.innerHTML="Storm! Thief loses next turn."; thief.skipTurn=true; } },
  { name: "Secret Passage", type:"Thief", effect:()=>{ message.innerHTML="Secret passage! Thief moves double dice roll."; thief.doubleMove=true; } },
  { name: "Treasure Bonus", type:"Thief", effect:()=>{ 
      if(treasures.length>0){
        const t = treasures[0]; 
        treasures.splice(0,1); 
        map.removeLayer(treasureMarkers[0]); 
        treasureMarkers.splice(0,1);
        thief.treasures += 1;
        treasureCount.innerHTML = `Treasures collected: ${thief.treasures}`;
        message.innerHTML = "Treasure Bonus! Thief collected an extra treasure!";
      }
    } 
  },
  { name: "Police Alert", type:"Police", effect:()=>{ 
      message.innerHTML="Police Alert! Thief revealed for 5 seconds.";
      thief.marker.setStyle({opacity:1});
      setTimeout(()=>updateStealth(),5000);
    } 
  },
  { name: "Favorable Winds", type:"Thief", effect:()=>{ message.innerHTML="Favorable winds! Thief moves +1 extra island."; thief.doubleMove=true; } },
  { name: "Foggy Night", type:"Thief", effect:()=>{ message.innerHTML="Foggy night! Police skip next move."; policeSkipNext=true; } },
  { name: "Island Patrol", type:"Police", effect:()=>{ message.innerHTML="Island Patrol! Police move toward nearest treasure."; policeMoveToTreasure(); } },
  { name: "Hidden Cove", type:"Thief", effect:()=>{ message.innerHTML="Hidden Cove! Thief can hide this turn."; thief.skipReveal=true; } },
  { name: "Radio Signal", type:"Police", effect:()=>{ message.innerHTML="Radio Signal! Thief location revealed."; thief.marker.setStyle({opacity:1}); setTimeout(()=>updateStealth(),5000); } },
  { name: "Rough Seas", type:"Police", effect:()=>{ message.innerHTML="Rough Seas! Thief loses 1 movement point this turn."; thief.reduceMove=1; } },
  { name: "Smuggler’s Shortcut", type:"Thief", effect:()=>{ message.innerHTML="Smuggler's Shortcut! Teleport to any island."; } }, // implement teleport in click
  { name: "Reinforcements", type:"Police", effect:()=>{ message.innerHTML="Police reinforcements! +1 move for all police this turn."; policeExtraMove=1; } },
  { name: "Treasure Map Leak", type:"Police", effect:()=>{ message.innerHTML="Treasure Map Leak! Police see a remaining treasure."; if(treasures.length>0) alert(`Treasure at ${treasures[0].name}`); } },
  { name: "Hidden Cache", type:"Thief", effect:()=>{ message.innerHTML="Hidden Cache! Gain extra treasure if on treasure island."; checkTreasure(); } },
  { name: "Sudden Storm", type:"Both", effect:()=>{ message.innerHTML="Sudden Storm! All next moves reduced by 1."; thief.reduceMove=1; policeExtraMove=0; } }
];

//cardelement
const eventCardDiv = document.getElementById('eventCard');
const cardName = document.getElementById('cardName');
const cardType = document.getElementById('cardType');
const cardEffect = document.getElementById('cardEffect');
// Variables for police/future moves
let policeSkipNext=false;
let policeExtraMove=0;

function maybeDrawEvent(){
  if(Math.random()<0.5){ // 50% chance
    const event = events[Math.floor(Math.random()*events.length)];
    showEventCard(event);  // display visually
    event.effect();        // apply effect
  }
}

function showEventCard(event){
  cardName.innerText = event.name;
  cardType.innerText = `Type: ${event.type}`;
  cardEffect.innerText = getEventDescription(event.name);

  // Add color class based on type
  eventCardDiv.className = `event-card ${event.type.toLowerCase()}`;

  // Set icon
  cardIcon.src = cardIcons[event.type] || "";

  eventCardDiv.style.display = 'block';

  // Hide after 3 seconds
  setTimeout(()=>{ eventCardDiv.style.display = 'none'; }, 3000);
}
//card icons
const cardIcons = {
  "Thief": "https://upload.wikimedia.org/wikipedia/commons/1/1b/Red_circle.png",
  "Police": "https://upload.wikimedia.org/wikipedia/commons/2/29/Blue_circle.png",
  "Both": "https://upload.wikimedia.org/wikipedia/commons/6/60/Yellow_circle.png"
};

// Optional: map card name to readable description
function getEventDescription(name){
  switch(name){
    case "Storm": return "Thief loses next turn due to rough weather.";
    case "Secret Passage": return "Thief moves double dice roll this turn.";
    case "Treasure Bonus": return "Thief instantly collects one treasure from any island.";
    case "Police Alert": return "Thief revealed for 5 seconds.";
    case "Favorable Winds": return "Thief moves +1 extra island.";
    case "Foggy Night": return "Police skip next move due to poor visibility.";
    case "Island Patrol": return "Police move toward nearest treasure.";
    case "Hidden Cove": return "Thief can hide and remain invisible for one turn.";
    case "Radio Signal": return "Police detect Thief location.";
    case "Rough Seas": return "Thief loses one movement point this turn.";
    case "Smuggler’s Shortcut": return "Thief teleports to any island.";
    case "Reinforcements": return "Police get +1 move this turn.";
    case "Treasure Map Leak": return "Police see a remaining treasure.";
    case "Hidden Cache": return "Thief gains extra treasure if on a treasure island.";
    case "Sudden Storm": return "All players’ next moves reduced by 1.";
    default: return "";
  }
}

// Stealth update
function updateStealth(){
  let visible=false;
  police.forEach(p=>{
    const dist = map.distance(L.latLng(p.island.coords), L.latLng(thief.island.coords));
    if(dist<30000) visible=true;
  });
  if(!thief.skipReveal) thief.marker.setStyle({opacity: visible?1:0});
  thief.skipReveal=false;
}

// Draw random event (50% chance per Thief turn)
function maybeDrawEvent(){
  if(Math.random()<0.5){
    const event = events[Math.floor(Math.random()*events.length)];
    event.effect();
  }
}

// Move player
function movePlayer(player,targetIsland){
  player.island=targetIsland;
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
  if(thief.treasures>=3){ message.innerHTML="Thief wins! Escaped with all treasures!"; stopGame(); }
}

// Check if caught
function checkCatch(){
  police.forEach(p=>{ if(p.island===thief.island){ message.innerHTML=`Police caught the Thief on ${p.island.name}! Police wins!`; stopGame(); } });
}

// Next turn
function nextTurn(){
  turn=(turn==='thief')?'police':'thief';
  turnInfo.innerHTML = turn.charAt(0).toUpperCase()+turn.slice(1)+"'s turn";
}

// Stop game
function stopGame(){
  clearInterval(policeInterval);
  map.off('click');
}

// Thief movement click handler
map.on('click',e=>{
  if(turn!=='thief') return;
  if(thief.skipTurn){ message.innerHTML="Thief loses turn due to Storm."; thief.skipTurn=false; nextTurn(); return; }

  maybeDrawEvent();

  let dice=rollDice();
  if(thief.doubleMove){ dice*=2; thief.doubleMove=false; }
  if(thief.reduceMove){ dice=Math.max(1,dice-thief.reduceMove); thief.reduceMove=0; }

  let nearest=islands[0]; let minDist=map.distance(e.latlng,L.latLng(nearest.coords));
  islands.forEach(i=>{
    const d = map.distance(e.latlng,L.latLng(i.coords));
    if(d<minDist){ nearest=i; minDist=d; }
  });

  const distToIsland = map.distance(L.latLng(thief.island.coords),L.latLng(nearest.coords));
  if(distToIsland <= dice*30000){ movePlayer(thief,nearest); message.innerHTML+=` Thief rolled ${dice} and moved to ${nearest.name}`; }
  else{ message.innerHTML+=` Thief rolled ${dice}, but ${nearest.name} is too far.`; }
});

// Police auto-move toward Thief
function movePolice(){
  police.forEach(p=>{
    let nearest=islands[0]; let minDist=map.distance(L.latLng(p.island.coords),L.latLng(thief.island.coords));
    islands.forEach(i=>{
      const d=map.distance(L.latLng(i.coords),L.latLng(thief.island.coords));
      if(d<minDist){ nearest=i; minDist=d; }
    });
    movePlayer(p,nearest);
    // Extra move from reinforcement
    if(policeExtraMove>0){ movePlayer(p,nearest); policeExtraMove--; }
  });
}

// Police turn every 3s
const policeInterval=setInterval(()=>{ if(turn==='police'){ if(!policeSkipNext) movePolice(); else { policeSkipNext=false; message.innerHTML="Police lost turn due to Foggy Night!"; nextTurn(); } } },3000);

// Helper: police move to nearest treasure
function policeMoveToTreasure(){
  police.forEach(p=>{
    if(treasures.length===0) return;
    let nearest=treasures[0]; let minDist=map.distance(L.latLng(p.island.coords),L.latLng(nearest.coords));
    treasures.forEach(t=>{
      const d=map.distance(L.latLng(p.island.coords),L.latLng(t.coords));
      if(d<minDist){ nearest=t; minDist=d; }
    });
    movePlayer(p,nearest);
  });
}
