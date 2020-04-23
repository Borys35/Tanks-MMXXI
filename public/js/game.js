/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('game-screen');

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');

const script = document.currentScript;
const roomId = script.getAttribute('roomId');

let playerId = null;
let players = {},
  bullets = [],
  blocks = [];
const playerImgs = [],
  bulletImgs = [],
  blockImgs = [];
let config = null;
let gameState = null;

const socket = io({ query: { roomId } });

socket.on('get_player', (id) => {
  playerId = id;
});

socket.on('update', (allPlayers, allBullets, allBlocks, levelConfig) => {
  config = levelConfig;
  const { type } = config;

  // SET PLAYERS
  players = allPlayers;
  // SET PLAYERS' IMAGES
  if (playerImgs.length !== Object.keys(players).length) {
    playerImgs.length = Object.keys(players).length;
    for (let i = 0; i < playerImgs.length; i++) {
      playerImgs[i] = new Image();
      playerImgs[i].src = `images/${type}/player.png`;
    }
  }

  // SET BULLETS
  bullets = allBullets;
  // SET BULLETS' IMAGES
  if (bulletImgs.length !== bullets.length) {
    bulletImgs.length = bullets.length;
    for (let i = 0; i < bulletImgs.length; i++) {
      bulletImgs[i] = new Image();
      bulletImgs[i].src = `images/${type}/bullet.png`;
    }
  }

  // SET BLOCKS
  blocks = allBlocks;
  // SET BLOCKS' IMAGES
  if (blockImgs.length !== blocks.length) {
    blockImgs.length = blocks.length;
    for (let i = 0; i < blockImgs.length; i++) {
      blockImgs[i] = new Image();
      blockImgs[i].src = `images/${type}/${blocks[i].image}.png`;
    }
  }
});

socket.on('state', (state) => {
  gameState = state;
});

//#region SET INPUT
const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  pressed: false,
};

document.addEventListener('keyup', (e) => onKey(e, e.keyCode, false));
document.addEventListener('keydown', (e) => onKey(e, e.keyCode, true));

function onKey(event, key, pressed) {
  switch (key) {
    // A
    case 65:
      input.left = pressed;
      event.preventDefault();
      break;
    // D
    case 68:
      input.right = pressed;
      event.preventDefault();
      break;
    // W
    case 87:
      input.up = pressed;
      event.preventDefault();
      break;
    // S
    case 83:
      input.down = pressed;
      event.preventDefault();
      break;
    // SPACE
    case 32:
      input.pressed = pressed;
      event.preventDefault();
      break;
  }
}
//#endregion

//#region CLIENT GAME LOOP
setInterval(() => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (config) {
    if (config.type === 'ships') ctx.fillStyle = '#008';
    else if (config.type === 'planes') ctx.fillStyle = '#99F';
    else ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  //#region DRAW OBJECTS
  // DRAW PLAYERS
  draw(Object.values(players), playerImgs);
  // DRAW BLOCKS
  draw(blocks, blockImgs);
  // DRAW BULLETS
  draw(bullets, bulletImgs);

  // DRAWER
  function draw(objects, images) {
    for (let i = 0; i < objects.length; i++) {
      const { position, direction } = objects[i];
      const img = images[i];
      ctx.save();
      ctx.translate(Math.round(position.x), Math.round(position.y));
      if (!direction.x)
        ctx.rotate(((direction.y === 1 ? 180 : 0) * Math.PI) / 180);
      if (!direction.y)
        ctx.rotate(((direction.x === 1 ? 90 : 270) * Math.PI) / 180);
      ctx.drawImage(img, img.width / -2, img.height / -2);
      ctx.restore();
    }
  }
  //#endregion

  //#region DRAW UI
  if (playerId) {
    const player = players[playerId];
    ctx.font = 'small-caps 12px Arial';
    ctx.fillStyle = 'green';
    ctx.textAlign = 'start';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${player ? player.health : 0} HP`, 6, canvas.height - 4);
  }

  if (gameState && !gameState.hasStarted) {
    ctx.font = '900 40px Arial';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gameState.secondsToStart, canvas.width / 2, canvas.height / 2);
  }
  //#endregion

  // SEND INPUT
  socket.emit('input', input);
}, 1000 / 60);
//#endregion
