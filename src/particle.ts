import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { ExistingObject, WeakGameObject } from "./gameobject.js";
import { Sprite } from "./sprite.js";
import { Vector2 } from "./vector.js";


export class Particle extends WeakGameObject {

    private speed : Vector2;
    private gravity : number;


    constructor() {

        super(0, 0, false);

        this.pos = new Vector2();
        this.speed = new Vector2();
        this.gravity = 0;

        this.spr = new Sprite(16, 16);
    }


    public spawn(x : number, y : number, speed : Vector2, gravity = 0, id = 0) {

        this.pos = new Vector2(x, y);
        this.speed = speed.clone();
        this.gravity = gravity;

        this.spr = new Sprite(16, 16);
        this.spr.setFrame((Math.random() * 4) | 0, id);

        this.dying = false;
        this.exist = true;

        this.inCamera = true;
    }


    public updateLogic(event : CoreEvent) {

        const MAX_GRAVITY = 4.0;

        this.speed.y += this.gravity * event.step;
        if (this.speed.y > MAX_GRAVITY)
            this.speed.y = MAX_GRAVITY;

        this.pos.x += this.speed.x * event.step;
        this.pos.y += this.speed.y * event.step;
    }


    public outsideCameraEvent() {

        this.exist = false;
    }


    public draw(canvas : Canvas) {

        if (!this.exist) return;

        canvas.drawSprite(this.spr,
            canvas.assets.getBitmap("particles"), 
            Math.round(this.pos.x) - 8,
            Math.round(this.pos.y) - 8);
    }

}
