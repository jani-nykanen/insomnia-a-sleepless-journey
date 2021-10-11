import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";
import { Chest } from "./chest.js";
import { Star } from "./star.js";
import { CoreEvent } from "./core.js";
import { Door } from "./door.js";
import { Enemy, getEnemyType } from "./enemy.js";
import { nextObject, WeakGameObject } from "./gameobject.js";
import { StrongInteractionTarget, WeakInteractionTarget } from "./interactiontarget.js";
import { Lever } from "./lever.js";
import { MessageBox } from "./messagebox.js";
import { NPC } from "./npc.js";
import { Player } from "./player.js";
import { ProgressManager } from "./progress.js";
import { Projectile } from "./projectile.js";
import { Stage } from "./stage.js";
import { Switch } from "./switch.js";
import { Vector2 } from "./vector.js";
import { SavePoint } from "./savepoint.js";
import { SaveManager } from "./savemanager.js";


export type SpawnProjectileCallback = 
    (x : number, y : number, 
    speedx : number, speedy : number, 
    getGravity : boolean, id : number,
    friendly : boolean) => void;


const objectInArea = (arr : Array<WeakGameObject>,
    dx : number, dy : number, width : number, height : number) : boolean => {

    let p : Vector2;

    for (let a of arr) {

        if (!a.doesExist() || a.isDying()) 
            continue;

        p = a.getPos();
        if (p.x >= dx && p.y >= dy && p.x <= dx + width && p.y <= dy + height)
            return true;
    }
    
    return false;
}


export class ObjectManager {
    

    private projectiles : Array<Projectile>;
    private player : Player;
    private switches : Array<Switch>;
    private weakInteractionTargets : Array<WeakInteractionTarget>;
    private strongInteractionTargets : Array<StrongInteractionTarget>;
    private doors : Array<Door>;
    private enemies : Array<Enemy>;
    
    // Refer to the weak-i-t- array
    private stars : Array<Star>;
    private chests : Array<Chest>;

    private readonly message : MessageBox;
    private readonly progress : ProgressManager;
    private readonly saveManager : SaveManager;

    private projectileCb : SpawnProjectileCallback;


    constructor(stage : Stage, camera : Camera, message : MessageBox, 
        progress : ProgressManager, saveManager : SaveManager) {
        
        this.player = null;

        this.progress = progress;
        this.saveManager = saveManager;
    
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
        this.doors = new Array<Door> ();
        this.enemies = new Array<Enemy> ();

        this.stars = new Array<Star> ();
        this.chests = new Array<Chest> ();

        this.message = message;

        stage.parseObjects(this);

        this.findDoorPairs();
        this.mergeDoorsToGeneralArray();

        camera.focusOnObject(this.player);
    }


    private findDoorPairs() {

        for (let d of this.doors) {

            for (let d2 of this.doors) {

                if (d === d2) continue;

                if (d.inside != d2.inside &&
                    d.id == d2.id) {

                    d.markPair(d2);
                    d2.markPair(d);
                }
            }
        } 
    }


    private mergeDoorsToGeneralArray() {

        for (let d of this.doors) {

            this.strongInteractionTargets.push(d);
        }
        this.doors = null;
    }


    public createPlayer(x : number, y : number) {

        this.player = new Player(x*16+8, y*16+8, this.projectileCb, this.progress);
    }


    public addSwitch(x : number, y : number) {

        this.switches.push(new Switch(x*16+8, y*16+16));
    }


    public addStar(x : number, y : number) {

        let s = new Star(x*16+8, y*16+8, this.stars.length);
        this.weakInteractionTargets.push(s);
        this.stars.push(s);
    }


    public addNPC(x : number, y : number, id : number) {

        this.strongInteractionTargets.push(new NPC(x*16+8, y*16+8, id, this.message));
    }


    public addChest(x : number, y : number, id : number) {

        let o = new Chest(x*16+8, y*16+8, id, this.message);
        this.strongInteractionTargets.push(o);
        this.chests.push(o);
    }


    public addLever(x : number, y : number) {

        this.strongInteractionTargets.push(new Lever(x*16+8, y*16+8, this.message));
    }


    public addDoor(x : number, y : number, id : number, inside : boolean) {
        
        this.doors.push(new Door(x*16+8, y*16+8, id, inside, this.message));
    }


    public addSavepoint(x : number, y : number, id : number) {

        this.strongInteractionTargets.push(new SavePoint(x*16+8, y*16+8, id, 
            this.message, this.saveManager));
    }


    public addEnemy(x : number, y : number, id : number) {

        this.enemies.push(new (getEnemyType(id))
            .prototype
            .constructor(x*16+8, y*16+8, this.enemies.length));
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
            c.playerCollision(this.player, camera, event);
        }
    }


    public update(stage : Stage, camera : Camera, event : CoreEvent) {

        if (camera.isMoving()) {

            this.cameraCheck(camera);
            this.player.cameraMovement(camera, event);
            return;
        }

        this.player.stageEvent(stage, camera);
        this.player.update(event);
        this.player.cameraEvent(camera, stage, event);
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

                    e.projectileCollision(p, this.player, event);
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


    public reinitializeObjectsByProgress() {

        for (let k of this.enemies) {

            if (this.progress.doesValueExistInArray("enemiesKilled", k.entityID)) {

                k.kill();
            }
        }

        for (let s of this.stars) {

            if (this.progress.doesValueExistInArray("starsCollected", s.entityID)) {

                s.kill();
            }
        }

        for (let c of this.chests) {

            if (this.progress.doesValueExistInArray("items", c.id)) {

                c.forceOpen();
            }
        }

        this.player.maximizeHealth();
    }


    public isPlayerInside = () : boolean => this.player.isInside();
    public getPlayerHealth = () : number => this.player.getHealth();
    public getPlayerMaxHealth = () : number => this.player.maxHealth();


    public hasStarInArea = 
        (dx : number, dy : number, 
        width : number, height : number) : boolean => 
        objectInArea(this.stars, dx, dy, width, height);

    public hasEnemyInArea = 
        (dx : number, dy : number, 
        width : number, height : number) : boolean => 
        objectInArea(this.enemies, dx, dy, width, height);
}
