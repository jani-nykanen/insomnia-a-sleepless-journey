import { Camera } from "./camera.js";
import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { CollisionObject } from "./gameobject.js";
import { clamp } from "./math.js";
import { Player } from "./player";
import { ProgressManager } from "./progress.js";
import { Projectile } from "./projectile.js";
import { Sprite } from "./sprite.js";
import { Vector2 } from "./vector.js";


const DEATH_TIME = 30;


enum DeathMode {

    Normal = 0,
    Spun = 1
};


export class Enemy extends CollisionObject {

    protected startPos : Vector2;

    private deathTimer : number;
    private deathMode : DeathMode;
    private starSprite : Sprite;
    private deathPos : Vector2;

    protected canJump : boolean;
    protected oldCanJump : boolean;

    protected canBeKnockedDown : boolean;
    protected knockDownYOffset : number;
    private knockDownTimer : number;
    private previousShakeState : boolean;

    protected flip : Flip;
    protected dir : number;

    protected canBeStomped : boolean;
    protected canBeSpun : boolean;
    protected knockOnStomp : boolean;

    protected ghost : boolean;

    private forceReset : boolean;
    private oldCameraState : boolean;

    // Good variable naming here
    protected id : number;
    public readonly entityID : number;

    private readonly hasBaseGravity : boolean;


    static BASE_GRAVITY = 2.0;


    constructor(x : number, y : number, id : number, entityID : number, baseGravity = false) {

        super(x, y, true);

        this.hasBaseGravity = baseGravity;

        this.startPos = this.pos.clone();

        this.id = id;
        this.entityID = entityID;

        this.spr = new Sprite(16, 16);
        this.spr.setFrame(0, this.id+2);

        this.starSprite = new Sprite(16, 16);

        this.hitbox = new Vector2(8, 8);
        this.collisionBox = new Vector2(8, 8);

        this.flip = Flip.None;

        this.canBeKnockedDown = true;
        this.knockDownTimer = 0;

        this.friction = new Vector2(0.1, 0.15);
        if (baseGravity) {

            this.target.y = Enemy.BASE_GRAVITY;
        }   

        this.canJump = false;
        this.oldCanJump = this.canJump;
    
        this.knockDownYOffset = 0;
        this.previousShakeState = false;

        this.canBeStomped = true;
        this.canBeSpun = true;
        this.knockOnStomp = false;

        this.deathTimer = 0;
        this.deathMode = DeathMode.Normal;
        this.deathPos = this.pos.clone();

        this.dir = -1 + 2 * (Math.floor(x / 16) % 2); 

        this.ghost = false;

        this.oldCameraState = false;
    }


    protected outsideCameraEvent() {

        if (this.dying) {

            if (this.deathMode == DeathMode.Spun &&
                this.deathTimer > 0) {

                this.inCamera = true;
            }
            else {

                this.exist = false;
            }
            return;
        }

        if (!this.inCamera && this.oldCameraState) {

            this.forceReset = true;
        }
    }

    
    protected die(event : CoreEvent) : boolean {

        const ANIM_SPEED = 3;   
        const PUFF_SPEED = 4;
        const DEATH_GRAVITY = 4.0;

        this.flip = Flip.None;

        if (this.deathMode == DeathMode.Normal) {

            if (this.spr.getColumn() < 4)
                this.spr.animate(0, 0, 4, PUFF_SPEED, event.step);
        }
        else {

            this.target.y = DEATH_GRAVITY;
            this.updateMovement(event);
        }

        this.starSprite.animate(1, 0, 3, ANIM_SPEED, event.step);
        this.deathTimer -= event.step;

        return this.deathMode == DeathMode.Normal &&
               this.deathTimer <= 0; 
    }


    protected updateAI(event : CoreEvent) { }


    private knockDown(jump = true) {

        const KNOCKDOWN_TIME = 150;
        const KNOCKDOWN_JUMP = -2.5;

        this.target.x = 0;
        this.speed.x = 0;

        this.knockDownTimer = KNOCKDOWN_TIME;
        if (jump) {

            this.speed.y = KNOCKDOWN_JUMP * (this.friction.y / 0.15);
        }

        this.spr.setFrame(0, this.spr.getRow());
    }


    protected preMovementEvent(event : CoreEvent) {

        this.oldCameraState = this.inCamera;

        if (this.canJump && event.isShaking() &&
            (this.knockDownTimer <= 0 || !this.previousShakeState)) {

            if (this.canBeKnockedDown) {

                this.knockDown(true);
            }
        }

        if (this.knockDownTimer > 0) {

            this.knockDownTimer -= event.step;
            return;
        }

        this.updateAI(event);

        this.previousShakeState = event.isShaking();
    }


    protected postMovementEvent(event : CoreEvent) {

        this.oldCanJump = this.canJump;
        this.canJump = false;
    }


    private drawDeath( canvas : Canvas) {

        const COUNT = [6, 4];
        const OFFSET = [(Math.PI/2) / 3, Math.PI/4];
        const DISTANCE = 32.0;

        if (this.deathTimer <= 0) return;

        let count = COUNT[this.deathMode];
        let offset = OFFSET[this.deathMode];

        let bmp = canvas.assets.getBitmap("enemies");
    
        let t = 1.0 - this.deathTimer / DEATH_TIME;
        let angle : number;

        let x : number;
        let y : number;

        let px = Math.round(this.deathPos.x);
        let py = Math.round(this.deathPos.y);

        for (let i = 0; i < count; ++ i) {

            angle = offset + i * (Math.PI * 2 / count);

            x = px + (Math.cos(angle) * t * DISTANCE);
            y = py + (Math.sin(angle) * t * DISTANCE);

            canvas.drawSprite(this.starSprite, bmp, 
                Math.round(x) - this.spr.width/2, 
                Math.round(y) - this.spr.height/2, 
                this.flip);
        }
    }


    protected preDraw(canvas : Canvas) {}


    public draw(canvas : Canvas) {

        if (!this.exist || !this.inCamera) 
            return;

        if (this.dying) {

            this.drawDeath(canvas);
        
            if (this.spr.getColumn() == 4) 
                return;
        }

        if (this.ghost) {

            canvas.setGlobalAlpha(0.67);
        }

        this.preDraw(canvas);

        let px = Math.round(this.pos.x) - this.spr.width/2;
        let py = Math.round(this.pos.y) - this.spr.height/2;

        let flip = this.flip;
        if (this.knockDownTimer > 0 || 
            (this.dying && this.deathMode == DeathMode.Spun)) {

            flip |= Flip.Vertical;
            py += this.knockDownYOffset;
        }

        let bmp = canvas.assets.getBitmap(this.ghost ? "ghosts" : "enemies");

        canvas.drawSprite(this.spr, bmp, px, py, flip);

        if (this.ghost) {
            
            canvas.setGlobalAlpha();
        }
    }


    public cameraEvent(camera : Camera) {

        if (!this.inCamera && this.forceReset &&
            !camera.isMoving()) {

            this.reset();

            this.forceReset = false;
        }
    }


    protected playerEvent(player : Player, event : CoreEvent) { }


    protected killSelf(progress : ProgressManager, event : CoreEvent, 
        deathMode = DeathMode.Normal) {

        this.dying = true;
        this.knockDownTimer = 0;
        this.deathTimer = DEATH_TIME;
        this.deathMode = deathMode;

        this.starSprite.setFrame((Math.random() * 4) | 0, 1);

        if (!this.ghost) {

            progress.increaseNumberProperty("kills", 1);
            progress.addValueToArray("enemiesKilled", this.entityID, true);
        }

        this.deathPos = this.pos.clone();
    }


    private spinKnockback(player : Player) {

        const SPUN_FLY_SPEED_X = 3.0;
        const SPUN_FLY_SPEED_Y = -3.0;

        this.target.x = (player.getPos().x < this.pos.x ? 1 : -1) * SPUN_FLY_SPEED_X;
        this.speed.x = this.target.x;
        this.speed.y = SPUN_FLY_SPEED_Y;
    }


    public playerCollision(player : Player, event : CoreEvent) : boolean {

        const STOMP_MARGIN = 4;
        const STOMP_EXTRA_RANGE = 2;
        const SPEED_EPS = -0.25;
        const PLAYER_JUMP = -3.0;

        if (!this.exist || !this.inCamera || this.dying) 
            return false;

        let y = this.pos.y + this.center.y - this.hitbox.y - STOMP_MARGIN/4;
        let h = STOMP_MARGIN + Math.abs(this.speed.y);

        let hbox = player.getHitbox();

        let py = player.getPos().y + hbox.y/2;
        let px = player.getPos().x - hbox.x/2;

        if ((this.canBeSpun || this.knockDownTimer > 0) && 
            player.checkSpinOverlay(this)) {

            this.spinKnockback(player);
            this.killSelf(player.progress, event, DeathMode.Spun);

            return true;
        }

        if ((this.canBeStomped || this.knockDownTimer > 0) &&
            player.getSpeed().y > SPEED_EPS &&
            px + hbox.x >= this.pos.x - this.hitbox.x/2 - STOMP_EXTRA_RANGE &&
            px <= this.pos.x + this.hitbox.x/2 + STOMP_EXTRA_RANGE &&
            py >= y && py <= y+h) {

            if (!player.isSpinning()) {
                
                player.makeJump(PLAYER_JUMP);
            }
            else if (this.canBeSpun || this.knockDownTimer > 0) {

                this.spinKnockback(player);
                this.killSelf(player.progress, event, DeathMode.Spun);
                return true;
            }

            if (this.knockOnStomp && !player.isDownAttacking() && !player.isSpinning()) {

                this.knockDown(false);
            }
            else {

                this.killSelf(player.progress, event);
            }
            return true;
        }

        if (this.knockDownTimer <= 0)
            this.playerEvent(player, event);

        return player.hurtCollision(
            this.pos.x - this.hitbox.x/2,
            this.pos.y - this.hitbox.y/2,
            this.hitbox.x, this.hitbox.y,
            Math.sign(player.getPos().x - this.pos.x), event);
    }


    public projectileCollision(p : Projectile, player : Player, event : CoreEvent) : boolean {

        if (!this.exist || !this.inCamera || this.dying ||
            !p.doesExist() || p.isDying()) 
            return false;

        if (this.overlayObject(p)) {

            p.destroy(event);
            this.killSelf(player.progress, event);

            return true;
        }

        return false;
    }


    protected verticalCollisionEvent(dir : number, event : CoreEvent) {

        if (dir == 1) {

            this.canJump = true;
        }
    }


    public makeGhost() {

        this.ghost = true;
    }


    public isGhost = () : boolean => this.ghost;
    

    protected respawnEvent() {}


    private reset() {

        if (!this.exist || this.dying) return;

        this.canJump = false;
        this.oldCanJump = false;

        this.stopMovement();

        this.spr.setFrame(0, this.id+2);

        this.pos = this.startPos.clone();

        this.flip = Flip.None;
        this.dir = 1;

        this.deathTimer = 0;
        this.dir = -1 + 2 * (Math.floor(this.pos.x / 16) % 2); 

        this.respawnEvent();

        if (this.hasBaseGravity) {

            this.target.y = Enemy.BASE_GRAVITY;
        }

        this.knockDownTimer = 0;
    }


    public respawn() {

        this.ghost = this.ghost || (!this.exist || this.dying);

        this.dying = false;
        this.exist = true;

        this.reset();
    }
}


//
// Enemy types
//


export class Slime extends Enemy {


    constructor(x : number, y : number, entityID : number) {

        super(x, y, 0, entityID, true);

        this.center = new Vector2(0, 3);
        this.hitbox = new Vector2(8, 8);

        this.knockDownYOffset = 5;

        this.respawnEvent();
    }


    protected respawnEvent() {

        this.spr.setFrame((Math.random() * 4) | 0, this.spr.getRow());
    }


    protected updateAI(event : CoreEvent) { 

        const ANIM_SPEED = 8;

        this.spr.animate(this.spr.getRow(), 
            0, 3, ANIM_SPEED, event.step);
    }


    protected playerEvent(player : Player, event : CoreEvent) {

        this.flip = player.getPos().x < this.pos.x ? Flip.None : Flip.Horizontal;
    }

}


export class SpikeSlime extends Enemy {


    constructor(x : number, y : number, entityID : number) {

        super(x, y, 1, entityID, true);

        this.center = new Vector2(0, 3);
        this.hitbox = new Vector2(8, 10);

        this.knockDownYOffset = 5;

        this.canBeStomped = false;
        this.canBeSpun = false;
    }


    protected updateAI(event : CoreEvent) { 

        const WAIT_TIME = 60;
        const ANIM_SPEED = 12;

        this.spr.animate(this.spr.getRow(), 
            0, 3, 
            this.spr.getColumn() == 0 ? WAIT_TIME : ANIM_SPEED, 
            event.step);
    }


    protected playerEvent(player : Player, event : CoreEvent) {

        this.flip = player.getPos().x < this.pos.x ? Flip.None : Flip.Horizontal;
    }

}


export class Turtle extends Enemy {


    private baseSpeed : number;


    constructor(x : number, y : number, entityID : number) { 

        super(x, y+1, 2, entityID, true);

        this.spr.setFrame(0, this.spr.getRow());

        this.knockOnStomp = true;

        this.collisionBox.x = 4;
        this.center = new Vector2(0, 3);
        this.hitbox = new Vector2(10, 8);

        this.knockDownYOffset = 4;

        this.baseSpeed = 0;

        this.respawnEvent();
    }


    protected respawnEvent() {

        const SPEED = 0.20;

        this.baseSpeed = this.dir * SPEED;
    }


    protected updateAI(event : CoreEvent) { 

        const ANIM_SPEED = 6;

        this.spr.animate(this.spr.getRow(), 
            0, 3, ANIM_SPEED, event.step);

        if (this.oldCanJump && !this.canJump) {

            this.pos.x -= this.speed.x * event.step;

            this.baseSpeed *= -1;
        }

        this.target.x = this.baseSpeed;
        this.speed.x = this.target.x;

        this.flip = this.baseSpeed > 0 ? Flip.Horizontal : Flip.None;
    }


    protected wallCollisionEvent(dir : number, event : CoreEvent) {

        this.dir = -dir;
        this.baseSpeed = Math.abs(this.baseSpeed) * this.dir;

        this.target.x = this.baseSpeed;
        this.speed.x = this.target.x;
    }

}


export class Seal extends Enemy {


    static JUMP_TIME = 30;
    static MOVE_SPEED = 0.5;


    private jumpTimer : number;


    constructor(x : number, y : number, entityID : number) {

        super(x, y+1, 3, entityID, true);

        this.center = new Vector2(0, 3);
        this.hitbox = new Vector2(8, 8);

        this.knockDownYOffset = 5;

        this.jumpTimer = 0;
        this.respawnEvent();

        this.friction.y = 0.1;
    }


    protected respawnEvent() {

        let x = this.startPos.x;

        this.jumpTimer = Seal.JUMP_TIME + (((x / 16) | 0) % 2) * Seal.JUMP_TIME / 2;
    }


    protected updateAI(event : CoreEvent) { 

        const EPS = 0.5;
        const JUMP_HEIGHT = -1.75;

        let frame = 0;

        if (this.canJump) {

            this.spr.setFrame(0, this.spr.getRow());

            this.target.x = 0;
            if ((this.jumpTimer -= event.step) <= 0) {

                this.speed.y = JUMP_HEIGHT;
                this.jumpTimer = Seal.JUMP_TIME;

                this.speed.x = this.dir * Seal.MOVE_SPEED;
                this.target.x = this.speed.x;
            }
        }
        else {

            if (this.speed.y < -EPS)
                frame = 1;
            else if (this.speed.y > EPS)
                frame = 2;

            this.spr.setFrame(frame, this.spr.getRow());

            this.flip = this.speed.x < 0 ? Flip.None : Flip.Horizontal;
        }
    }


    protected wallCollisionEvent(dir : number, event : CoreEvent) {

        if (this.canJump) return;

        this.dir = -dir;
        this.speed.x = this.dir * Seal.MOVE_SPEED;
        this.target.x = this.speed.x;
    }

}


export class SpikeTurtle extends Turtle {


    constructor(x : number, y : number, entityID : number) {
        
        super(x, y, entityID);

        this.canBeStomped = false;
        this.canBeSpun = false;

        this.id = 4;
        this.spr.setFrame(0, this.id+2);

        this.center = new Vector2(0, 3);
        this.hitbox = new Vector2(10, 10);
    }

}


class WaveObject extends Enemy {


    protected wave : Vector2;
    protected waveSpeed : Vector2;
    protected amplitude : Vector2;


    constructor(x : number, y : number, id : number, entityID : number) {

        super(x, y, id, entityID, false);

        this.canBeKnockedDown = false;

        this.wave = new Vector2();
        this.waveSpeed = new Vector2(0.0, 0.0);
        this.amplitude = new Vector2(0, 0);
    }
    

    protected updateWave(event : CoreEvent) {
        
        this.wave.x += this.waveSpeed.x * event.step;
        this.wave.x %= Math.PI*2;

        this.wave.y += this.waveSpeed.y * event.step;
        this.wave.y %= Math.PI*2;

        this.pos.x = this.startPos.x + Math.sin(this.wave.x) * this.amplitude.x;
        this.pos.y = this.startPos.y + Math.sin(this.wave.y) * this.amplitude.y;
    }

}


export class Apple extends WaveObject {


    constructor(x : number, y : number, entityID : number) {

        super(x, y, 5, entityID);

        this.center = new Vector2(0, 0);
        this.hitbox = new Vector2(8, 8);

        this.waveSpeed = new Vector2(0.05, 0.025);
        this.amplitude = new Vector2(4, 16);

        this.respawnEvent();
    }


    protected respawnEvent() {

        this.wave.zeros();

        this.spr.setFrame((Math.random() * 4) | 0, this.spr.getRow());
    }


    protected updateAI(event : CoreEvent) { 

        const ANIM_SPEED = 6;

        this.updateWave(event);

        this.spr.animate(this.spr.getRow(), 
            0, 3, ANIM_SPEED, event.step);
    }


    protected playerEvent(player : Player, event : CoreEvent) {

        this.flip = player.getPos().x < this.pos.x ? Flip.None : Flip.Horizontal;
    }

}


export class Imp extends WaveObject {


    constructor(x : number, y : number, entityID : number) {

        super(x, y, 6, entityID);

        this.center = new Vector2(0, 0);
        this.hitbox = new Vector2(10, 8);

        this.waveSpeed = new Vector2(0.025, 0.05);
        this.amplitude = new Vector2(16, 4);

        this.respawnEvent();
    }


    protected respawnEvent() {

        this.wave.zeros();

        this.spr.setFrame((Math.random() * 4) | 0, this.spr.getRow());
    }


    protected updateAI(event : CoreEvent) { 

        const ANIM_SPEED = 6;

        this.updateWave(event);

        this.spr.animate(this.spr.getRow(), 
            0, 3, ANIM_SPEED, event.step);
    }

}


export class Mushroom extends Enemy {


    static JUMP_TIME = 60;


    private jumpTimer : number;


    constructor(x : number, y : number, entityID : number) {

        super(x, y+1, 7, entityID, true);

        this.center = new Vector2(0, 3);
        this.hitbox = new Vector2(8, 8);

        this.knockDownYOffset = 1;

        this.friction.y = 0.1;

        this.jumpTimer = 0;

        this.respawnEvent();
    }


    protected respawnEvent() {

        let x = this.startPos.x;
        this.jumpTimer = Mushroom.JUMP_TIME + (((x / 16) | 0) % 2) * Mushroom.JUMP_TIME / 2;
    }


    protected updateAI(event : CoreEvent) { 

        const EPS = 0.5;
        const JUMP_HEIGHT = -2.5;

        let frame = 0;

        if (this.canJump) {

            this.spr.setFrame(0, this.spr.getRow());

            if ((this.jumpTimer -= event.step) <= 0) {

                this.speed.y = JUMP_HEIGHT;
                this.jumpTimer = Mushroom.JUMP_TIME;
            }
        }
        else {

            if (this.speed.y < -EPS)
                frame = 1;
            else if (this.speed.y > EPS)
                frame = 2;

            this.spr.setFrame(frame, this.spr.getRow());
        }
    }


    protected playerEvent(player : Player, event : CoreEvent) {

        if (!this.canJump) return;

        this.flip = player.getPos().x < this.pos.x ? Flip.None : Flip.Horizontal;
    }

}


export class FakeBlock extends Enemy {


    private phase : number;
    private shakeTimer : number;


    constructor(x : number, y : number, entityID : number) {

        super(x, y-1, 8, entityID, false);

        this.center = new Vector2(0, 2);
        this.hitbox = new Vector2(12, 12);

        this.canBeKnockedDown = false;

        this.phase = 0;
        this.shakeTimer = 0;

        this.friction.y = 0.25;

        this.respawnEvent();
    }


    protected respawnEvent() {

        this.phase = 0;
        this.shakeTimer = 0;

        this.spr.setFrame(0, this.spr.getRow());
    }


    protected updateAI(event : CoreEvent) { 

        const RETURN_SPEED = -1.0;

        if (this.phase == 2) {

            if ((this.shakeTimer -= event.step) <= 0) {

                this.phase = 3;
                this.speed.y = RETURN_SPEED;
                this.target.y = RETURN_SPEED;

                this.spr.setFrame(2, this.spr.getRow());
            }
        }
        else if (this.phase == 3) {

            if (this.pos.y < this.startPos.y) {

                this.pos.y =  this.startPos.y;
                this.stopMovement();

                this.phase = 0;
            }
        }
    }


    protected playerEvent(player : Player, event : CoreEvent) {

        const MARGIN = 32;
        const GRAVITY = 8.0;

        let p = player.getPos();
    
        if (this.phase > 0 ||
            p.y < this.pos.y ||
            Math.abs(p.x - this.pos.x) > MARGIN) return;

        this.phase = 1;
        this.target.y = GRAVITY;

        this.spr.setFrame(1, this.spr.getRow());
    }


    protected verticalCollisionEvent(dir : number, event : CoreEvent) {

        const SHAKE_TIME = 60;
        const MAGNITUDE = 1;

        if (dir != 1 || this.phase != 1)
            return;

        this.phase = 2;
        this.shakeTimer = SHAKE_TIME;

        event.shake(SHAKE_TIME, MAGNITUDE);
    }
}


export class Spinner extends Enemy {


    static RADIUS = 16;


    private angle : number;


    constructor(x : number, y : number, entityID : number) {

        super(x, y, 9, entityID, true);

        this.center = new Vector2(0, 0);
        this.hitbox = new Vector2(8, 8);

        this.canBeKnockedDown = false;
        this.canBeSpun = false;
        this.canBeStomped = false;

        this.angle = 0;

        this.offCameraRadius = Spinner.RADIUS*2;

        this.disableCollisions = true;
        
        this.respawnEvent();
    }


    private computePosition() {

        this.pos.x = this.startPos.x + Math.round(Math.cos(this.angle) * Spinner.RADIUS * this.dir);
        this.pos.y = this.startPos.y + Math.round(Math.sin(this.angle) * Spinner.RADIUS);
    }


    protected respawnEvent() {
        
        this.angle = (this.startPos.y % 360) / 360.0 * (Math.PI * 2);
        this.dir = ((this.startPos.x / 16) | 0) % 2 == 0 ? 1 : -1;

        this.computePosition();
    }


    protected updateAI(event : CoreEvent) { 

        const ANIM_SPEED = 8;
        const ROTATION_SPEED = 0.05;

        this.angle = (this.angle + ROTATION_SPEED * event.step) % (Math.PI * 2);
        this.computePosition();

        let startFrame = this.dir < 0 ? 0 : 2;
        this.spr.animate(this.spr.getRow(), 
            startFrame, startFrame+1,
             ANIM_SPEED, event.step);
    }


    protected preDraw(canvas : Canvas) {

        const CHAIN_PIECE_COUNT = 3;

        let radiusStep = Spinner.RADIUS / (CHAIN_PIECE_COUNT);

        let bmp = canvas.assets.getBitmap("enemies");

        let r = 0;
        let x : number;
        let y : number;
        for (let i = 0; i < CHAIN_PIECE_COUNT; ++ i) {

            x = this.startPos.x + Math.round(Math.cos(this.angle) * this.dir * r);
            y = this.startPos.y + Math.round(Math.sin(this.angle) * r);

            canvas.drawSpriteFrame(this.spr, bmp, 
                4, this.spr.getRow(),
                x-8, y-8);

            r += radiusStep;
        }
    }
}



const ENEMY_TYPES = [Slime, SpikeSlime, Turtle, Seal, SpikeTurtle, Apple, Imp, Mushroom, FakeBlock, Spinner];

export const getEnemyType = (index : number) : Function => ENEMY_TYPES[clamp(index, 0, ENEMY_TYPES.length-1)];
