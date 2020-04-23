const BoxCollider = require('./box-collider');

module.exports = class Block extends BoxCollider {
  constructor(
    position,
    direction,
    scale,
    image,
    destroyable,
    collidable,
    health = 0
  ) {
    super(position, direction, scale);
    this.image = image;
    this.destroyable = destroyable;
    this.collidable = collidable;
    this.health = health;
  }
};
