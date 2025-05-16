export class MenuScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'MenuScene'
        });
    }

    create(){

        let bg = this.add.image(this.sys.canvas.width / 2, this.sys.canvas.height / 2, "menu-bg");
        bg.displayHeight = this.sys.canvas.height;
        bg.displayWidth = this.sys.canvas.width;

        let btn = this.add.image(this.sys.canvas.width / 2, this.sys.canvas.height + 100, "playBtn").setInteractive({cursor: "pointer"})
        .on("pointerup", ()=>{
            this.scene.start("gameScene");
        });

        this.tweens.add({
            targets: btn,
            y: this.sys.canvas.height / 2 + 100,
            duration: 500,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.tweens.add({
                    targets: btn,
                    scale: 1.025,
                    duration: 500,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                });
            }
        });





        // this.add.rectangle(getCenterX(this), getCenterY(this) + 30, 200, 150, 0x000000, 0.001).setInteractive({cursor: "pointer"})
        // .on("pointerup", ()=>{
        //     this.scene.start("gameScene");
        // })
    }
}