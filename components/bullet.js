const BoxCollider = require('./box-collider');

module.exports = class Bullet extends BoxCollider {
  constructor(position, direction, speed, damage) {
    super(position, direction, { x: 2, y: 3 }, true);
    this.speed = speed;
    this.damage = damage;
  }
};
