import { Canvas } from "./canvas";
import { CoreEvent } from "./core.js";
import { WeakInteractionTarget } from "./interactiontarget.js";
import { Player } from "./player.js";
import { Sprite } from "./sprite.js";
import { Vector2 } from "./vector.js";


export class Coin extends WeakInteractionTarget {


    private waveTimer : number;


    constructor(x : number, y : number) {

        super(x, y, true);

        this.spr = new Sprite(16, 16);
        this.spr.setFrame((Math.random() * 8) | 0, 0);

        this.hitbox = new Vector2(12, 12);

        this.waveTimer = Math.random() * (Math.PI*2);
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
        const WAVE_SPEED = 0.1;

        this.spr.animate(0, 0, 7, ANIM_SPEED, event.step);
    
        this.waveTimer = (this.waveTimer + WAVE_SPEED*event.step) % (Math.PI*2);
    }


    protected playerCollisionEvent(player : Player, event : CoreEvent) {

        this.dying = true;
        this.spr.setFrame(0, 1);

        this.waveTimer = 0;
    }


    public draw(canvas : Canvas) {

        const AMPLITUDE = 1;

        if (!this.exist || !this.inCamera) return;

        let py = this.pos.y + Math.round(Math.sin(this.waveTimer) * AMPLITUDE);

        canvas.drawSprite(this.spr, 
            canvas.assets.getBitmap("star"),
            this.pos.x-8, py-8);
    }

}