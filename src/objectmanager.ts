import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";
import { Chest } from "./chest.js";
import { Coin } from "./coin.js";
import { CoreEvent } from "./core.js";
import { Enemy, getEnemyType } from "./enemy.js";
import { nextObject } from "./gameobject.js";
import { StrongInteractionTarget, WeakInteractionTarget } from "./interactiontarget.js";
import { Lever } from "./lever.js";
import { MessageBox } from "./messagebox.js";
import { NPC } from "./npc.js";
import { Player } from "./player.js";
import { ProgressManager } from "./progress.js";
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
    private weakInteractionTargets : Array<WeakInteractionTarget>;
    private strongInteractionTargets : Array<StrongInteractionTarget>;
    private enemies : Array<Enemy>;

    private readonly message : MessageBox;
    private readonly progress : ProgressManager;

    private projectileCb : SpawnProjectileCallback;


    constructor(stage : Stage, camera : Camera, message : MessageBox, progress : ProgressManager) {
        
        this.player = null;

        this.progress = progress;
    
        this.projectiles = new Array<Projectile> ();
        this.projectileCb = (x : number, y : number, 
            speedx : number, speedy : number, 
            getGravity : boolean, id : number,
            friendly : boolean) : void => {

            nextObject(this.projectiles, Projectile)
                .spawn(x, y, speedx, speedy, getGravity, id, friendly);
        };

        this.switches = new Array<Switch> ();
        this.weakInteractionTargets = new Array<WeakInteractionTarget> ();
        this.strongInteractionTargets = new Array<StrongInteractionTarget> ();
        this.enemies = new Array<Enemy> ();

        this.message = message;

        stage.parseObjects(this);

        camera.focusOnObject(this.player);
    }


    public createPlayer(x : number, y : number) {

        this.player = new Player(x*16+8, y*16+8, this.projectileCb, this.progress);
    }


    public addSwitch(x : number, y : number) {

        this.switches.push(new Switch(x*16+8, y*16+16));
    }


    public addCoin(x : number, y : number) {

        this.weakInteractionTargets.push(new Coin(x*16+8, y*16+8));
    }


    public addNPC(x : number, y : number, id : number) {

        this.strongInteractionTargets.push(new NPC(x*16+8, y*16+8, id, this.message));
    }


    public addChest(x : number, y : number, id : number) {

        this.strongInteractionTargets.push(new Chest(x*16+8, y*16+8, id, this.message));
    }


    public addLever(x : number, y : number) {

        this.strongInteractionTargets.push(new Lever(x*16+8, y*16+8, this.message));
    }


    public addEnemy(x : number, y : number, id : number) {

        this.enemies.push(new (getEnemyType(id)).prototype.constructor(x*16+8, y*16+8));
    }


    public cameraCheck(camera : Camera) {

        for (let s of this.switches) {

            s.cameraCheck(camera);
        }

        for (let w of this.weakInteractionTargets) {

            w.cameraCheck(camera);
        }

        for (let s of this.strongInteractionTargets) {

            s.cameraCheck(camera);
        }

        for (let e of this.enemies) {

            e.cameraCheck(camera);
        }
    }


    public resetSwitches(omit : Switch) {

        for (let s of this.switches) {

            if (s === omit) continue;

            s.reset();
        }
    }


    private updateInteractionTargets(arr : Array<WeakInteractionTarget>, camera : Camera, event : CoreEvent) {

        for (let c of arr) {

            c.cameraCheck(camera);
            c.update(event);
            c.playerCollision(this.player, event);
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
        stage.objectCollisions(this.player, camera, event);

        for (let p of this.projectiles) {

            p.cameraCheck(camera);
            if (p.doesExist() && p.isInCamera()) {

                p.update(event);
                stage.objectCollisions(p, camera, event);
            }
        } 

        for (let s of this.switches) {

            s.cameraCheck(camera);
            s.update(event);
            
            if (s.playerCollision(this.player, stage, event)) {

                this.resetSwitches(s);
            }
        }

        this.updateInteractionTargets(this.weakInteractionTargets, camera, event);
        this.updateInteractionTargets(this.strongInteractionTargets, camera, event);

        for (let e of this.enemies) {

            e.cameraCheck(camera);
            e.update(event);
            e.playerCollision(this.player, event);
            stage.objectCollisions(e, camera, event);

            if (e.doesExist() && !e.isDying() && e.isInCamera()) {
                
                for (let p of this.projectiles) {

                    e.projectileCollision(p, event);
                } 
            }
        }
    }


    public draw(canvas : Canvas) {

        for (let s of this.switches) {

            s.draw(canvas);
        }

        for (let w of this.weakInteractionTargets) {

            w.draw(canvas);
        }

        for (let s of this.strongInteractionTargets) {

            s.draw(canvas);
        }

        for (let e of this.enemies) {

            e.draw(canvas);
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
