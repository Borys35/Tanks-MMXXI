const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const uuidv4 = require('uuid').v4;

const Room = require('./room');
const BoxCollider = require('./components/box-collider');

app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');

const rooms = {};
module.exports.removeRoom = (roomId) => {
  delete rooms[roomId];
};

app.get('/', (req, res) => {
  res.render('pages/index');
});

app.post('/rooms', (req, res) => {
  const { username } = req.body;
  if (username) {
    res.render('pages/rooms', { rooms });
  } else {
    res.redirect('/');
  }
});

app.post('/create', (req, res) => {
  const { name, password, levelIndex } = req.body;
  if (name) {
    const roomId = uuidv4();
    rooms[roomId] = new Room({ roomId, name, levelIndex }, io);
    res.render('pages/game', { roomId });
  } else {
    res.redirect('/');
  }
});

app.post('/join', (req, res) => {
  const { roomId } = req.body;
  const room = rooms[roomId];
  if (
    room.state.startTimestamp / 1000 + room.state.secondsToStart >
    Date.now() / 1000
  )
    res.render('pages/game', { roomId });
  else res.redirect('/');
});

app.get('*', (req, res) => {
  res.redirect('/');
});

io.on('connection', (socket) => {
  const { roomId } = socket.handshake.query;
  if (rooms[roomId]) {
    rooms[roomId].callback(socket);
  }
});

let lastTime = new Date().getTime();
setInterval(() => {
  const nowTime = new Date().getTime();
  const deltaTime = (nowTime - lastTime) / 10;
  lastTime = nowTime;

  for (const id of Object.keys(rooms)) {
    const room = rooms[id];
    room.update(deltaTime);
  }
}, 1000 / 60);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
