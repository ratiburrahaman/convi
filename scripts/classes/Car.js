import { setting } from "./setting.js";

export default class Car extends Phaser.Physics.Arcade.Sprite {
  constructor(config) {
    super(config.scene, config.x, config.y, config.key);

    config.scene.add.existing(this);

    this.scene.physics.world.enable(this);
    this.scene.add.existing(this);
    this.body.setSize(0.25 * this.width);

    this.speed = 0; // current speed
    this.maxSpeed = config.scene.segmentLength/1.5; // top speed (ensure we can't move more than 1 segment in a single frame to make collision detection easier)
    this.accel = 1; // acceleration rate - tuned until it 'felt' right
    this.breaking = 2; // deceleration rate when braking
    this.decel = 1.2; // 'natural' deceleration rate when neither accelerating, nor braking
    this.offRoadDecel = -this.maxSpeed / 2; // off road deceleration is somewhere in between
    this.offRoadLimit = this.maxSpeed / 4; // limit when off road deceleration no longer applies (e.g. you can always go at least this speed even when off road)

    this.driveRumble = 1;
    this.offRoadRumble = 2;

    this.alive = true;
    this.localScale = config.scene.cameraDepth / config.scene.playerZ;
    this.setScale(0.8);
    this.x = this.scene.renderSettings.width / 2;
    this.y = this.scene.renderSettings.height - (this.height - 250);
    this.startY = this.y;

  }
  preUpdate() {

    this.speed = setting.carSpeed;

  }

}
