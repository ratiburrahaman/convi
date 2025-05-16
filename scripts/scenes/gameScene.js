import Car from '../classes/Car.js';
import Utils from '../classes/mathHelpers.js';
import Renderer from '../classes/renderHelpers.js';
import { Robot } from '../classes/robot.js';
import { setting } from '../classes/setting.js';
import { Star } from '../classes/star.js';


class gameScene extends Phaser.Scene {
  constructor(test) {
    super({
      key: 'gameScene'
    });
  }
  create() {


    setting.carSpeed = 40;
    this.isGameOver = false;

    this.robotGroup = this.add.group();
    this.starGroup = this.add.group();


    let fps = 60; // how many 'update' frames per second
    let step = 1 / fps; // how long is each frame (in seconds)

    this.renderSettings = {
      width: this.sys.game.config.width, // logical canvas width
      height: this.sys.game.config.height, // logical canvas height
      resolution: null, // scaling factor to provide resolution independence (computed)
      fieldOfView: 100, // angle (degrees) for field of view
      cameraHeight: 1000, // z height of camera
      cameraDepth: null, // z distance camera is from screen (computed)
      drawDistance: 300, // number of segments to draw
      position: 0, // current camera Z position (add playerZ to get player's absolute Z position)
      fogDensity: 10 // exponential fog density
    }

    this.ROAD = {
      LENGTH: {
        NONE: 0,
        SHORT: 25,
        MEDIUM: 50,
        LONG: 100
      },
      HILL: {
        NONE: 0,
        LOW: 20,
        MEDIUM: 40,
        HIGH: 60
      },
      CURVE: {
        NONE: 0,
        EASY: 2,
        MEDIUM: 4,
        HARD: 6
      }
    }

    this.segments = []; // array of road segments
    this.segmentSprites = [];

    this.roadWidth = 1000; // actually half the roads width, easier math if the road spans from -roadWidth to +roadWidth
    this.segmentLength = 200; // length of a single segment
    this.rumbleLength = 3; // number of segments per red/white rumble strip
    this.trackLength = null; // z length of entire track (computed)
    this.lanes = 3; // number of lanes

    this.playerX = 0; // player x offset from center of road (-1 to 1 to stay independent of roadWidth)
    this.playerY = 0;
    this.playerZ = null; // player relative z distance from camera (computed)
    this.centrifugal = 1.2;
    this.background = this.add.sprite(this.renderSettings.width / 2, (this.renderSettings.height / 2) - 240, 'bg');
    this.background.setScale(1.5, 1.3);
    //this.camera = this.cameras3d.add(90).setPosition(0, -40, 100).setPixelScale(64);

    this.utils = new Utils(this);
    this.render = new Renderer(this);

    this.graphics = this.add.graphics({
      x: 0,
      y: 0
    });
   // this.cameras.main.setBackgroundColor(this.render.COLORS.SKY);

    this.cursors = this.input.keyboard.createCursorKeys();


    this.build();

    this.playerCar = new Car({
      scene: this,
      key: 'car',
      y: 0,
      x: 0
    });

    this.addController();


    this.physics.add.overlap(this.starGroup, this.playerCar, (star, car) => {
      if (!star.visited) {
        console.log('star overlap');
        setting.carSpeed = 0;
        this.starCount += 1;

        this.starArr[this.starCount - 1].setTexture('star-1');


        if(this.starCount > 4){
          this.winMsg.visible = true;
          this.isGameOver = true;
        }else{
          this.starMsg.visible = true;

        }

      }

      star.destroy();
      star.visited = true;

    })

    this.physics.add.overlap(this.robotGroup, this.playerCar, (robot, car) => {
      if (!robot.visited) {
        console.log('robot overlap');
        setting.carSpeed = 0;

        let angle = this.fuelMeter.angle - 37

        console.log(this.fuelMeter.angle);

        if(this.fuelMeter.angle > -110){

          this.tweens.add({
            targets: this.fuelMeter,
            angle: angle,
            duration: 2000,
            ease: 'Power1',
            onComplete: () => {
            }
          });

          if(this.fuelMeter.angle > -74){
           // this.fuelMeter.angle = -110;
            this.robotMsg.visible = true;
          }else{
            this.isGameOver = true;
            console.log('game over');
            this.lossMsg.visible = true;
          }

        }

      }

      robot.destroy();

      robot.visited = true;
    })

  }
  update() {

    let playerSegment = this.findSegment(this.renderSettings.position + this.playerZ);
    let speedPercent = (this.playerCar.speed / this.playerCar.maxSpeed)/4;

    //console.log(speedPercent)
    let dx = 0.1 * speedPercent; // at top speed, should be able to cross from left to right (-1 to 1) in 1 second

    if (this.cursors.left.isDown) {
      this.playerX -= dx;
    } else if (this.cursors.right.isDown) {
      this.playerX += dx;
    }


    this.renderSettings.position = this.utils.increase(this.renderSettings.position, this.playerCar.speed, this.trackLength);

    this.playerX = this.playerX - (dx * speedPercent * playerSegment.curve * this.centrifugal);

    this.playerX = this.utils.limit(this.playerX, -2, 2); // dont ever let it go too far out of bounds

    this.updateRoad();
  }

  build() {
    this.renderSettings.cameraDepth = 1 / Math.tan((this.renderSettings.fieldOfView / 2) * Math.PI / 180);
    this.playerZ = (this.renderSettings.cameraHeight * this.renderSettings.cameraDepth);
    this.renderSettings.resolution = this.renderSettings.height / (this.renderSettings.height / 2);
    if (this.segments.length == 0) {
      this.buildRoad(); // only build road when necessary
    }
  }


  buildRoad() {
    this.segments = [];

    this.addStraight(this.ROAD.LENGTH.SHORT / 2);
    this.addCurve(this.ROAD.LENGTH.MEDIUM, this.ROAD.CURVE.NONE, this.ROAD.HILL.NONE);


    this.addCurve(this.ROAD.LENGTH.MEDIUM, this.ROAD.CURVE.NONE, this.ROAD.HILL.NONE);
    this.addCurve(this.ROAD.LENGTH.MEDIUM, this.ROAD.CURVE.NONE, this.ROAD.HILL.NONE);
    this.addCurve(this.ROAD.LENGTH.MEDIUM, this.ROAD.CURVE.NONE, this.ROAD.HILL.NONE);

    this.addHill(this.ROAD.LENGTH.SHORT, this.ROAD.HILL.NONE);
    this.addLowRollingHills();
    this.addLowRollingHills();
    this.addCurve(this.ROAD.LENGTH.LONG, this.ROAD.CURVE.NONE, this.ROAD.HILL.NONE);
    this.addStraight();
    this.addCurve(this.ROAD.LENGTH.LONG, -this.ROAD.CURVE.NONE, this.ROAD.HILL.NONE);
    this.addHill(this.ROAD.LENGTH.LONG, this.ROAD.HILL.NONE);
    this.addCurve(this.ROAD.LENGTH.LONG, this.ROAD.CURVE.NONE, -this.ROAD.HILL.NONE);
    this.addHill(this.ROAD.LENGTH.LONG, -this.ROAD.HILL.NONE);
    this.addStraight();
    this.addDownhillToEnd();

    this.segments[this.findSegment(this.playerZ).index + 2].color = this.render.COLORS.START;
    this.segments[this.findSegment(this.playerZ).index + 3].color = this.render.COLORS.START;

    for (let n = 0; n < this.rumbleLength; n++) {
      this.segments[this.segments.length - 1 - n].color = this.render.COLORS.FINISH;
    }

    this.trackLength = this.segments.length * this.segmentLength;
    this.buildSprites();

    //console.log(this.segments);
  }

  updateRoad() {
    this.graphics.clear();

    let baseSegment = this.findSegment(this.renderSettings.position);


    let basePercent = this.utils.percentRemaining(this.renderSettings.position, this.segmentLength);
    let playerSegment = this.findSegment(this.renderSettings.position + this.playerZ);
    let playerPercent = this.utils.percentRemaining(this.renderSettings.position + this.playerZ, this.segmentLength);
    this.playerY = this.utils.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);

    let maxy = this.renderSettings.height;
    let x = 0;
    let dx = -(baseSegment.curve * basePercent);
    let n, segment;

    this.renderSettings.position = this.utils.increase(this.renderSettings.position, this.playerCar.speed, this.trackLength);

    for (n = 0; n < this.renderSettings.drawDistance; n++) {
      segment = this.segments[(baseSegment.index + n) % this.segments.length];
      segment.looped = segment.index < baseSegment.index;
      segment.fog = this.utils.exponentialFog(n / this.renderSettings.drawDistance, this.renderSettings.fogDensity);
      segment.clip = maxy;


      this.utils.project(segment.p1, (this.playerX * this.roadWidth) - x, this.playerY + this.renderSettings.cameraHeight, this.renderSettings.position - (segment.looped ? this.trackLength : 0), this.renderSettings.cameraDepth, this.renderSettings.width, this.renderSettings.height, this.roadWidth);
      this.utils.project(segment.p2, (this.playerX * this.roadWidth) - x - dx, this.playerY + this.renderSettings.cameraHeight, this.renderSettings.position - (segment.looped ? this.trackLength : 0), this.renderSettings.cameraDepth, this.renderSettings.width, this.renderSettings.height, this.roadWidth);

      x = x + dx;
      dx = dx + segment.curve;

      if (segment.sprites.length) {
        for (let i = 0; i < segment.sprites.length; i++) {
          let spriteScale = segment.p1.screen.scale;
          let spriteX = segment.p1.screen.x + (spriteScale * segment.sprites[i].offset * this.roadWidth * this.renderSettings.width / 2);
          let spriteY = segment.p1.screen.y;

          if (segment.p2.screen.y <= maxy) // clip by (already rendered) segment
          {
            segment.sprites[i].spriteRef.setPosition(spriteX, spriteY);
            segment.sprites[i].spriteRef.setScale((spriteScale * 2000));
            segment.sprites[i].spriteRef.setVisible(true);

          } else {
            segment.sprites[i].spriteRef.setVisible(false);
          }


        }
      }

      if ((segment.p1.camera.z <= this.renderSettings.cameraDepth) || // behind us
        (segment.p2.screen.y >= segment.p1.screen.y) || // back face cull
        (segment.p2.screen.y >= maxy)) // clip by (already rendered) segment
        continue;

      this.render.renderSegment(this.renderSettings.width, this.lanes,
        segment.p1.screen.x,
        segment.p1.screen.y,
        segment.p1.screen.w,
        segment.p2.screen.x,
        segment.p2.screen.y,
        segment.p2.screen.w,
        segment.fog,
        segment.color);
      maxy = segment.p2.screen.y;
    }
  }

  buildSprites() {
    this.addSegmentSprite(720, 'billboard', 2);
    this.addSegmentSprite(620, 'billboard', 2);
    this.addSegmentSprite(520, 'billboard', 2);

    this.addSegmentSprite(60, 'car', 1);
    this.addSegmentSprite(40, 'billboard', 2);
    this.addSegmentSprite(40, 'billboard', 2);
    this.addSegmentSprite(20, 'car', 1);
    this.addSegmentSprite(10, 'car', -1);
    this.addSegmentSprite(5, 'billboard', 2);
    this.addSegmentSprite(5, 'billboard', -2);

    let robotOffsetArr = [0, -1, 1];

    for(let i = this.segments.length - 100; i > 0; i -= 200) {
      let dirX = robotOffsetArr[Phaser.Math.Between(0, robotOffsetArr.length - 1)];
      this.addSegmentSprite(i, 'robot', dirX);
    }

    // this.addSegmentSprite(100, 'robot', 1);

    // this.addSegmentSprite(100, 'star', -1);



    for(let i = this.segments.length - 100; i > 0; i -= 120) {
      let dirX = robotOffsetArr[Phaser.Math.Between(0, robotOffsetArr.length - 1)];
      this.addSegmentSprite(i, 'star', dirX);
    }

    //this.addSegmentSprite(100, 'robot', 0);

  }

  findSegment(z) {
    return this.segments[Math.floor(z / this.segmentLength) % this.segments.length];
  }

  lastY() {
    return (this.segments.length == 0) ? 0 : this.segments[this.segments.length - 1].p2.world.y;
  }
  addSegmentSprite(index, spriteKey, offset) {
    let sprite;

    if(spriteKey == 'robot') {
      sprite = new Robot(this, 0, 0, spriteKey);

      this.segments[index].sprites.push({
        key: spriteKey,
        offset: offset,
        spriteRef: sprite
      });

      this.robotGroup.add(sprite);

    }else if(spriteKey == 'star'){
      sprite = new Star(this, 0, 0, spriteKey);

      this.segments[index].sprites.push({
        key: spriteKey,
        offset: offset,
        spriteRef: sprite
      });

      this.starGroup.add(sprite);
    }

    if(sprite){
      sprite.setVisible(false);
    }
  }

  addSegment(curve, y) {
    let n = this.segments.length;
    this.segments.push({
      index: n,
      p1: {
        world: {
          y: this.lastY(),
          z: n * this.segmentLength
        },
        camera: {},
        screen: {}
      },
      p2: {
        world: {
          y: y,
          z: (n + 1) * this.segmentLength
        },
        camera: {},
        screen: {}
      },
      sprites: [],
      cars: [],
      curve: curve,
      color: Math.floor(n / this.rumbleLength) % 2 ? this.render.COLORS.DARK : this.render.COLORS.LIGHT
    });
  }

  addRoad(enter, hold, leave, curve, y) {
    let startY = this.lastY();
    let endY = startY + (this.utils.toInt(y, 0) * this.segmentLength);
    let n, total = enter + hold + leave;
    for (n = 0; n < enter; n++)
      this.addSegment(this.utils.easeIn(0, curve, n / enter), this.utils.easeInOut(startY, endY, n / total));
    for (n = 0; n < hold; n++)
      this.addSegment(curve, this.utils.easeInOut(startY, endY, (enter + n) / total));
    for (n = 0; n < leave; n++)
      this.addSegment(this.utils.easeInOut(curve, 0, n / leave), this.utils.easeInOut(startY, endY, (enter + hold + n) / total));
  }

  addStraight(num) {
    num = num || this.ROAD.LENGTH.MEDIUM;
    this.addRoad(num, num, num, 0, 0);
  }
  addHill(num, height) {
    num = num || this.ROAD.LENGTH.MEDIUM;
    height = height || this.ROAD.HILL.MEDIUM;
    this.addRoad(num, num, num, 0, height);
  }
  addCurve(num, curve, height) {
    num = num || this.ROAD.LENGTH.NONE;
    curve = curve || this.ROAD.CURVE.NONE;
    height = height || this.ROAD.HILL.NONE;
    this.addRoad(num, num, num, curve, height);
  }

  addLowRollingHills(num, height) {
    num = num || this.ROAD.LENGTH.SHORT;
    height = height || this.ROAD.HILL.LOW;
    this.addRoad(num, num, num, 0, height / 2);
    this.addRoad(num, num, num, 0, -height);
    this.addRoad(num, num, num, 0, height);
    this.addRoad(num, num, num, 0, 0);
    this.addRoad(num, num, num, 0, height / 2);
    this.addRoad(num, num, num, 0, 0);
  }

  addSCurves() {

    this.addRoad(this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, -this.ROAD.CURVE.NONE, this.ROAD.HILL.NONE);
    this.addRoad(this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.CURVE.NONE, this.ROAD.HILL.NONE);
    this.addRoad(this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.CURVE.NONE, -this.ROAD.HILL.NONE);
    this.addRoad(this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, -this.ROAD.CURVE.NONE, this.ROAD.HILL.NONE);
    this.addRoad(this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, -this.ROAD.CURVE.NONE, -this.ROAD.HILL.NONE);

    // this.addRoad(this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, -this.ROAD.CURVE.EASY, this.ROAD.HILL.NONE);
    // this.addRoad(this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.CURVE.MEDIUM, this.ROAD.HILL.MEDIUM);
    // this.addRoad(this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.CURVE.EASY, -this.ROAD.HILL.LOW);
    // this.addRoad(this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, -this.ROAD.CURVE.EASY, this.ROAD.HILL.MEDIUM);
    // this.addRoad(this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, this.ROAD.LENGTH.MEDIUM, -this.ROAD.CURVE.MEDIUM, -this.ROAD.HILL.MEDIUM);
  }


  addDownhillToEnd(num) {
    num = num || 200;
    this.addRoad(num, num, num, -this.ROAD.CURVE.NONE, -this.lastY() / this.segmentLength);
  }


  addController(){


    this.lineXarr = [354, 960, 1566];


    let laneGraphics_1 = this.add.graphics();

    const color = 0xffff00;
    const thickness = 4;
    const alpha = 0.01;
    
    laneGraphics_1.lineStyle(thickness, color, alpha);
    
    laneGraphics_1.beginPath();
    
    laneGraphics_1.moveTo(945, 550);
    laneGraphics_1.lineTo(10, 1080);
    laneGraphics_1.lineTo(630, 1080);


    
    laneGraphics_1.closePath();
    laneGraphics_1.strokePath();
    
    // Define the polygon points for interaction
    const polygonPoints = [
      { x: 945, y: 550 },
      { x: 10, y: 1080 },
      { x: 630, y: 1080 },
    ];
    
    // Create a polygon shape for interactivity
    const polygon = new Phaser.Geom.Polygon(polygonPoints);
    
    // Make the graphics object interactive with the polygon
    laneGraphics_1.setInteractive(polygon, Phaser.Geom.Polygon.Contains);
    
    // Add a click event
    laneGraphics_1.on('pointerdown', () => {
      this.playerMove(this.lineXarr[0]);
      this.isPlayerLeft = false;
      this.isPlayerCenter = false;
      this.isPlayerRight = true;
    });


    let laneGraphics_2 = this.add.graphics();
    
    laneGraphics_2.lineStyle(thickness, color, alpha);
    
    laneGraphics_2.beginPath();
    
    laneGraphics_2.moveTo(955, 550);
    laneGraphics_2.lineTo(650, 1080);
    laneGraphics_2.lineTo(1280, 1080);

    laneGraphics_2.closePath();
    laneGraphics_2.strokePath();

    const polygonPoints_2 = [
      { x: 955, y: 550 },
      { x: 650, y: 1080 },
      { x: 1280, y: 1080 },
    ];
    
    // Create a polygon shape for interactivity
    const polygon_2 = new Phaser.Geom.Polygon(polygonPoints_2);
    laneGraphics_2.setInteractive(polygon_2, Phaser.Geom.Polygon.Contains);
    laneGraphics_2.on('pointerdown', () => {
      this.playerMove(this.lineXarr[1]);
      this.isPlayerLeft = false;
      this.isPlayerCenter = true;
      this.isPlayerRight = false;
      console.log(2);
    });


    let laneGraphics_3 = this.add.graphics();
    
    laneGraphics_3.lineStyle(thickness, color, alpha);
    
    laneGraphics_3.beginPath();
    
    laneGraphics_3.moveTo(965, 550);
    laneGraphics_3.lineTo(1280, 1080);
    laneGraphics_3.lineTo(1940, 1080);
    
    laneGraphics_3.closePath();
    laneGraphics_3.strokePath();

    const polygonPoints_3 = [
      { x: 955, y: 550 },
      { x: 1280, y: 1080 },
      { x: 1940, y: 1080 },
    ];
    
    // Create a polygon shape for interactivity
    const polygon_3 = new Phaser.Geom.Polygon(polygonPoints_3);
    laneGraphics_3.setInteractive(polygon_3, Phaser.Geom.Polygon.Contains);
    laneGraphics_3.on('pointerdown', () => {
      this.playerMove(this.lineXarr[2]);
      this.isPlayerLeft = false;
      this.isPlayerCenter = true;
      this.isPlayerRight = false;
      console.log(3);
    });

    this.addUI();
  }

  playerMove(posX) {
    this.help.visible = false;
    if(this.isGameOver) return;
    this.tweens.add({
      targets: this.playerCar,
      x: posX,
      duration: 500
    })
  }

  addUI(){

    this.help = this.add.text(this.sys.canvas.width / 2, this.sys.canvas.height / 2 + 100, "Click lane to move", {
      fontSize: "100px",
      fontFamily: "font",
      color: "#006400", // Dark green color
      stroke: "#FFFFFF", // White outline
      strokeThickness: 4 // Adjust thickness of the outline as needed
    }).setOrigin(0.5).setDepth(10);
    
    this.tweens.add({
      targets: this.help,
      alpha: 0,
      duration: 1000,
      ease: 'Power1',
      yoyo: true,
      repeat: -1
    });


    this.add.image(1800, 120, 'fuel-meter').setOrigin(0.5, 0.5);
    this.fuelMeter = this.add.image(1800, 140, 'speedometer-needle').setOrigin(0.5, 0.5);

    this.fuelMeter.setAngle(0);

    this.robotMsg = this.add.container(this.renderSettings.width / 2, 400).setVisible(false);
    let robotBg = this.add.image(0, 0, 'robot-msg');
    let btn_robot = this.add.rectangle(10, 200, 310, 60, 0x000000, 0.01).setInteractive({cursor: 'pointer'})
    .on('pointerdown', () => {
      this.robotMsg.visible = false;
      setting.carSpeed = 40;
    });

    this.robotMsg.add([robotBg, btn_robot]);


    this.starMsg = this.add.container(this.renderSettings.width / 2, 400).setVisible(false);
    let bg_star = this.add.image(0, 0, 'star-msg');
    let btn_star = this.add.rectangle(10, 200, 310, 60, 0x000000, 0.01).setInteractive({cursor: 'pointer'})
    .on('pointerdown', () => {
      this.starMsg.visible = false;
      setting.carSpeed = 40;

    });

    this.starMsg.add([bg_star, btn_star]);


    this.winMsg = this.add.container(this.renderSettings.width / 2, 870).setVisible(false);
    let bg_win = this.add.image(0, 0, 'win-msg');

    let school = this.add.image(0, -200, 'school').setOrigin(0.5, 1).setScale(1.2);

    let btn_home = this.add.rectangle(-240, 80, 310, 60, 0x000000, 0.01).setInteractive({cursor: 'pointer'})
    .on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    let btn_replay = this.add.rectangle(320, 80, 310, 60, 0x000000, 0.01).setInteractive({cursor: 'pointer'})
    .on('pointerdown', () => {
      this.scene.start('gameScene');
    });

    this.winMsg.add([bg_win, btn_replay, btn_home, school]);


    this.lossMsg = this.add.container(this.renderSettings.width / 2, 870).setVisible(false);
    let bg_loss = this.add.image(0, 0, 'lose-msg');

    let loss_bg = this.add.image(0, -180, 'loss_bg').setOrigin(0.5, 1).setScale(1);

    let btn_loss_home = this.add.rectangle(-240, 80, 310, 60, 0x000000, 0.01).setInteractive({cursor: 'pointer'})
    .on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    let btn_loss_replay = this.add.rectangle(320, 80, 310, 60, 0x000000, 0.01).setInteractive({cursor: 'pointer'})
    .on('pointerdown', () => {
      this.scene.start('gameScene');
    });

    this.lossMsg.add([loss_bg, bg_loss, btn_loss_home, btn_loss_replay]);



    this.add.text(215, 25, 'Estrellas Pacificadoras:​', {
      fontFamily: 'Arial',
      fontSize: 32,
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);

    this.starCount = 0;

    // add stars
    this.starArr = [];
    for(let i = 0; i < 5; i++){
      let star = this.add.image(70 + (i * 70), 70, 'star-0').setOrigin(0.5, 0.5);
      star.setScale(0.6);
      this.starArr.push(star);
    }



  }

}
export default gameScene;
