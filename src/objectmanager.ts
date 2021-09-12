import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { nextObject } from "./gameobject.js";
import { Player } from "./player.js";
import { Projectile } from "./projectile.js";
import { Stage } from "./stage.js";


export type SpawnProjectileCallback = 
    (x : number, y : number, 
    speedx : number, speedy : number, 
    getGravity : boolean, id : number,
    friendly : boolean) => void;


export class ObjectManager {
    

    private projectiles : Array<Projectile>;
    private player : Player;

    private projectileCb : SpawnProjectileCallback;


    constructor(stage : Stage, camera : Camera) {
        
        this.player = null;
    
        this.projectiles = new Array<Projectile> ();
        this.projectileCb = (x : number, y : number, 
            speedx : number, speedy : number, 
            getGravity : boolean, id : number,
            friendly : boolean) : void => {

            nextObject(this.projectiles, Projectile)
                .spawn(x, y, speedx, speedy, getGravity, id, friendly);
        };

        stage.parseObjects(this);

        camera.focusOnObject(this.player);
    }


    public createPlayer(x : number, y : number) {

        this.player = new Player(x+8, y+8, this.projectileCb);
    }


    public update(stage : Stage, camera : Camera, event : CoreEvent) {

        if (camera.isMoving()) {

            this.player.cameraMovement(camera, event);
            return;
        }

        this.player.update(event);
        this.player.cameraEvent(camera);
        stage.objectCollisions(this.player, event);

        for (let p of this.projectiles) {

            p.cameraCheck(camera);
            if (p.doesExist() && p.isInCamera()) {

                p.update(event);
                stage.objectCollisions(p, event);
            }
        } 
    }


    public draw(canvas : Canvas) {

        this.player.preDraw(canvas);
        this.player.draw(canvas);

        for (let p of this.projectiles) {

            p.draw(canvas);
        }
    }
}
