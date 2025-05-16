import bootScene from './scenes/bootScene.js';
import gameScene from './scenes/gameScene.js';
import { MenuScene } from './scenes/menuScene.js';
//import titleScene from './scenes/titleScene';

const config = {
    type: Phaser.WEBGL,
    backgroundColor: "#69cefd",
    parent: "phaser-runner",
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1920,
    height: 1080,
    pixelArt: true,
    antialias: false,
    physics:{
      default:'arcade',
      arcade:{
          gravity:{ y: 0},
          debug: false
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  //  roundPixels: true,
    scene: [
        bootScene,
        MenuScene,
        gameScene
    ]
};

const game = new Phaser.Game(config); // eslint-disable-line no-unused-vars
