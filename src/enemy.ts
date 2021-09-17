import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { CollisionObject } from "./gameobject.js";
import { clamp } from "./math.js";
import { Player } from "./player";
import { Sprite } from "./sprite.js";
import { Vector2 } from "./vector.js";


export class Enemy extends CollisionObject {


    protected flip : Flip;

    protected readonly id : number;


    constructor(x : number, y : number, id : number) {

        super(x, y, true);

        this.id = id;

        this.spr = new Sprite(16, 16);
        this.spr.setFrame(0, this.id);

        this.hitbox = new Vector2(8, 8);
        this.collisionBox = new Vector2(8, 8);

        this.flip = Flip.None;
    }


    protected updateAI(event : CoreEvent) { }


    protected updateLogic(event : CoreEvent) {

        this.updateAI(event);
    }


    public draw(canvas : Canvas) {

        if (!this.exist || !this.inCamera) return;

        let px = Math.round(this.pos.x) - this.spr.width/2;
        let py = Math.round(this.pos.y) - this.spr.height/2;

        let bmp = canvas.assets.getBitmap("enemies");

        canvas.drawSprite(this.spr, bmp, px, py, this.flip);
    }


    protected playerEvent(player : Player, event : CoreEvent) { }


    public playerCollision(player : Player, event : CoreEvent) : boolean {

        if (!this.exist || !this.inCamera || this.dying) 
            return false;

        this.playerEvent(player, event);

        return player.hurtCollision(
            this.pos.x - this.hitbox.x/2,
            this.pos.y - this.hitbox.y/2,
            this.hitbox.x, this.hitbox.y,
            Math.sign(player.getPos().x - this.pos.x), event);
    }

}


//
// Enemy types
//


export class Slime extends Enemy {


    constructor(x : number, y : number) {

        super(x, y+1, 0);

        this.spr.setFrame((Math.random() * 4) | 0, this.id);

        this.center = new Vector2(0, 1);
        this.hitbox = new Vector2(8, 8);
    }


    protected updateAI(event : CoreEvent) { 

        const ANIM_SPEED = 8;

        this.spr.animate(this.id, 0, 3, ANIM_SPEED, event.step);
    }


    protected playerEvent(player : Player, event : CoreEvent) {

        this.flip = player.getPos().x < this.pos.x ? Flip.None : Flip.Horizontal;
    }
}



const ENEMY_TYPES = [Slime];

export const getEnemyType = (index : number) : Function => ENEMY_TYPES[clamp(index, 0, ENEMY_TYPES.length-1)];
