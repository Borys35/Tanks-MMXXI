const getPixels = require('get-pixels');
const uuidv4 = require('uuid').v4;

const Player = require('./components/player');
const Bullet = require('./components/bullet');
const Block = require('./components/block');
const { levels } = require('./gameconfig.json');

module.exports = class Room {
  constructor(settings, io) {
    const { roomId, name, password, levelIndex } = settings;
    this.roomId = roomId;
    this.name = name;
    this.password = password;
    this.players = {};
    this.bullets = [];
    this.blocks = [];
    this.state = { secondsToStart: 5, hasStarted: false };

    this.io = io;

    this.countdown = setInterval(() => {
      this.state.secondsToStart--;
      if (this.state.secondsToStart <= 0) {
        this.state.hasStarted = true;
        clearInterval(this.countdown);
      }
      io.to(this.roomId).emit('state', this.state);
    }, 1000);

    this.levelConfig = levels[levelIndex];
    if (this.levelConfig) this.createLevel(levelIndex, this.blocks);
  }

  createLevel(index, blocks) {
    getPixels(
      `./levels/${index < 10 ? `0${index}` : index}.png`,
      (err, pixels) => {
        if (err) return;
        const { data, shape } = pixels;
        for (let y = 0; y < shape[1]; y++) {
          for (let x = 0; x < shape[0]; x++) {
            let i = (y * shape[0] + x) * 4;
            const r = data[i],
              g = data[i + 1],
              b = data[i + 2],
              a = data[i + 3];
            if (a !== 0) {
              let block = null;
              if (b === 255) {
                block = new Block(
                  { x: x * 16 + 8, y: y * 16 + 8 },
                  { x: 0, y: 0 },
                  { x: 16, y: 16 },
                  'blue',
                  false,
                  true
                );
              } else if (g === 255) {
                block = new Block(
                  { x: x * 16 + 8, y: y * 16 + 8 },
                  { x: 0, y: 0 },
                  { x: 16, y: 16 },
                  'green',
                  false,
                  false
                );
              } else {
                block = new Block(
                  { x: x * 16 + 8, y: y * 16 + 8 },
                  { x: 0, y: -1 },
                  { x: 16, y: 16 },
                  'black',
                  true,
                  true,
                  30
                );
              }
              blocks.push(block);
            }
          }
        }
      }
    );
  }

  callback(socket) {
    socket.join(this.roomId);

    const spawnPos = this.levelConfig.spawns[
      Object.keys(this.players).length
    ] || {
      x: 0,
      y: 0,
    };
    const player = new Player(spawnPos, 100, 0.4, 80);
    const playerId = uuidv4();
    this.players[playerId] = player;

    socket.emit('get_player', playerId);

    let timer = 0;
    let lastTime = new Date().getTime();
    socket.on('input', (input) => {
      const nowTime = new Date().getTime();
      const deltaTime = (nowTime - lastTime) / 10;
      lastTime = nowTime;

      if (!this.state.hasStarted) return;

      // INPUT ACTIONS
      timer += deltaTime;
      if (input.pressed) {
        if (timer > player.shootRate) {
          timer = 0;
          const bullet = new Bullet(
            {
              x: player.position.x + player.direction.x * 11,
              y: player.position.y + player.direction.y * 11,
            },
            { ...player.direction },
            1,
            10
          );
          this.bullets.push(bullet);
        }
      }

      const modifiedPlayer = {
        position: { ...player.position },
        scale: { ...player.scale },
      };
      if (input.up) {
        modifiedPlayer.position.y -= player.speed * deltaTime;
        player.direction.x = 0;
        player.direction.y = -1;
      } else if (input.down) {
        modifiedPlayer.position.y += player.speed * deltaTime;
        player.direction.x = 0;
        player.direction.y = 1;
      } else if (input.left) {
        modifiedPlayer.position.x -= player.speed * deltaTime;
        player.direction.x = -1;
        player.direction.y = 0;
      } else if (input.right) {
        modifiedPlayer.position.x += player.speed * deltaTime;
        player.direction.x = 1;
        player.direction.y = 0;
      }

      // IF NO COLLISIONS...
      if (
        !anyCollisions(modifiedPlayer, Object.values(this.players), this.blocks)
      ) {
        // ...UPDATE THE PLAYER
        player.position = modifiedPlayer.position;
      }

      // CHECK COLLISIONS...
      function anyCollisions(collider, players, blocks) {
        // ...IN BOUNDS
        if (Player.inBounds(collider)) {
          return true;
        }
        // ...WITH OTHER PLAYERS
        for (const other of players.filter((p) => p !== player)) {
          if (Player.collide(collider, other)) {
            return true;
          }
        }
        // ...WITH BLOCKS
        for (const block of blocks.filter((b) => b.collidable)) {
          if (Player.collide(collider, block)) {
            return true;
          }
        }
        // NO COLLISIONS
        return false;
      }
    });

    socket.on('disconnect', () => {
      delete this.players[playerId];
    });

    // ONLY ONCE
    this.io.to(this.roomId).emit('state', this.state);
  }

  update(deltaTime) {
    // MOVE BULLETS
    for (let i = 0; i < this.bullets.length; i++) {
      const bullet = this.bullets[i];
      bullet.position.x += bullet.direction.x * bullet.speed * deltaTime;
      bullet.position.y += bullet.direction.y * bullet.speed * deltaTime;

      // CHECK COLLISIONS...
      // ... WITH PLAYERS
      for (const id of Object.keys(this.players)) {
        const player = this.players[id];
        if (Bullet.collide(bullet, player)) {
          player.health -= bullet.damage;
          if (player.health <= 0) {
            delete this.players[id];
          }
          this.bullets.splice(i, 1);
        }
      }
      // ... WITH BLOCKS
      for (const block of this.blocks.filter((b) => b.destroyable)) {
        if (Bullet.collide(bullet, block)) {
          block.health -= bullet.damage;
          if (block.health <= 0) {
            const blockIndex = this.blocks.findIndex((b) => b === block);
            this.blocks.splice(blockIndex, 1);
          }
          this.bullets.splice(i, 1);
        }
      }
    }

    this.io
      .to(this.roomId)
      .emit(
        'update',
        this.players,
        this.bullets,
        this.blocks,
        this.levelConfig
      );
  }
};
