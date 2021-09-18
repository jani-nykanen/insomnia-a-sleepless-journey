import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { CollisionObject } from "./gameobject.js";
import { clamp } from "./math.js";
import { Player } from "./player";
import { Projectile } from "./projectile.js";
import { Sprite } from "./sprite.js";
import { Vector2 } from "./vector.js";


const DEATH_TIME = 30;


export class Enemy extends CollisionObject {

    private deathTimer : number;
    private starSprite : Sprite;

    protected canJump : boolean;

    protected canBeKnockedDown : boolean;
    protected knockDownYOffset : number;
    private knockDownTimer : number;
    private previousShakeState : boolean;

    protected flip : Flip;


    protected readonly id : number;


    constructor(x : number, y : number, id : number, baseGravity = false) {

        const BASE_GRAVITY = 2.0;

        super(x, y, true);

        this.id = id;

        this.spr = new Sprite(16, 16);
        this.spr.setFrame(0, this.id+2);

        this.starSprite = new Sprite(16, 16);

        this.hitbox = new Vector2(8, 8);
        this.collisionBox = new Vector2(8, 8);

        this.flip = Flip.None;

        this.canBeKnockedDown = true;
        this.knockDownTimer = 0;

        this.friction = new Vector2(0.1, 0.1);
        if (baseGravity) {

            this.target.y = BASE_GRAVITY;
        }   

        this.canJump = false;
    
        this.knockDownYOffset = 0;
        this.previousShakeState = false;
    }


    protected outsideCameraEvent() {

        if (this.dying)
            this.exist = false;
    }

    
    protected die(event : CoreEvent) : boolean {

        const ANIM_SPEED = 3;   
        const PUFF_SPEED = 4;

        this.flip = Flip.None;

        if (this.spr.getColumn() < 4)
            this.spr.animate(0, 0, 4, PUFF_SPEED, event.step);

        this.starSprite.animate(1, 0, 3, ANIM_SPEED, event.step);

        return ((this.deathTimer -= event.step) <= 0); 
    }


    protected updateAI(event : CoreEvent) { }


    protected preMovementEvent(event : CoreEvent) {

        const KNOCKDOWN_TIME = 150;
        const KNOCKDOWN_JUMP = -2.0;

        if (this.canJump && event.isShaking() &&
            (this.knockDownTimer <= 0 || !this.previousShakeState)) {

            if (this.canBeKnockedDown) {

                this.knockDownTimer = KNOCKDOWN_TIME;
                this.speed.y = KNOCKDOWN_JUMP;

                this.spr.setFrame(0, this.spr.getRow());
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

        this.canJump = false;
    }


    private drawDeath(canvas : Canvas) {

        const COUNT = 6;
        const OFFSET = (Math.PI/2) / 3;
        const DISTANCE = 32.0;

        let bmp = canvas.assets.getBitmap("enemies");
    
        let t = 1.0 - this.deathTimer / DEATH_TIME;
        let angle : number;

        let x : number;
        let y : number;

        let px = Math.round(this.pos.x);
        let py = Math.round(this.pos.y);

        for (let i = 0; i < COUNT; ++ i) {

            angle = OFFSET + i * (Math.PI * 2 / COUNT);

            x = px + (Math.cos(angle) * t * DISTANCE);
            y = py + (Math.sin(angle) * t * DISTANCE);

            canvas.drawSprite(this.starSprite, bmp, 
                Math.round(x) - this.spr.width/2, 
                Math.round(y) - this.spr.height/2, 
                this.flip);
        }
    }


    public draw(canvas : Canvas) {

        if (!this.exist || !this.inCamera) 
            return;

        if (this.dying) {

            this.drawDeath(canvas);
        
            if (this.spr.getColumn() == 4) 
                return;
        }

        let px = Math.round(this.pos.x) - this.spr.width/2;
        let py = Math.round(this.pos.y) - this.spr.height/2;

        let flip = this.flip;
        if (this.knockDownTimer > 0) {

            flip |= Flip.Vertical;
            py += this.knockDownYOffset;
        }

        let bmp = canvas.assets.getBitmap("enemies");

        canvas.drawSprite(this.spr, bmp, px, py, flip);
    }


    protected playerEvent(player : Player, event : CoreEvent) { }



    protected killSelf(event : CoreEvent) {

        this.dying = true;
        this.knockDownTimer = 0;
        this.deathTimer = DEATH_TIME;

        this.starSprite.setFrame((Math.random() * 4) | 0, 1);
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

        if (player.getSpeed().y > SPEED_EPS &&
            px + hbox.x >= this.pos.x - this.hitbox.x/2 - STOMP_EXTRA_RANGE &&
            px <= this.pos.x + this.hitbox.x/2 + STOMP_EXTRA_RANGE &&
            py >= y && py <= y+h) {

            player.makeJump(PLAYER_JUMP);
            this.killSelf(event);

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


    public projectileCollision(p : Projectile, event : CoreEvent) : boolean {

        if (!this.exist || !this.inCamera || this.dying ||
            !p.doesExist() || p.isDying()) 
            return false;

        if (this.overlayObject(p)) {

            p.destroy(event);
            this.killSelf(event);

            return true;
        }

        return false;
    }


    protected verticalCollisionEvent(dir : number, event : CoreEvent) {

        if (dir == 1) {

            this.canJump = true;
        }
    }
}


//
// Enemy types
//


export class Slime extends Enemy {


    constructor(x : number, y : number) {

        super(x, y, 0, true);

        this.spr.setFrame((Math.random() * 4) | 0, this.spr.getRow());

        this.center = new Vector2(0, 3);
        this.hitbox = new Vector2(8, 8);

        this.knockDownYOffset = 5;
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



const ENEMY_TYPES = [Slime];

export const getEnemyType = (index : number) : Function => ENEMY_TYPES[clamp(index, 0, ENEMY_TYPES.length-1)];
