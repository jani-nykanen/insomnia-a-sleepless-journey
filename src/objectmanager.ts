import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { Player } from "./player.js";
import { Stage } from "./stage.js";


export class ObjectManager {
    

    private player : Player;


    constructor(stage : Stage) {
        
        this.player = null;
    
        stage.parseObjects(this);
    }


    public createPlayer(x : number, y : number) {

        this.player = new Player(x+8, y+8);
    }


    public update(stage : Stage, camera : Camera, event : CoreEvent) {

        this.player.update(event);
        stage.objectCollisions(this.player, event);
    }


    public draw(canvas : Canvas) {

        this.player.draw(canvas);
    }
}
