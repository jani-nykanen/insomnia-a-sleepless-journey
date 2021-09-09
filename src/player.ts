import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { CollisionObject } from "./gameobject.js";
import { Sprite } from "./sprite.js";
import { Vector2 } from "./vector.js";



export class Player extends CollisionObject {


    protected flip : Flip;


    constructor(x : number, y : number) {

        super(x, y);

        this.spr = new Sprite(16, 16);

        this.hitbox = new Vector2(12, 12);
        this.center = new Vector2(0, 2);
        this.collisionBox = new Vector2(8, 10);

        this.friction = new Vector2(0.1, 0.1);
        this.offCameraRadius = 0;

        this.flip = Flip.None;

        this.inCamera = true;
    }


    private control(event : CoreEvent) {

        const BASE_GRAVITY = 2.0;

        this.target.y = BASE_GRAVITY;
    }


    protected preMovementEvent(event : CoreEvent) {

        this.control(event);
    }


    public draw(canvas : Canvas) {

        if (!this.exist) return;

        let bmp = canvas.assets.getBitmap("player");

        let px = Math.round(this.pos.x - this.spr.width/2);
        let py = Math.round(this.pos.y - this.spr.height/2);

        canvas.drawSprite(this.spr, bmp, px, py, this.flip);
    }

}