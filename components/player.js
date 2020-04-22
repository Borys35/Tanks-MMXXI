const BoxCollider = require('./box-collider');

module.exports = class Player extends BoxCollider {
  constructor(position, health, speed) {
    super(position, { x: 0, y: -1 }, { x: 14, y: 14 }, true);
    this.health = health;
    this.speed = speed;
  }
};
