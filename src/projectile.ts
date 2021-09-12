import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { CollisionObject } from "./gameobject.js";
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

        this.hitbox = new Vector2(4, 4);
        this.collisionBox = new Vector2(2, 2);

        this.friction = new Vector2(0.1, 0.1);
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

        this.spr.setFrame(id, 0);
        this.id = id;

        this.exist = true;
        this.dying = false;
    }


    private killSelf(event : CoreEvent) {

        this.dying = true;

        this.spr.setFrame(0, 1);

        this.stopMovement();
    }


    protected die(event : CoreEvent) : boolean {

        const DIE_SPEED = 4;

        this.spr.animate(1, 0, 4, DIE_SPEED, event.step);

        return this.spr.getColumn() == 4;
    }


    public outsideCameraEvent() {

        this.exist = false;
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
        
        this.killSelf(event);
    }


    protected verticalCollisionEvent(dir : number, event : CoreEvent) {

        this.killSelf(event);
    }


    public isFriendly = () : boolean => this.friendly;
}
