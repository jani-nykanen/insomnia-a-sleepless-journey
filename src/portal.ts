import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { StrongInteractionTarget } from "./interactiontarget.js";
import { MessageBox } from "./messagebox.js";
import { PortalCallback } from "./objectmanager.js";
import { Player } from "./player.js";
import { ProgressManager } from "./progress.js";
import { Sprite } from "./sprite.js";
import { TransitionEffectType } from "./transition.js";
import { Vector2 } from "./vector.js";


export class Portal extends StrongInteractionTarget {


    private readonly message : MessageBox;
    private readonly progress : ProgressManager;

    private readonly cb : PortalCallback;
    

    constructor(x : number, y : number, message : MessageBox, progress : ProgressManager, cb : PortalCallback) {

        super(x, y, true);

        this.spr = new Sprite(32, 48);

        this.hitbox = new Vector2(16, 8);

        this.message = message;
        this.progress = progress;

        this.cb = cb;
    }


    protected interactionEvent(player : Player, camera : Camera, event : CoreEvent) {

        event.audio.stopMusic();

        event.transition.activate(true, TransitionEffectType.CirleIn,
            1.0/60.0, event => {

                this.cb(event);
            }, [255, 255, 255])
            .setCenter(new Vector2(

                this.pos.x % camera.width,
                (this.pos.y-16) % camera.height));
    }


    protected updateLogic(event : CoreEvent) {

        const ANIM_SPEED = 6;

        this.spr.animate(1, 0, 2, ANIM_SPEED, event.step);
    }


    public draw(canvas : Canvas) {

        if (!this.inCamera) return;

        let bmp = canvas.assets.getBitmap("bigDoor");

        let sx = 0;

        canvas.drawSprite(this.spr, bmp, 
            this.pos.x - 16, 
            this.pos.y - 40);

        for (let i = 0; i < 2; ++ i) {

            sx = this.progress.doesValueExistInArray("orbsDestroyed", i) ? 32 : 0;
            canvas.drawBitmapRegion(bmp,
                i*16 + sx, 0, 16, 48,
                this.pos.x - 16 + i*16, 
                this.pos.y - 40);
        }
    }

}
