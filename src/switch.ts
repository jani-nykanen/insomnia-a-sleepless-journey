import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { boxOverlay, WeakGameObject } from "./gameobject.js";
import { Player } from "./player.js";
import { Sprite } from "./sprite.js";
import { Stage } from "./stage.js";
import { Vector2 } from "./vector.js";


export class Switch extends WeakGameObject {


    private down : boolean;


    constructor(x : number, y : number) {

        super(x, y, true);

        this.down = false;

        this.spr = new Sprite(16, 16);

        this.center = new Vector2(0, -6);
        this.hitbox = new Vector2(8, 4);
    }


    public updateLogic(event : CoreEvent) {

        // ...
    }


    public playerCollision(player : Player, stage : Stage, event : CoreEvent) : boolean {

        const PLAYER_JUMP = -3.0;
        const JUMP_EPS = 0.1;

        if (this.down || !this.inCamera) return false;

        let sy = player.getSpeed().y;
        if (sy <= JUMP_EPS) return false;

        if (player.overlayObject(this)) {

            this.down = true;
            this.spr.setFrame(1, 0);

            player.makeJump(PLAYER_JUMP);

            stage.toggleSpecialBlocks();

            return true;
        }

        return false;
    }


    public draw(canvas : Canvas) {

        if (!this.inCamera) return;

        canvas.drawSprite(this.spr, 
            canvas.assets.getBitmap("switch"),
            this.pos.x-8, this.pos.y-16);
    }


    public reset() {

        this.down = false;
        this.spr.setFrame(0, 0);
    }
}
