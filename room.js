const uuidv4 = require('uuid').v4;

const Player = require('./components/player');
const Bullet = require('./components/bullet');

module.exports = class Room {
  constructor(settings, io) {
    const { roomId, name, password } = settings;
    this.roomId = roomId;
    this.name = name;
    this.password = password;
    this.players = {};
    this.bullets = [];
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
  }

  join() {}

  callback(socket) {
    socket.join(this.roomId);

    const playerId = uuidv4();
    let player = (this.players[playerId] = new Player(
      { x: 40, y: 20 },
      100,
      0.6,
      100
    ));

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
      if (!anyCollisions(modifiedPlayer, Object.values(this.players))) {
        // ...UPDATE THE PLAYER
        player.position = modifiedPlayer.position;
      }

      // CHECK COLLISIONS...
      function anyCollisions(collider, players) {
        // ...WITH OTHER PLAYERS
        for (const other of players.filter((p) => p !== player)) {
          if (Player.collide(collider, other)) {
            return true;
          }
        }

        // ...WITH BLOCKS

        // NO COLLISIONS
        return false;
      }
    });

    this.io.to(this.roomId).emit('state', this.state);
  }

  update(deltaTime) {
    for (let i = 0; i < this.bullets.length; i++) {
      const bullet = this.bullets[i];
      bullet.position.x += bullet.direction.x * bullet.speed * deltaTime;
      bullet.position.y += bullet.direction.y * bullet.speed * deltaTime;

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
    }

    this.io.to(this.roomId).emit('update', this.players, this.bullets);
  }
};
