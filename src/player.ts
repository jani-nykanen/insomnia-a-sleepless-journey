import { Camera } from "./camera.js";
import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { Dust } from "./dust.js";
import { CollisionObject, nextObject } from "./gameobject.js";
import { Sprite } from "./sprite.js";
import { State } from "./types.js";
import { Vector2 } from "./vector.js";



export class Player extends CollisionObject {


    private jumpMargin : number;
    private jumpTimer : number;
    private canJump : boolean;
    private jumpSpeed : number;

    private faceDir : number;
    private flip : Flip;

    private dust : Array<Dust>;
    private dustTimer : number;

    private running : boolean;


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
        this.jumpSpeed = 0.0;

        this.faceDir = 1;
        this.flip = Flip.None;

        this.inCamera = true;

        this.dust = new Array<Dust> ();
        this.dustTimer = 0;
    }


    private control(event : CoreEvent) {

        const BASE_GRAVITY = 4.0;
        const MOVE_SPEED = 0.75;
        const EPS = 0.01;
        const JUMP_TIME = 12;
        const BASE_JUMP_SPEED = 2.0;
        const BASE_JUMP_MOD = 0.25;
        const RUN_MOD = 1.66667;

        let stick = event.input.getStick();

        this.target.x = stick.x * MOVE_SPEED;
        this.target.y = BASE_GRAVITY;

        if (Math.abs(stick.x) > EPS) {

            this.flip = stick.x > 0 ? Flip.None : Flip.Horizontal;
            this.faceDir = stick.x > 0 ? 1 : -1;
        }

        let s = event.input.getAction("fire2");

        if (this.jumpTimer <= 0 &&
            this.jumpMargin > 0 &&
            s == State.Pressed) {

            this.jumpMargin = 0;
            this.jumpTimer = JUMP_TIME;

            this.jumpSpeed = BASE_JUMP_SPEED + Math.abs(this.speed.x) * BASE_JUMP_MOD;

            this.canJump = false;
        }
        else if (this.jumpTimer > 0 && 
            (s & State.DownOrPressed) == 0) {

            this.jumpTimer = 0;
        }

        this.running = Math.abs(this.target.x) > EPS &&
            ((event.input.getAction("fire1") & State.DownOrPressed) == 1);
        if (this.running) {

            this.target.x *= RUN_MOD;
        }
    }


    private animate(event : CoreEvent) {

        const EPS = 0.01;
        const JUMP_EPS = 0.75;

        let animSpeed : number;
        let frame : number;
        let row : number;

        if (this.canJump) {

            if (Math.abs(this.speed.x) < EPS) {

                this.spr.setFrame(0, 0);
            }
            else {

                row = this.running ? 1 : 0;

                animSpeed = 10 - Math.abs(this.speed.x) * 5;
                this.spr.animate(row, 1, 4, animSpeed | 0, event.step);
            }
        }
        else {

            frame = 1;
            if (this.speed.y < -JUMP_EPS)
                frame = 0;
            else if (this.speed.y > JUMP_EPS)
                frame = 2;

            this.spr.setFrame(frame, 2);
        }
    }


    private updateJump(event : CoreEvent) {


        if (this.jumpMargin > 0) {

            this.jumpMargin -= event.step;
        }

        if (this.jumpTimer > 0) {

            if (this.canJump) {

                this.jumpTimer = 0;
            }
            else {

                this.jumpTimer -= event.step;
                this.speed.y = -this.jumpSpeed;
            }
        }
    }


    private updateDust(event : CoreEvent) {

        const DUST_GEN_TIME_BASE = 10;
        const DUST_GEN_TIME_RUN = 7;
        const DUST_ANIM_SPEED = 8;
        const EPS = 0.01;

        let genTime = this.running ? DUST_GEN_TIME_RUN : DUST_GEN_TIME_BASE;

        for (let d of this.dust) {

            d.update(event);
        }

        if (!this.canJump || Math.abs(this.speed.x) <= EPS) return;

        if ((this.dustTimer += event.step) >= genTime) {

            nextObject(this.dust, Dust)
                .spawn(
                    this.pos.x - 2 * this.faceDir, 
                    this.pos.y + 6,
                    DUST_ANIM_SPEED);

            this.dustTimer -= genTime;
        }
    }


    protected preMovementEvent(event : CoreEvent) {

        this.control(event);
        this.animate(event);
        this.updateJump(event);
        this.updateDust(event);

        this.canJump = false;
    }


    public cameraMovement(camera : Camera, event : CoreEvent) {

        const MOVE_SPEED = 12;

        let actualSpeed = MOVE_SPEED * camera.getSpeed();
        let dir = camera.getDirection();

        this.pos.x += actualSpeed * dir.x * event.step;
        this.pos.y += actualSpeed * dir.y * event.step;

        this.animate(event);
    }


    public cameraEvent(camera : Camera) {

        const CAMERA_MOVE_SPEED = 1.0/20.0;
        const HIT_RANGE_X = 4;
        const HIT_RANGE_Y = 4; 

        let p = camera.getPosition();

        let x1 = p.x;
        let y1 = p.y;
        let x2 = p.x + camera.width;
        let y2 = p.y + camera.height;

        let dirx = 0;
        let diry = 0;

        if (this.pos.x - HIT_RANGE_X < x1) 
            dirx = -1;
        else if (this.pos.x + HIT_RANGE_X > x2)
            dirx = 1;
        else if (this.pos.y - HIT_RANGE_Y < y1) 
            diry = -1;
        else if (this.pos.y + HIT_RANGE_Y > y2)
            diry = 1;

        if (dirx != 0 || diry != 0) {

            camera.move(dirx, diry, CAMERA_MOVE_SPEED);
        }
    }


    public preDraw(canvas : Canvas) {

        for (let d of this.dust) {

            d.draw(canvas);
        }
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