export class Robot extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'robot');
        this.scene = scene;
        this.setOrigin(0.5, 0.5);
   //   this.setScale(0.05);
        this.scene.physics.world.enable(this);
        this.scene.add.existing(this);
        this.visited = false;

    }

    preUpdate(){
        if(this.y < 200){
            //this.visible = false;
        }

        // if(this.visited){
        //     this.destroy();
        // }

        if(this.y >= 1048){
            console.log("destroy robot");
            this.body.enable = false;
            this.destroy();
        }

        // console.log(this.y);
    }
}