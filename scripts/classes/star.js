export class Star extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'star');
        this.scene = scene;
        this.setOrigin(0.5, 0.5);
   //   this.setScale(0.05);
        this.scene.physics.world.enable(this);
        this.scene.add.existing(this);
        this.visited = false;
    }

    preUpdate(){
        if(this.y < 200){
           // this.visible = false;
            
        }

        // if(this.visited){
        //     this.destroy();
        // }

       // console.log(this.y);

        if(this.y >= 1080){
            console.log("destroy star");
            this.body.enable = false;
            this.destroy();

        }
    }
}