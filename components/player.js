const BoxCollider = require('./box-collider');

module.exports = class Player extends BoxCollider {
  constructor(position, health, speed, shootRate) {
    super(position, { x: 0, y: -1 }, { x: 14, y: 14 });
    this.health = health;
    this.speed = speed;
    this.shootRate = shootRate;
  }
};
