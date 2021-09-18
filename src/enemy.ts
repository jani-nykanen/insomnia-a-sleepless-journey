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

    protected flip : Flip;

    protected readonly id : number;


    constructor(x : number, y : number, id : number) {

        super(x, y, true);

        this.id = id;

        this.spr = new Sprite(16, 16);
        this.spr.setFrame(0, this.id+1);

        this.hitbox = new Vector2(8, 8);
        this.collisionBox = new Vector2(8, 8);

        this.flip = Flip.None;
    }


    protected outsideCameraEvent() {

        if (this.dying)
            this.exist = false;
    }

    
    protected die(event : CoreEvent) : boolean {

        const ANIM_SPEED = 3;

        this.spr.animate(0, 0, 3, ANIM_SPEED, event.step);

        return ((this.deathTimer -= event.step) <= 0); 
    }


    protected updateAI(event : CoreEvent) { }


    protected updateLogic(event : CoreEvent) {

        this.updateAI(event);
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

            canvas.drawSprite(this.spr, bmp, 
                Math.round(x) - this.spr.width/2, 
                Math.round(y) - this.spr.height/2, 
                this.flip);
        }
    }


    public draw(canvas : Canvas) {

        if (!this.exist || !this.inCamera) return;

        if (this.dying) {

            this.drawDeath(canvas);
            return;
        }

        let px = Math.round(this.pos.x) - this.spr.width/2;
        let py = Math.round(this.pos.y) - this.spr.height/2;

        let bmp = canvas.assets.getBitmap("enemies");

        canvas.drawSprite(this.spr, bmp, px, py, this.flip);
    }


    protected playerEvent(player : Player, event : CoreEvent) { }



    protected killSelf(event : CoreEvent) {

        this.dying = true;
        this.deathTimer = DEATH_TIME;

        this.spr.setFrame((Math.random() * 4) | 0, 0);
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
}


//
// Enemy types
//


export class Slime extends Enemy {


    constructor(x : number, y : number) {

        super(x, y+1, 0);

        this.spr.setFrame((Math.random() * 4) | 0, this.id+1);

        this.center = new Vector2(0, 2);
        this.hitbox = new Vector2(8, 6);
    }


    protected updateAI(event : CoreEvent) { 

        const ANIM_SPEED = 8;

        this.spr.animate(this.id+1, 0, 3, ANIM_SPEED, event.step);
    }


    protected playerEvent(player : Player, event : CoreEvent) {

        this.flip = player.getPos().x < this.pos.x ? Flip.None : Flip.Horizontal;
    }
}



const ENEMY_TYPES = [Slime];

export const getEnemyType = (index : number) : Function => ENEMY_TYPES[clamp(index, 0, ENEMY_TYPES.length-1)];
