import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { Sprite } from "./sprite.js";
import { Rect, Vector2 } from "./vector.js";


export const updateSpeedAxis = (speed : number, target : number, step : number) : number => {
		
    if (speed < target) {
        
        return Math.min(target, speed+step);
    }
    return Math.max(target, speed-step);
}


export const boxOverlay = (pos : Vector2, center : Vector2, hitbox : Vector2, 
    x : number, y : number, w : number, h : number) : boolean => {

    let px = pos.x + center.x - hitbox.x/2;
    let py = pos.y + center.y - hitbox.y/2;

    return px + hitbox.x >= x && px < x+w &&
           py + hitbox.y >= y && py < y+h;
}


export const boxOverlayRect = (rect : Rect, 
    x : number, y : number, w : number, h : number) : boolean => {

    return boxOverlay(
        new Vector2(rect.x, rect.y), 
        new Vector2(), 
        new Vector2(rect.w, rect.h), 
        x, y, w, h);
}


export abstract class ExistingObject {

    
    protected exist : boolean;
    

    constructor(exist = true) {

        this.exist = exist;
    }


    public kill() {

        this.exist = false;
    }


    public doesExist = () : boolean => this.exist;
}


export function nextObject<T extends ExistingObject> (arr : Array<T>, type : Function) {

    let o : T;

    o = null;
    for (let a of arr) {

        if (!a.doesExist()) {

            o = a;
            break;
        }
    }

    if (o == null) {

        o = new type.prototype.constructor();
        arr.push(o);
    }
    return o;
}


export abstract class WeakGameObject extends ExistingObject {


    protected pos : Vector2;
    protected oldPos : Vector2;
    protected center : Vector2;

    protected hitbox : Vector2;

    protected dying : boolean;
    protected inCamera : boolean;
    protected offCameraRadius : number;

    protected spr : Sprite;


    constructor(x : number, y : number, exist = true) {

        super(exist);

        this.pos = new Vector2(x, y);
        this.oldPos = this.pos.clone();
        this.center = new Vector2();

        this.hitbox = new Vector2();

        this.dying = false;
        this.inCamera = false;
        this.offCameraRadius = 0;

        this.spr = new Sprite(0, 0);
    }


    protected die (event : CoreEvent) : boolean {

        return true;
    }


    protected updateLogic(event : CoreEvent) {};
    protected outsideCameraEvent() {}


    public update(event : CoreEvent) {

        if (!this.exist || !this.inCamera) return;

        if (this.dying) {

            if (this.die(event)) {

                this.exist = false;
                this.dying = false;
            }
            return;
        }

        this.oldPos = this.pos.clone();

        this.updateLogic(event);
    }


    public cameraCheck(camera : Camera) {

        let pos = camera.getPosition();

        let checkbox = new Vector2(
            this.spr.width + this.offCameraRadius*2, 
            this.spr.height + this.offCameraRadius*2);

        let oldState = this.inCamera;
        this.inCamera = boxOverlay(
            this.pos, this.center, checkbox,
            pos.x, pos.y, camera.width, camera.height);

        if (oldState && !this.inCamera) {

            this.outsideCameraEvent();
        }
    }


    public overlayObject = (o : WeakGameObject) : boolean =>
        boxOverlay(this.pos, this.center, this.hitbox,
            o.pos.x + o.center.x - o.hitbox.x/2,
            o.pos.y + o.center.y - o.hitbox.y/2,
            o.hitbox.x, o.hitbox.y);

    public overlayObjectSpecialHitbox = (o : WeakGameObject, newCenter : Vector2, newHitbox : Vector2) : boolean =>
        boxOverlay(this.pos, this.center, this.hitbox,
            o.pos.x + newCenter.x - newHitbox.x/2,
            o.pos.y + newCenter.y - newHitbox.y/2,
            newHitbox.x, newHitbox.y);


    public forceKill() {

        this.exist = false;
        this.dying = false;
    }
    

    public draw(canvas : Canvas) {}
    public postDraw(canvas : Canvas) {}

    
    public getPos = () => this.pos.clone();
    public getHitbox = () : Vector2 => this.hitbox.clone();
    public isInCamera = () => this.inCamera;
    public isDying = () => this.dying;

}


export abstract class GameObject extends WeakGameObject {
    

    protected oldPos : Vector2;
    protected speed : Vector2;
    protected target : Vector2;
    protected friction : Vector2;


    constructor(x : number, y : number, exist = true) {

        super(x, y, exist);

        this.speed = new Vector2();
        this.target = this.speed.clone();
        this.friction = new Vector2(1, 1);
    }


    protected preMovementEvent(event : CoreEvent) {}
    protected postMovementEvent(event : CoreEvent) {}


    protected updateMovement(event : CoreEvent) {

        this.speed.x = updateSpeedAxis(this.speed.x,
            this.target.x, this.friction.x*event.step);
        this.speed.y = updateSpeedAxis(this.speed.y,
            this.target.y, this.friction.y*event.step);

        this.pos.x += this.speed.x * event.step;
        this.pos.y += this.speed.y * event.step;
    }


    protected updateLogic(event : CoreEvent) {

        this.preMovementEvent(event);
        this.updateMovement(event);
        this.postMovementEvent(event);
    }


    public stopMovement() {

        this.speed.zeros();
        this.target.zeros();
    }


    public getSpeed = () : Vector2 => this.speed.clone();
    public getTarget = () : Vector2 => this.target.clone();
}


export abstract class CollisionObject extends GameObject {


    protected collisionBox : Vector2;
    protected disableCollisions : boolean;
    protected takeCameraBorderCollision : boolean;

    protected ignoreFenceCollisions : boolean;


    constructor(x : number, y : number, exist = true) {

        super(x, y, exist);

        this.collisionBox = new Vector2();
        this.disableCollisions = false;
        this.ignoreFenceCollisions = false;
        this.takeCameraBorderCollision = true;
    }


    protected wallCollisionEvent(dir : number, event : CoreEvent) {}
    protected verticalCollisionEvent(dir : number, event : CoreEvent) {}


    public wallCollision(
        x : number, y : number, h : number, 
        dir : number, event : CoreEvent, force = false) {

        const EPS = 0.001;
        const V_MARGIN = 1;
        const NEAR_MARGIN = 1;
        const FAR_MARGIN = 4;
        
        if (!this.inCamera ||
            (!force && this.disableCollisions) ||
            !this.exist || this.dying || 
            this.speed.x * dir < EPS) 
            return false;

        let top = this.pos.y + this.center.y - this.collisionBox.y/2;
        let bottom = top + this.collisionBox.y;

        if (bottom <= y + V_MARGIN || top >= y + h - V_MARGIN)
            return false;

        let xoff = this.center.x + this.collisionBox.x/2 * dir;
        let nearOld = this.oldPos.x + xoff
        let nearNew = this.pos.x + xoff;

        if ((dir > 0 && nearNew >= x - NEAR_MARGIN*event.step &&
             nearOld <= x + (FAR_MARGIN + this.speed.x)*event.step) || 
             (dir < 0 && nearNew <= x + NEAR_MARGIN*event.step &&
             nearOld >= x - (FAR_MARGIN - this.speed.x)*event.step)) {

            this.pos.x = x - xoff;
            this.speed.x = 0;

            this.wallCollisionEvent(dir, event);

            return true;
        }

        return false;
    }     


    public verticalCollision(x : number, y: number, w : number,
        dir : number, event : CoreEvent, force = false) : boolean {

        const EPS = 0.001;
        const NEAR_MARGIN = 1;
        const FAR_MARGIN = 4;
        const H_MARGIN = 1;

        if (!this.inCamera ||
            (!force && this.disableCollisions) ||
            !this.exist || this.dying ||
            this.speed.y * dir < EPS)
            return false;

        if (this.pos.x + this.collisionBox.x/2 < x + H_MARGIN || 
            this.pos.x - this.collisionBox.x/2 >= x + w - H_MARGIN)
            return false;

        let py = this.pos.y + this.center.y + dir * this.collisionBox.y/2;

        if ((dir > 0 && py > y - NEAR_MARGIN * event.step && 
            py <= y + (this.speed.y + FAR_MARGIN) * event.step) || 
            (dir < 0 && py < y + NEAR_MARGIN * event.step && 
            py >= y + (this.speed.y - FAR_MARGIN) * event.step) ) {

            this.pos.y = y - this.center.y - dir*this.collisionBox.y/2;
            this.speed.y = 0;

            this.verticalCollisionEvent(dir, event);

            return true;
        }
    
        return false;
    }


    public hurtCollision(x : number, y : number, 
        w : number, h : number, dir : number,
        event : CoreEvent) : boolean {

        return false;
    }


    public ladderCollision(x : number, y : number, w : number, h : number, 
        ladderTop : boolean, event : CoreEvent) : boolean {

        return false;
    }


    public breakCollision(x : number, y : number, 
        w : number, h : number, 
        level : number, event : CoreEvent) : boolean {

        return false;
    }


    public windCollision(x : number, y : number, w : number, h : number, 
        event : CoreEvent) : boolean {

        return false;
    }


    public waterCollision(x : number, y : number, w : number, h : number, 
        top : boolean, event : CoreEvent) : boolean {

        return false;
    }


    public getCollisionBox = () : Vector2 => this.collisionBox.clone();
    public doesIgnoreFenceCollisions = () : boolean => this.ignoreFenceCollisions;
    public doesTakeCameraBorderCollision = () : boolean => this.takeCameraBorderCollision;
}

