import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { nextObject } from "./gameobject.js";
import { Player } from "./player.js";
import { Projectile } from "./projectile.js";
import { Stage } from "./stage.js";
import { Switch } from "./switch.js";


export type SpawnProjectileCallback = 
    (x : number, y : number, 
    speedx : number, speedy : number, 
    getGravity : boolean, id : number,
    friendly : boolean) => void;


export class ObjectManager {
    

    private projectiles : Array<Projectile>;
    private player : Player;
    private switches : Array<Switch>;

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

        this.switches = new Array<Switch> ();

        stage.parseObjects(this);

        camera.focusOnObject(this.player);
    }


    public createPlayer(x : number, y : number) {

        this.player = new Player(x+8, y+8, this.projectileCb);
    }


    public addSwitch(x : number, y : number) {

        this.switches.push(new Switch(x+8, y+16));
    }


    public cameraCheck(camera : Camera) {

        for (let s of this.switches) {

            s.cameraCheck(camera);
        }
    }


    public resetSwitches(omit : Switch) {

        for (let s of this.switches) {

            if (s === omit) continue;

            s.reset();
        }
    }


    public update(stage : Stage, camera : Camera, event : CoreEvent) {

        if (camera.isMoving()) {

            this.cameraCheck(camera);
            this.player.cameraMovement(camera, event);
            return;
        }

        this.player.update(event);
        this.player.cameraEvent(camera, event);
        stage.objectCollisions(this.player, event);

        for (let p of this.projectiles) {

            p.cameraCheck(camera);
            if (p.doesExist() && p.isInCamera()) {

                p.update(event);
                stage.objectCollisions(p, event);
            }
        } 

        for (let s of this.switches) {

            s.cameraCheck(camera);
            s.update(event);
            
            if (s.playerCollision(this.player, stage, event)) {

                this.resetSwitches(s);
            }
        }
    }


    public draw(canvas : Canvas) {

        for (let s of this.switches) {

            s.draw(canvas);
        }

        this.player.preDraw(canvas);
        this.player.draw(canvas);

        for (let p of this.projectiles) {

            p.draw(canvas);
        }
    }


    public checkLoop(stage : Stage) {

        this.player.checkLoop(stage);
    }
}
