const GameObject = require('./game-object');

module.exports = class BoxCollider extends GameObject {
  constructor(position, direction, scale, destroyable) {
    super(position, direction, scale);
    this.destroyable = destroyable;
  }

  collide(otherCollider) {
    if (
      ((this.position.x <= otherCollider.position.x &&
        this.position.x + this.scale.x > otherCollider.position.x) ||
        (this.position.x >= otherCollider.position.x &&
          this.position.x <
            otherCollider.position.x + otherCollider.scale.x)) &&
      ((otherCollider.position.y >= this.position.y &&
        otherCollider.position.y < this.position.y + this.scale.y) ||
        (this.position.y >= otherCollider.position.y &&
          this.position.y < otherCollider.position.y + otherCollider.scale.y))
    )
      return true;
    return false;
  }
};
