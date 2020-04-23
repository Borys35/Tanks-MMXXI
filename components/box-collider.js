const GameObject = require('./game-object');

module.exports = class BoxCollider extends GameObject {
  constructor(position, direction, scale, destroyable) {
    super(position, direction, scale);
    this.destroyable = destroyable;
  }

  static collide(collider, otherCollider) {
    const pos1 = {
      x: collider.position.x - collider.scale.x / 2,
      y: collider.position.y - collider.scale.y / 2,
    };
    const pos2 = {
      x: otherCollider.position.x - otherCollider.scale.x / 2,
      y: otherCollider.position.y - otherCollider.scale.y / 2,
    };

    if (
      ((pos1.x <= pos2.x && pos1.x + collider.scale.x > pos2.x) ||
        (pos1.x >= pos2.x && pos1.x < pos2.x + otherCollider.scale.x)) &&
      ((pos2.y >= pos1.y && pos2.y < pos1.y + collider.scale.y) ||
        (pos1.y >= pos2.y && pos1.y < pos2.y + otherCollider.scale.y))
    )
      return true;
    return false;
  }
};
