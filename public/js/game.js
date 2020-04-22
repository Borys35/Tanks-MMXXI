/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('game-screen');

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');

const script = document.currentScript;
const roomId = script.getAttribute('roomId');

let players = {};
const playerImgs = [],
  bulletImgs = [],
  blockImgs = [];
let gameState = null;

const socket = io({ query: { roomId } });
socket.on('update', (all) => {
  // SET PLAYERS
  players = all;
  // SET PLAYER IMAGES
  const { length } = Object.keys(players);
  if (length !== playerImgs.length) {
    playerImgs.length = length;
    for (let i = 0; i < playerImgs.length; i++) {
      playerImgs[i] = new Image();
      playerImgs[i].src = 'images/tank.png';
    }
  }
});

socket.on('state', (state) => {
  gameState = state;
});

//#region  INPUT
const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  clicked: false,
  onClick: () => {
    socket.emit('shoot');
  },
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
      if (pressed && !input.clicked && timer > clickRate) {
        timer = 0;
        input.onClick();
      }
      input.clicked = pressed;
      break;
  }
}
//#endregion

//#region CLIENT GAME LOOP
setInterval(() => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // DRAW PLAYERS
  const playerObjects = Object.values(players);
  for (let i = 0; i < playerObjects.length; i++) {
    const { position, direction } = playerObjects[i];
    const img = playerImgs[i];
    ctx.save();
    ctx.translate(Math.round(position.x), Math.round(position.y));
    if (!direction.x)
      ctx.rotate(((direction.y === 1 ? 180 : 0) * Math.PI) / 180);
    if (!direction.y)
      ctx.rotate(((direction.x === 1 ? 90 : 270) * Math.PI) / 180);
    ctx.drawImage(img, img.width / -2, img.height / -2);
    ctx.restore();
  }

  // DRAW UI
  if (gameState && !gameState.hasStarted) {
    ctx.font = '900 40px Arial';
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gameState.secondsToStart, canvas.width / 2, canvas.height / 2);
  }

  // SEND INPUT
  socket.emit('input', input);
}, 1000 / 60);
//#endregion
