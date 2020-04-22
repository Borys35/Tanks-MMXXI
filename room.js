const uuidv4 = require('uuid').v4;

const Player = require('./components/player');

module.exports = class Room {
  constructor(settings, io) {
    const { roomId, name, password } = settings;
    this.roomId = roomId;
    this.name = name;
    this.password = password;
    this.players = {};
    this.state = { secondsToStart: 20, hasStarted: false };

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
      3
    ));

    let lastTime = new Date().getTime();
    socket.on('input', (input) => {
      const nowTime = new Date().getTime();
      const deltaTime = (nowTime - lastTime) / 10;
      lastTime = nowTime;

      // CHECKING COLLISIONS...
      const modifiedPlayer = { ...player };
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

      // NO COLLISIONS = UPDATE PLAYER
      if (!anyCollisions(Object.values(this.players))) {
        player = modifiedPlayer;
      }

      function anyCollisions(players) {
        // WITH OTHER PLAYERS
        for (const other of players.filter((p) => p !== player)) {
          if (modifiedPlayer.collide(other)) {
            return true;
          }
        }

        // WITH BLOCKS

        // NO COLLISIONS
        return false;
      }
    });

    this.io.to(this.roomId).emit('state', this.state);
  }

  update(deltaTime) {
    this.io.to(this.roomId).emit('update', this.players);
  }
};
