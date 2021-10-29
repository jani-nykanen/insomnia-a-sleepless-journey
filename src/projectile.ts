import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { boxOverlay, CollisionObject } from "./gameobject.js";
import { Sprite } from "./sprite.js";
import { Vector2 } from "./vector.js";



export class Projectile extends CollisionObject {


    private id : number;
    private friendly : boolean;


    constructor() {

        super(0, 0, false);

        this.id = 0;
        this.friendly = false;
        this.spr = new Sprite(16, 16);

        this.hitbox = new Vector2(10, 10);
        this.collisionBox = new Vector2(2, 2);

        this.friction = new Vector2(0.1, 0.1);

        this.takeCameraBorderCollision = false;
        this.ignoreFenceCollisions = true;
    }


    public spawn(x : number, y : number, 
        speedx : number, speedy : number, 
        getGravity : boolean, id : number,
        friendly = true) {

        const BASE_GRAVITY = 2.0;

        this.pos = new Vector2(x, y);
        this.speed = new Vector2(speedx, speedy);

        this.target.x = this.speed.x;
        this.target.y = getGravity ? BASE_GRAVITY : this.speed.y;

        this.friendly = friendly;

        this.spr.setFrame(id*2, 0);
        this.id = id;

        this.exist = true;
        this.dying = false;
        
        let d = this.friendly ? 10 : 0;
        this.hitbox.x = d;
        this.hitbox.y = d;
    }


    protected die(event : CoreEvent) : boolean {

        const DIE_SPEED = 4;

        this.spr.animate(this.id*2 + 1, 0, 4, DIE_SPEED, event.step);

        return this.spr.getColumn() == 4;
    }


    public destroy(event : CoreEvent) {

        this.dying = true;

        this.spr.setFrame(0, 1);

        this.stopMovement();

        event.audio.playSample(event.assets.getSample("hit"), 0.60);
    }


    public outsideCameraEvent() {

        this.exist = false;
        this.dying = false;
    }


    protected preMovementEvent(event : CoreEvent) {

        const ANIM_SPEED = 4;

        if (this.id == 1) {

            this.spr.animate(2, 0, 2, ANIM_SPEED, event.step);
        }
    }


    public draw(canvas : Canvas) {

        if (!this.exist) return;

        let px = Math.round(this.pos.x - this.spr.width/2);
        let py = Math.round(this.pos.y - this.spr.height/2);

        canvas.drawSprite(this.spr, 
            canvas.assets.getBitmap("projectile"),
            px, py);
    }


    protected wallCollisionEvent(dir : number, event : CoreEvent) {
        
        this.destroy(event);
    }


    protected verticalCollisionEvent(dir : number, event : CoreEvent) {

        this.destroy(event);
    }


    public breakCollision(x : number, y : number, w : number, h : number, 
        level : number, event : CoreEvent) : boolean {

        if (!this.exist || this.dying) return false;

        if (level == 0)
            return false;

        if (boxOverlay(this.pos, this.center, new Vector2(8, 8), x, y, w, h)) {

            this.destroy(event);
            return true;
        }
        return false;
    }


    public isFriendly = () : boolean => this.friendly;
}
