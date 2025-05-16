class bootScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'bootScene'
        });
    }
    preload() {
      const progress = this.add.graphics();

        // Register a load progress event to show a load bar
        this.load.on('progress', (value) => {
            progress.clear();
            progress.fillStyle(0xffffff, 1);
            progress.fillRect(0, this.sys.game.config.height / 2, this.sys.game.config.width * value, 60);
        });

        // Register a load complete event to launch the title screen when all files are loaded
        this.load.on('complete', () => {
            // prepare all animations, defined in a separate file
            progress.destroy();
            this.scene.start('MenuScene');
        });


        this.load.image("bg", "./assets/bg.png");
        this.load.image("car", './assets/carSingle.png');
        this.load.image("billboard", './assets/billboard.png');
        this.load.image("robot", './assets/images/robot.png');
        this.load.image("robot-msg", './assets/images/robot-panel.png');
        this.load.image("star-msg", './assets/images/star-panel.png');
        this.load.image("win-msg", './assets/images/win-msg.png');
        this.load.image("lose-msg", './assets/images/loss-msg.png');
        this.load.image("fuel-meter", './assets/images/fuel-meter.png');
        this.load.image("speedometer-needle", './assets/images/speedometer-needle.png');
        this.load.image("star", './assets/images/star.png');
        this.load.image("star-0", './assets/images/star-0.png');
        this.load.image("star-1", './assets/images/star-1.png');
        this.load.image("school", './assets/images/school.png');
        this.load.image("loss_bg", './assets/images/loss_bg.png');
        this.load.image("menu-bg", './assets/images/menu-bg.png');
        this.load.image("playBtn", './assets/images/playBtn.png');


    }
}

export default bootScene;
