import { Camera } from "./camera.js";
import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { Dust } from "./dust.js";
import { boxOverlay, CollisionObject, nextObject } from "./gameobject.js";
import { negMod } from "./math.js";
import { SpawnProjectileCallback } from "./objectmanager.js";
import { ProgressManager } from "./progress.js";
import { Sprite } from "./sprite.js";
import { Stage } from "./stage.js";
import { State } from "./types.js";
import { Vector2 } from "./vector.js";


const BASE_JUMP_SPEED = 2.0;
const BASE_GRAVITY = 3.0;


export class Player extends CollisionObject {


    private jumpMargin : number;
    private jumpTimer : number;
    private canJump : boolean;
    private jumpSpeed : number;
    private doubleJump : boolean;
    private jumpReleased : boolean;

    private touchWater : boolean;

    private faceDir : number;
    private flip : Flip;

    private dust : Array<Dust>;
    private dustTimer : number;

    private running : boolean;

    private climbing : boolean;
    private touchLadder : boolean;
    private isLadderTop : boolean;
    private climbX : number;
    private climbFrame : number;

    private throwing : boolean;
    private canThrow : boolean;

    private sliding : boolean;
    private slideTimer : number;

    private downAttacking : boolean;
    private downAttackWaitTimer : number;

    private spinning : boolean;
    private spinCount : number;
    private canSpin : boolean;

    private invulnerabilityTimer : number;
    private knockbackTimer : number;

    private flapping : boolean;

    private showActionSymbol : boolean;
    private sprActionSymbol : Sprite;

    private holdingItem : boolean;
    private itemID : number;

    private inside : boolean;

    private health : number;

    private projectileCb : SpawnProjectileCallback;

    public readonly progress : ProgressManager;


    constructor(x : number, y : number, projectileCb : SpawnProjectileCallback,
        progress : ProgressManager) {

        super(x, y);

        this.spr = new Sprite(16, 16);

        this.hitbox = new Vector2(9, 11);
        this.center = new Vector2(0, 2);
        this.collisionBox = new Vector2(8, 12);

        this.friction = new Vector2(0.1, 0.15);
        this.offCameraRadius = 0;

        this.jumpTimer = 0;
        this.jumpMargin = 0;
        this.canJump = false;
        this.jumpSpeed = 0.0;
        this.doubleJump = false;
        this.jumpReleased = false;

        this.touchWater = false;

        this.faceDir = 1;
        this.flip = Flip.None;

        this.inCamera = true;

        this.dust = new Array<Dust> ();
        this.dustTimer = 0;
    
        this.climbX = 0;
        this.climbing = false;
        this.touchLadder = false;
        this.isLadderTop = false;

        this.throwing = false;
        this.canThrow = false;
        this.climbFrame = 0;

        this.sliding = false;
        this.slideTimer = 0;

        this.spinCount = 0;
        this.spinning = false;
        this.canSpin = false;

        this.downAttackWaitTimer = 0;
        this.downAttacking = false;

        this.invulnerabilityTimer = 0;
        this.knockbackTimer = 0;

        this.flapping = false;

        this.showActionSymbol = false;
        this.sprActionSymbol = new Sprite(16, 16);

        this.holdingItem = false;
        this.itemID = 0;

        this.inside = false;

        this.health = 3;

        this.projectileCb = projectileCb;

        this.progress = progress;
    }


    private startClimbing(event : CoreEvent) {

        if (!this.climbing &&
            this.touchLadder && 
            (!this.isLadderTop && event.input.upPress() || 
            (this.isLadderTop && event.input.downPress()))) {

            this.climbing = true;
            this.jumpTimer = 0;
            this.doubleJump = false;
            this.flapping = false;
            this.canSpin = true;
            this.spinning = false;

            this.pos.x = this.climbX;

            if (this.isLadderTop) {

                this.pos.y += 6;
            }
            this.stopMovement();
            this.jumpTimer = 0;
        }
    }


    private climb(event : CoreEvent) {

        const EPS = 0.1;
        const CLIMB_SPEED = 0.5;
        const CLIB_JUMP_TIME = 10;

        this.target.x = 0;

        let sx = event.input.getStick().x;
        if (Math.abs(sx) > EPS)
            this.faceDir = sx > 0 ? 1 : -1;
            
        this.flip = Flip.None;
        
        let s = event.input.getAction("fire2");

        if (!this.touchLadder) {

            this.climbing = false;
        }
        else {

            this.canThrow = true;  

            this.target.y = CLIMB_SPEED * event.input.getStick().y;
            if (s == State.Pressed) {

                this.climbing = false;
                this.doubleJump = false;
                this.jumpReleased = false;

                if (event.input.getStick().y < EPS) {

                    this.jumpTimer = CLIB_JUMP_TIME;
                }

                if (Math.abs(sx) > EPS)
                    this.faceDir = sx > 0 ? 1 : -1;
            }
        }
    }


    private throwRock(event : CoreEvent) : boolean {

        const ROCK_SPEED_X = 3.0;
        const ROCK_JUMP = -1.0;

        if (!this.progress.getBooleanProperty("item3"))
            return false;

        if (this.throwing) return true;

        if (!this.sliding &&
            this.canThrow &&
            event.input.getAction("fire4") == State.Pressed) {

            this.throwing = true;
            this.canThrow = false;

            this.flip = this.faceDir > 0 ? Flip.None : Flip.Horizontal;

            if (this.climbing) {

                this.climbFrame = this.spr.getColumn();
            }

            this.spr.setFrame(0, 3);

            this.stopMovement();
            this.jumpTimer = 0;

            this.projectileCb(
                this.pos.x + this.faceDir*6, this.pos.y-2,
                this.faceDir * ROCK_SPEED_X, ROCK_JUMP, true, 0, true);

            return true;
        }
        return false;
    }


    private computeCollisionBoxHeight() {

        const SLIDE_HITBOX_Y = 2.0;
        const BASE_HITBOX_Y = 10;

        this.collisionBox.y = this.sliding ? SLIDE_HITBOX_Y : BASE_HITBOX_Y;
        this.center.y = this.sliding ? 6 : 2;
    }


    private slide(event : CoreEvent) {

        const EPS = 0.25;
        const SLIDE_TIME = 20;
        const SLIDE_SPEED = 3.0;

        if (!this.progress.getBooleanProperty("item4"))
            return false;

        let s = event.input.getAction("fire2");

        if (this.sliding) {

            if ((this.slideTimer -= event.step) <= 0 ||
                (s & State.DownOrPressed) == 0) {

                this.sliding = false;
                return false;
            }
            return true;
        }

        if (!this.canJump) return false;

        if (event.input.getStick().y > EPS &&
            s == State.Pressed) {

            this.slideTimer = SLIDE_TIME;
            this.target.x = 0;
            this.speed.x = SLIDE_SPEED * this.faceDir;

            this.dustTimer = 0;

            this.sliding = true;

            this.computeCollisionBoxHeight();

            return true;
        }
        return false;
    }


    private waitDownAttack(event : CoreEvent) : boolean {

        if (this.downAttackWaitTimer > 0) {

            this.downAttackWaitTimer -= event.step;

            return this.downAttackWaitTimer > 0;
        }

        return this.downAttacking;
    }


    private jump(event : CoreEvent) {

        const DOWN_EPS = 0.25;

        const JUMP_TIME = 12;
        const DOUBLE_JUMP_TIME = 30;
        const BASE_JUMP_MOD = 0.25;
        const DOWN_ATTACK_JUMP = -1.5;
        const DOWN_ATTACK_GRAVITY = 6.0;

        const FLAP_GRAVITY = 0.5;

        let s = event.input.getAction("fire2");

        if (this.progress.getBooleanProperty("item1") &&
            !this.canJump && 
            event.input.getStick().y > DOWN_EPS &&
            s == State.Pressed) {

            this.downAttacking = true;
            this.downAttackWaitTimer = 0;

            this.stopMovement();

            this.speed.y = DOWN_ATTACK_JUMP;
            this.target.y = DOWN_ATTACK_GRAVITY;

            return;
        }

        if (this.jumpTimer <= 0 &&
            (this.jumpMargin > 0 || 
            (!this.doubleJump && this.progress.getBooleanProperty("item6"))) &&
            s == State.Pressed) {

            if (this.jumpMargin > 0) {

                this.jumpSpeed = BASE_JUMP_SPEED + Math.abs(this.speed.x) * BASE_JUMP_MOD;
                this.jumpMargin = 0;

                this.jumpTimer = JUMP_TIME;
            }
            else {

                this.jumpTimer = DOUBLE_JUMP_TIME;
                this.jumpSpeed = BASE_JUMP_SPEED;
                this.doubleJump = true;
            }
            this.canJump = false;
            this.jumpReleased = false;
        }
        else if (this.jumpTimer > 0 && 
            (s & State.DownOrPressed) == 0) {

            this.jumpTimer = 0;
        }

        if (!this.flapping &&
            !this.jumpReleased && 
            (s & State.DownOrPressed) == 0) {
            
            this.jumpReleased = true;
        }

        this.flapping = !this.canJump &&
            !this.spinning &&
            this.progress.getBooleanProperty("item5") &&
            this.jumpReleased &&
            this.jumpTimer <= 0 &&
            (!this.progress.getBooleanProperty("item6") || this.doubleJump) && 
            (s & State.DownOrPressed) == 1;
        if (this.flapping) {

            // this.speed.y = FLAP_GRAVITY;
            this.target.y = FLAP_GRAVITY;
            if (this.speed.y > this.target.y)
                this.speed.y = this.target.y;
        }
    }


    private spin(event : CoreEvent) : boolean {

        let s = event.input.getAction("fire3");
        if (this.spinning) {
            
            if (this.spinCount > 0 && (s & State.DownOrPressed) == 0) {

                this.spinning = false;
                return false;
            }

            return true;
        }

        if (!this.spinning && this.canSpin &&
            s == State.Pressed) {

            this.spinning = true;
            this.spinCount = 0;
            this.canSpin = false;

            // this.jumpReleased = false;
            this.flapping = false;

            this.spr.setFrame(0, 8);

            return true;
        }
        
        return false;
    }
 

    private control(event : CoreEvent) {

        const BASE_FRICTION_Y = 0.15;
        const MOVE_SPEED = 0.75;
        const RUN_MOD = 1.66667;
        const EPS = 0.01;
        const DOWN_ATTACK_FRICTION = 0.30;
        const SWIM_SPEED_REDUCTION_X = 0.5;
        const SWIM_SPEED_REDUCTION_Y = 0.25;

        let stick = event.input.getStick();

        this.computeCollisionBoxHeight();
        this.friction.y = this.downAttacking ? DOWN_ATTACK_FRICTION : BASE_FRICTION_Y;

        if (!this.spin(event)) {

            if (this.waitDownAttack(event) ||
                this.throwRock(event) ||
                this.slide(event)) {

                return;
            }
        }

        this.startClimbing(event);
        if (this.climbing) {

            this.climb(event);
            return;
        }

        this.target.x = stick.x * MOVE_SPEED;
        this.target.y = BASE_GRAVITY;

        if (Math.abs(stick.x) > EPS) {

            this.flip = stick.x > 0 ? Flip.None : Flip.Horizontal;
            this.faceDir = stick.x > 0 ? 1 : -1;
        }

        this.jump(event);

        this.running = this.progress.getBooleanProperty("item0") &&
            Math.abs(this.target.x) > EPS &&
            ((event.input.getAction("fire1") & State.DownOrPressed) == 1);
        if (this.running) {

            this.target.x *= RUN_MOD;
        }

        if (this.touchWater) {

            this.target.x *= SWIM_SPEED_REDUCTION_X;
            this.target.y *= SWIM_SPEED_REDUCTION_Y;
            this.friction.y *= SWIM_SPEED_REDUCTION_Y;
        }
    }


    private animate(event : CoreEvent) {

        const EPS = 0.01;
        const JUMP_EPS = 0.75;
        const RUN_SPEED_BASE = 10;
        const RUN_SPEED_MOD = 4;
        const CLIMB_SPEED = 10;
        const DOWN_ATTACK_SPEED = 4;
        const SPIN_SPEED = 2;
        const SPIN_MAX = 2;
        const SYMBOL_SPEED = 16;

        let animSpeed : number;
        let frame : number;
        let row : number;

        this.sprActionSymbol.animate(0, 0, 1, SYMBOL_SPEED, event.step);

        let oldFrame = this.spr.getColumn();
        if (this.spinning) {

            this.spr.animate(8, 0, 7, SPIN_SPEED, event.step);
            if (oldFrame > this.spr.getColumn()) {

                if ((++ this.spinCount) >= SPIN_MAX) {
                    
                    this.spinning = false;
                    this.spinCount = 0;
                }
            }
            if (this.spinning)
                return;
        }

        if (this.downAttacking) {

            this.spr.animate(5, 0, 3, DOWN_ATTACK_SPEED, event.step);
            return;
        }
        else if (this.downAttackWaitTimer > 0) {

            this.spr.setFrame(0, 5);
            return;
        }

        if (this.sliding) {

            this.spr.setFrame(0, 1);
            return;
        }

        if (this.throwing) {

            this.spr.animate(3, 0, 2, this.spr.getColumn() == 1 ? 12 : 6, event.step);
            if (this.spr.getColumn() == 2) {

                if (this.climbing)
                    this.spr.setFrame(this.climbFrame, 2);
                else
                    this.spr.setFrame(0, 0);
                
                this.throwing = false;
            }
            else {

                return;
            }
        }

        if (this.climbing) {

            if (Math.abs(this.speed.y) > EPS)
                this.spr.animate(2, 3, 4, CLIMB_SPEED, event.step);

            return;
        }

        if (this.canJump) {

            if (Math.abs(this.speed.x) < EPS) {

                this.spr.setFrame(0, 0);
            }
            else {

                row = this.running ? 1 : 0;

                animSpeed = RUN_SPEED_BASE - Math.abs(this.speed.x) * RUN_SPEED_MOD;
                this.spr.animate(row, 1, 4, animSpeed | 0, event.step);
            }
        }
        else {

            frame = 1;
            if (this.speed.y > JUMP_EPS)
                frame = 2;
            else if (this.speed.y < -JUMP_EPS)
                frame = 0;
            
            if (this.flapping)
                frame = 3;

            if ((this.doubleJump && this.jumpTimer > 0) || this.flapping) {

                row = 7;
            }
            else {

                row = 2;
            }
            this.spr.setFrame(frame, row);
        }
    }


    private updateJump(event : CoreEvent) {

        const DOUBLE_JUMP_SPEED_DELTA = -0.30;
        const DOUBLE_JUMP_MIN = -1.25;

        if (this.jumpMargin > 0) {

            this.jumpMargin -= event.step;
        }

        if (this.jumpTimer > 0) {

            if (this.canJump) {

                this.jumpTimer = 0;
            }
            else {

                this.jumpTimer -= event.step;

                if (this.doubleJump) {

                    this.speed.y = Math.max(DOUBLE_JUMP_MIN,
                        this.speed.y + DOUBLE_JUMP_SPEED_DELTA * event.step);
                }
                else {

                    this.speed.y = -this.jumpSpeed;
                    if (this.touchWater) {

                        this.speed.y /= 2;
                    }
                }

                if (this.jumpTimer <= 0 && this.doubleJump) {

                    this.jumpReleased = true;
                    this.flapping = true;
                }
            }
        }
    }


    private updateDust(event : CoreEvent) {

        const DUST_GEN_TIME_BASE = 8;
        const DUST_GEN_TIME_ROCKET = 6;
        const DUST_ANIM_SPEED = 8;
        const EPS = 0.01;
        const ROCKET_DOWN_SPEED_UP = 0.5;
        const ROCKET_DOWN_SPEED_FLOAT = 1.0;

        for (let d of this.dust) {

            d.update(event);
        }

        let rocketActive = !this.spinning &&
            ((this.doubleJump && this.jumpTimer > 0) || this.flapping);

        if (!rocketActive && (this.sliding || !this.canJump || this.spinning ||
            this.knockbackTimer > 0 ||
            Math.abs(this.speed.x) <= EPS)) return;

        let dir = this.flip == Flip.None ? 1 : -1;

        let genTime = DUST_GEN_TIME_BASE / Math.abs(this.speed.x);
        let speed = new Vector2();
        let pos = new Vector2(
            this.pos.x - 2 * dir, 
            this.pos.y + 6);

        if (rocketActive) {

            speed.y = this.flapping ? ROCKET_DOWN_SPEED_FLOAT : ROCKET_DOWN_SPEED_UP;
            genTime = DUST_GEN_TIME_ROCKET;

            pos.x -= dir;
        }

        if ((this.dustTimer += event.step) >= genTime) {

            nextObject(this.dust, Dust)
                .spawn(pos.x, pos.y, DUST_ANIM_SPEED, speed,
                rocketActive ? 1 : 0);

            this.dustTimer -= genTime;
        }
    }


    protected resetFlags() {

        this.canJump = false;
        this.touchLadder = false;
        this.isLadderTop = false;
        this.showActionSymbol = false;
        this.holdingItem = false;
        this.touchWater = false;
    }


    protected preMovementEvent(event : CoreEvent) {

        const INV_TIME = 60;

        this.updateDust(event);

        if (this.knockbackTimer > 0) {

            if ((this.knockbackTimer -= event.step) <= 0) {

                this.invulnerabilityTimer = INV_TIME;
            }
            this.resetFlags();
            
            return;
        }

        this.control(event);
        this.animate(event);
        this.updateJump(event);

        this.resetFlags();

        if (this.invulnerabilityTimer > 0) {

            this.invulnerabilityTimer -= event.step;
        }
    }


    private resetProperties(stop : boolean) {

        if (stop) {

            this.stopMovement();
        }

        this.doubleJump = false;
        this.downAttacking = false;
        this.downAttackWaitTimer = 0;

        this.jumpTimer = 0;
        this.throwing = false;
        this.climbing = false;
        this.touchLadder = false;
        this.running = false;
        this.flapping = false;
        this.spinning = false;

        this.target.y = BASE_GRAVITY;
    }


    public cameraMovement(camera : Camera, event : CoreEvent) {

        const MOVE_SPEED = 12;

        let actualSpeed = MOVE_SPEED * camera.getSpeed();
        let dir = camera.getDirection();

        this.pos.x += actualSpeed * dir.x * event.step;
        this.pos.y += actualSpeed * dir.y * event.step;

        this.animate(event);
    }


    public cameraEvent(camera : Camera, event : CoreEvent) {

        const CAMERA_MOVE_SPEED = 1.0/20.0;
        const HIT_RANGE_X = 4;
        const HIT_RANGE_Y = 4; 
        const TOP_EXTRA_MARGIN = 1;

        let p = camera.getPosition();

        if (this.knockbackTimer > 0) {

            this.wallCollision(p.x, p.y, camera.height, -1, event, true);
            this.wallCollision(p.x+160, p.y, camera.height, 1, event, true);
        }

        let x1 = p.x;
        let y1 = p.y;
        let x2 = p.x + camera.width;
        let y2 = p.y + camera.height;

        let dirx = 0;
        let diry = 0;

        let extraMargin = this.climbing ? 0 : TOP_EXTRA_MARGIN;

        if (this.pos.x - HIT_RANGE_X < x1) 
            dirx = -1;
        else if (this.pos.x + HIT_RANGE_X > x2)
            dirx = 1;
        else if (this.pos.y - HIT_RANGE_Y + extraMargin < y1 && !this.downAttacking) 
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

        let px = Math.round(this.pos.x - this.spr.width/2);
        let py = Math.round(this.pos.y - this.spr.height/2);

        if (this.showActionSymbol) {

            canvas.drawSprite(this.sprActionSymbol,
                canvas.assets.getBitmap("symbol"),
                px, py - 14);
        }

        if (!this.exist ||
            (this.invulnerabilityTimer > 0 &&
            Math.floor(this.invulnerabilityTimer/4) % 2 == 0)) 
            return;

        canvas.drawSprite(this.spr, 
            canvas.assets.getBitmap("player"), 
            px, py, this.flip);

        if (this.holdingItem) {

            canvas.drawBitmapRegion(canvas.assets.getBitmap("items"), 
                this.itemID * 16, 0, 16, 16,
                px, py - 17);
        }
    }


    protected verticalCollisionEvent(dir : number, event : CoreEvent) {

        const JUMP_MARGIN = 12;
        const HIT_WAIT = 30;
        const HIT_MAGNITUDE = 2;

        if (dir == 1) {

            this.canJump = true;
            this.jumpMargin = JUMP_MARGIN;
            this.jumpTimer = 0;

            this.doubleJump = false;
            this.climbing = false;
            this.canThrow = true;
            this.canSpin = true;

            if (this.downAttacking) {

                this.downAttacking = false;
                this.downAttackWaitTimer = HIT_WAIT;

                event.shake(HIT_WAIT, HIT_MAGNITUDE);
            }
        }
        else {

            this.jumpTimer = 0;
            if (this.doubleJump) {

                this.jumpReleased = true;
                this.flapping = true;
            }
        }
    }


    protected wallCollisionEvent(dir : number, event : CoreEvent) {

        this.sliding = false;
        this.slideTimer = 0;
    }


    public ladderCollision(x : number, y : number, w : number, h : number, 
        ladderTop : boolean, event : CoreEvent) : boolean {

        if (boxOverlay(this.pos, this.center, this.collisionBox, x, y, w, h)) {

            this.climbX = x + w/2;
            this.touchLadder = !ladderTop || !this.climbing;
            this.isLadderTop = this.isLadderTop || ladderTop;

            return true;
        }
        return false;
    }


    public breakCollision(x : number, y : number, w : number, h : number, 
        level : number, event : CoreEvent) : boolean {

        const Y_OFF = -4;

        y += Y_OFF;

        if (!this.downAttacking || this.speed.y <= 0 || level == 1)
            return false;

        return boxOverlay(this.pos, this.center, this.collisionBox, x, y, w, h);
    }
    

    public hurtCollision(x : number, y : number, 
        w : number, h : number, dir : number, 
        event : CoreEvent) : boolean {

        const KNOCKBACK_TIME = 30;
        const KNOCKBACK_SPEED = 2.0;

        if (this.dying ||
            this.invulnerabilityTimer > 0 ||
            this.knockbackTimer > 0) return false;

        if (boxOverlay(this.pos, this.center, this.hitbox, x, y, w, h)) {

            this.spr.setFrame(4, 3);
            this.knockbackTimer = KNOCKBACK_TIME;

            if (dir == 0) 
                dir = -this.faceDir;
            
            this.target.x = 0;
            this.speed.x = KNOCKBACK_SPEED * dir;

            this.resetProperties(false);

            this.health = Math.max(0, this.health-1);
            
            return true;
        }

        return false;
    }


    public windCollision(x : number, y : number, w : number, h : number, 
        event : CoreEvent) : boolean {

        const SPEED_DOWN = -0.5;
        const MIN_SPEED = -3.0; 

        if (boxOverlay(this.pos, this.center, this.hitbox, x, y, w, h)) {

            this.flapping = false;
            this.downAttacking = false;
            this.downAttackWaitTimer = 0;
            this.jumpReleased = false;
            this.speed.y = Math.max(MIN_SPEED, this.speed.y + SPEED_DOWN * event.step);
            return true;
        }
        return false;
    }


    public waterCollision(x : number, y : number, w : number, h : number, 
        top : boolean, event : CoreEvent) : boolean {

        const UP_SPEED = -0.5;

        if (this.inside) return false;

        if (boxOverlay(this.pos, this.center, this.hitbox, x, y, w, h)) {

            // this.canJump = true;
            this.jumpMargin = 1;
            this.touchWater = true;
            this.canThrow = true;
            this.canSpin = true;

            if (!top && !this.progress.getBooleanProperty("item7")) {

                this.speed.y += UP_SPEED * event.step;
            }
        }

        return false;
    }


    public makeJump(speed : number) {

        if (this.downAttacking) return;

        this.speed.y = speed;

        this.flapping = false;
        this.jumpReleased = false;
        this.doubleJump = false;
    }


    public checkLoop(stage : Stage) {

        this.pos.x = negMod(this.pos.x, stage.width*16);
    }


    public touchGround = () : boolean => this.canJump &&
        !this.downAttacking &&
        this.downAttackWaitTimer <= 0 &&
        !this.throwing &&
        !this.sliding &&
        !this.climbing &&
        this.knockbackTimer <= 0;


    public showSymbol() {

        this.showActionSymbol = true;
    }

    
    public setObtainItemPose(itemID : number) {

        this.stopMovement();
        this.spr.setFrame(4, 4);

        this.showActionSymbol = false;
        this.holdingItem = true;

        this.itemID = itemID;
    }


    public setUsePose(pos = -1) {

        this.stopMovement();
        this.spr.setFrame(3, 3);

        if (pos >= 0) {

            this.pos.x = pos;
        }

        this.showActionSymbol = false;
    }


    public teleportTo(pos : Vector2, setPose = true, inside = false) {

        if (setPose) {

            this.spr.setFrame(2, 3);
        }

        this.inside = inside;
        this.pos = pos.clone();
    }


    public isInside = () : boolean => this.inside;

    public maxHealth = () : number => this.progress.getBooleanProperty("item9") ? 4 : 3;
    public getHealth = () : number => this.health;
}
