import { Canvas } from "./canvas";
import { CoreEvent } from "./core.js";
import { WeakInteractionTarget } from "./interactiontarget.js";
import { Player } from "./player.js";
import { Sprite } from "./sprite.js";
import { Vector2 } from "./vector.js";


export class Coin extends WeakInteractionTarget {


    constructor(x : number, y : number) {

        super(x, y, true);

        this.spr = new Sprite(16, 16);

        this.spr.setFrame((Math.random() * 4) | 0, 0);

        this.hitbox = new Vector2(12, 12);
    }


    protected outsideCameraEvent() {

        if (this.dying)
            this.exist = false;
    }


    protected die(event : CoreEvent) : boolean {

        const DEATH_SPEED = 5;

        this.spr.animate(1, 0, 4, DEATH_SPEED, event.step);

        return this.spr.getColumn() == 4;
    }


    public updateLogic(event : CoreEvent) {

        const ANIM_SPEED = 7;

        this.spr.animate(0, 0, 3, ANIM_SPEED, event.step);
    }


    protected playerCollisionEvent(player : Player, event : CoreEvent) {

        this.dying = true;
        this.spr.setFrame(0, 1);
    }


    public draw(canvas : Canvas) {

        if (!this.exist || !this.inCamera) return;

        canvas.drawSprite(this.spr, 
            canvas.assets.getBitmap("coin"),
            this.pos.x-8, this.pos.y-8);
    }

}