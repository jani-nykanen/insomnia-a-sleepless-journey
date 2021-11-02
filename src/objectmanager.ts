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
import { TransitionEffectType } from "./transition.js";
import { HintBox } from "./hintbox.js";
import { HintTrigger } from "./hinttrigger.js";
import { INSIDE_THEME_VOLUME, playTheme, THEME_VOLUME } from "./game.js";
import { Orb } from "./orb.js";
import { Portal } from "./portal.js";
import { GiantChest } from "./giantchest.js";


export type SpawnProjectileCallback = 
    (x : number, y : number, 
    speedx : number, speedy : number, 
    getGravity : boolean, id : number,
    friendly : boolean) => void;

export type PortalCallback = (event : CoreEvent) => void;


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
    private enemies : Array<Enemy>;
    private doors : Array<Door>;
    
    // Refer to the weak interaction target array
    private stars : Array<Star>;
    private chests : Array<Chest>;
    private checkpoints : Array<SavePoint>;
    private hintTriggers : Array<HintTrigger>;
    private orbs : Array<Orb>;
    private lever : Lever;
    private portal : Portal;

    private readonly message : MessageBox;
    private readonly progress : ProgressManager;
    private readonly saveManager : SaveManager;
    private readonly hintbox : HintBox;

    private projectileCb : SpawnProjectileCallback;
    private portalCb : PortalCallback;


    constructor(stage : Stage, camera : Camera, message : MessageBox, 
        progress : ProgressManager, saveManager : SaveManager, hintbox : HintBox,
        event : CoreEvent, portalCb = <PortalCallback> (event => {})) {
        
        this.player = null;

        this.progress = progress;
        this.saveManager = saveManager;
        this.hintbox = hintbox;
    
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
        this.orbs = new Array<Orb> ();

        this.lever = null;
        this.portal = null;

        this.stars = new Array<Star> ();
        this.chests = new Array<Chest> ();
        this.checkpoints = new Array<SavePoint> ();
        this.hintTriggers = new Array<HintTrigger> ();

        this.message = message;

        this.portalCb = portalCb;

        stage.parseObjects(this, event);

        this.findDoorPairs();
        this.mergeDoorsToGeneralArray();

        camera.focusOnObject(this.player);

        this.passItemCountToOrbs();
    }


    private passItemCountToOrbs() {

        for (let o of this.orbs) {

            if (o.id == 0) {

                o.setItemCount(this.stars.length);
            }
            else if (o.id == 1) {

                o.setItemCount(this.enemies.length);
            }
        }
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
        // this.doors = null;
    }


    public createPlayer(x : number, y : number, inside = false, isFinalArea = false) {

        this.player = new Player(x*16+16, y*16+8, 
            this.projectileCb, this.progress, inside, isFinalArea);
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

        let o = new Chest(x*16+8, y*16+8, id, this.message, this.hintbox);
        this.strongInteractionTargets.push(o);
        this.chests.push(o);
    }


    public addLever(x : number, y : number) {

        this.lever = new Lever(x*16+8, y*16+8, this.message);
        this.strongInteractionTargets.push(this.lever);
    }


    public addDoor(x : number, y : number, id : number, inside : boolean) {
        
        this.doors.push(new Door(x*16+8, y*16+8, id, inside, this.message));
    }


    public addSavepoint(x : number, y : number, id : number) {

        let o = new SavePoint(x*16+8, y*16+8, id, 
            this.message, this.saveManager);
        this.strongInteractionTargets.push(o);
        this.checkpoints.push(o);
    }


    public addOrb(x : number, y : number, id : number) {

        let o = new Orb(x*16+8, y*16+8, id, this.message, this.progress);
        this.strongInteractionTargets.push(o);
        this.orbs.push(o);
    }


    public addPortal(x : number, y : number) {

        this.portal = new Portal((x+1)*16, y*16+8, this.message, this.progress, this.portalCb);
        this.strongInteractionTargets.push(this.portal);
    }


    public addGiantChest(x : number, y : number) {

        this.strongInteractionTargets.push(
            new GiantChest(x*16, y*16 + 8, this.message));
    }


    public addEnemy(x : number, y : number, id : number) {

        let e = <Enemy> (new (getEnemyType(id))
            .prototype
            .constructor(x*16+8, y*16+8, this.enemies.length));
        e.setProjectileCallback(this.projectileCb);

        this.enemies.push(e);
    }


    public addHintTrigger(x : number, y : number, id : number, event : CoreEvent) {

        let o = new HintTrigger(x*16, y*16, id, this.hintbox, event);
        this.weakInteractionTargets.push(o);
        this.hintTriggers.push(o);
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


    private reset(camera : Camera) {

        this.player.respawn();
        camera.focusOnObject(this.player);

        for (let e of this.enemies) {

            e.respawn();
        }
    }


    public update(stage : Stage, camera : Camera, event : CoreEvent) {

        if (camera.isMoving()) {

            this.cameraCheck(camera);
            this.player.cameraMovement(camera, event);
            return;
        }

        let p : Vector2;
        if (!this.player.doesExist()) {

            p = this.player.getPos();

            event.transition.activate(true, TransitionEffectType.CirleIn,
                1.0/30.0, event => {

                    this.reset(camera);

                    let p = this.player.getPos();
                    event.transition.setCenter(new Vector2(p.x % camera.width, p.y % camera.height));

                    playTheme(event, this.isPlayerInside(), this.player.isInFinalArea);
                })
                .setCenter(new Vector2(p.x % camera.width, p.y % camera.height));
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
            
                this.player.projectileCollision(p, event);
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
            e.cameraEvent(camera);

            e.update(event);
            stage.objectCollisions(e, camera, event);
            e.playerCollision(this.player, event);

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

        for (let o of this.strongInteractionTargets) {

            o.postDraw(canvas);
        }
    }


    public checkLoop(stage : Stage) {

        this.player.checkLoop(stage);
    }


    public reinitializeObjectsByProgress(camera : Camera) {

        for (let e of this.enemies) {

            if (this.progress.doesValueExistInArray("enemiesKilled", e.entityID)) {

                e.makeGhost();
            }
        }

        for (let s of this.stars) {

            if (this.progress.doesValueExistInArray("starsCollected", s.entityID)) {

                s.forceKill();
            }
        }

        for (let c of this.chests) {

            if (this.progress.doesValueExistInArray("items", c.id)) {

                c.forceOpen();
            }
        }

        for (let d of this.doors) {

            if (this.progress.doesValueExistInArray("doors", d.id)) {

                d.forceOpen();
            }
        }

        this.player.maximizeHealth();

        let chID = this.progress.getNumberProperty("checkpoint", -1);
        if (chID >= 0) {

            for (let c of this.checkpoints) {

                if (c.id == chID) {

                    c.activate();

                    this.player.teleportTo(
                        Vector2.add(c.getPos(), new Vector2(0, 1)), 
                        false, false);
                    this.player.setActiveCheckpointReference(c);

                    camera.focusOnObject(this.player);
                    
                    break;
                }
            }

            for (let h of this.hintTriggers) {

                h.forceKill();
            }
        }

        for (let o of this.orbs) {

            if (this.progress.doesValueExistInArray("orbsDestroyed", o.id)) {

                o.breakSeal();
            }
        }

        if (this.lever != null &&
            this.progress.getBooleanProperty("fansEnabled")) {
        
            this.lever.enable();
        } 

        if (this.portal != null) {
            
            this.portal.setInteractionState();
        }
    }


    public debugDestroyObjects() {

        for (let e of this.enemies) {

            e.forceKill();
        }

        for (let s of this.stars) {

            s.forceKill();
        }
    }


    public killPlayer(event : CoreEvent) {

        this.player.startDeath(event);
    }


    public isPlayerInside = () : boolean => this.player.isInside();
    public getPlayerHealth = () : number => this.player.getHealth();
    public getPlayerMaxHealth = () : number => this.player.maxHealth();


    public hasStarInArea = 
        (dx : number, dy : number, 
        width : number, height : number) : boolean => 
        objectInArea(this.stars, dx, dy, width, height);


    public hasEnemyInArea(dx : number, dy : number, 
        width : number, height : number) : boolean {

        let p : Vector2;

        for (let a of this.enemies) {

            if (!a.doesExist() || a.isDying() || a.isGhost()) 
                continue;

            p = a.getPos();
            if (p.x >= dx && p.y >= dy && p.x <= dx + width && p.y <= dy + height)
                return true;
        }
        return false;
    }


    public getEnemyCount = () : number => this.enemies.length;
    public getStarCount = () : number => this.stars.length;
}
