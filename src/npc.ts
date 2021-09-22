import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { StrongInteractionTarget } from "./interactiontarget.js";
import { Player } from "./player.js";
import { Sprite } from "./sprite.js";
import { Vector2 } from "./vector.js";


export class NPC extends StrongInteractionTarget {


    private id : number;
    private flip : Flip;


    constructor(x : number, y : number, id : number) {

        super(x, y, true);

        this.spr = new Sprite(16, 16);
        this.flip = Flip.None;

        this.hitbox = new Vector2(12, 8);

        this.id = id;
    }


    protected updateLogic(event : CoreEvent) {

        const ANIM_SPEED = 10;

        this.spr.animate(0, 0, 3, ANIM_SPEED, event.step);
    }

    
    protected playerEvent(player : Player, event : CoreEvent) {

        this.flip = player.getPos().x < this.pos.x ? Flip.Horizontal : Flip.None;
    }


    public draw(canvas : Canvas) {

        let bmp = canvas.assets.getBitmap("npc");

        if (!this.inCamera) return;

        canvas.drawSprite(this.spr, bmp, 
            this.pos.x - this.spr.width/2,
            this.pos.y - this.spr.height/2 + 1,
            this.flip);
    }
}
