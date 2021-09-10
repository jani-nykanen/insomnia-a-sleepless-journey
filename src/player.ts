import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { CollisionObject } from "./gameobject.js";
import { Sprite } from "./sprite.js";
import { State } from "./types.js";
import { Vector2 } from "./vector.js";



export class Player extends CollisionObject {


    private jumpMargin : number;
    private jumpTimer : number;
    private canJump : boolean;

    private flip : Flip;


    constructor(x : number, y : number) {

        super(x, y);

        this.spr = new Sprite(16, 16);

        this.hitbox = new Vector2(12, 12);
        this.center = new Vector2(0, 2);
        this.collisionBox = new Vector2(8, 10);

        this.friction = new Vector2(0.1, 0.15);
        this.offCameraRadius = 0;

        this.jumpTimer = 0;
        this.jumpMargin = 0;
        this.canJump = false;

        this.flip = Flip.None;

        this.inCamera = true;
    }


    private control(event : CoreEvent) {

        const BASE_GRAVITY = 4.0;
        const MOVE_SPEED = 1.0;
        const EPS = 0.01;
        const JUMP_TIME = 12;

        let stick = event.input.getStick();

        this.target.x = stick.x * MOVE_SPEED;
        this.target.y = BASE_GRAVITY;

        if (Math.abs(stick.x) > EPS) {

            this.flip = stick.x > 0 ? Flip.None : Flip.Horizontal;
        }

        let s = event.input.getAction("fire1");

        if (this.jumpTimer <= 0 &&
            this.jumpMargin > 0 &&
            s == State.Pressed) {

            this.jumpMargin = 0;
            this.jumpTimer = JUMP_TIME;

            this.canJump = false;
        }
        else if (this.jumpTimer > 0 && 
            (s & State.DownOrPressed) == 0) {

            this.jumpTimer = 0;
        }
    }


    private animate(event : CoreEvent) {

        const EPS = 0.01;
        const JUMP_EPS = 0.75;

        let animSpeed : number;
        let frame : number;

        if (this.canJump) {

            if (Math.abs(this.speed.x) < EPS) {

                this.spr.setFrame(0, 0);
            }
            else {

                animSpeed = 10 - Math.abs(this.speed.x) * 5;
                this.spr.animate(0, 1, 4, animSpeed | 0, event.step);
            }
        }
        else {

            frame = 1;
            if (this.speed.y < -JUMP_EPS)
                frame = 0;
            else if (this.speed.y > JUMP_EPS)
                frame = 2;

            this.spr.setFrame(frame, 1);
        }
    }


    private updateJump(event : CoreEvent) {

        const JUMP_SPEED = -2.0;

        if (this.jumpMargin > 0) {

            this.jumpMargin -= event.step;
        }

        if (this.jumpTimer > 0) {

            if (this.canJump) {

                this.jumpTimer = 0;
            }
            else {

                this.jumpTimer -= event.step;
                this.speed.y = JUMP_SPEED;
            }
        }
    }


    protected preMovementEvent(event : CoreEvent) {

        this.control(event);
        this.animate(event);
        this.updateJump(event);

        this.canJump = false;
    }


    public draw(canvas : Canvas) {

        if (!this.exist) return;

        let bmp = canvas.assets.getBitmap("player");

        let px = Math.round(this.pos.x - this.spr.width/2);
        let py = Math.round(this.pos.y - this.spr.height/2);

        canvas.drawSprite(this.spr, bmp, px, py, this.flip);
    }


    protected verticalCollisionEvent(dir : number, event : CoreEvent) {

        const JUMP_MARGIN = 15;

        if (dir == 1) {

            this.canJump = true;
            this.jumpMargin = JUMP_MARGIN;
        }
    }

}