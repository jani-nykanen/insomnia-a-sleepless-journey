import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { StrongInteractionTarget } from "./interactiontarget.js";
import { MessageBox } from "./messagebox.js";
import { Player } from "./player.js";
import { ProgressManager } from "./progress.js";
import { Sprite } from "./sprite.js";
import { TransitionEffectType } from "./transition.js";
import { Vector2 } from "./vector.js";


export class Orb extends StrongInteractionTarget {


    private wave : number;
    private broken : boolean;

    private itemCount : number;

    private readonly message : MessageBox;
    private readonly progress : ProgressManager;
    
    public readonly id : number;


    constructor(x : number, y : number, id : number, message : MessageBox, progress : ProgressManager) {

        super(x, y, true);

        this.spr = new Sprite(32, 32);
        this.spr.setFrame(id, 0);

        this.hitbox = new Vector2(16, 8);

        this.wave = 0.0;
        this.broken = false;
        this.id = id;

        this.message = message;
        this.progress = progress;

        this.itemCount = 0;

        // this.offCameraRadius = 16;
    }


    public setItemCount(c : number) {

        this.itemCount = c;
    }


    protected interactionEvent(player : Player, camera : Camera, event : CoreEvent) {

        // let msg : Array<string>;    
        
        player.setUsePose(this.pos.x, true);

        event.audio.pauseMusic();
        event.audio.playSample(event.assets.getSample("orb"), 0.50);

        this.message.addMessages([event.localization.findValue(["orb", String(this.id)])]);
        this.message.activate(1, false, event => {

            event.audio.resumeMusic();
        });

        event.transition.activate(true,TransitionEffectType.Fade,
            1.0/60.0, event => {

                this.breakSeal();
                this.progress.addValueToArray("orbsDestroyed", this.id, true);

            }, [255, 255, 255], 4);
    }


    protected updateLogic(event : CoreEvent) {

        const WAVE_SPEED = 0.067;

        this.wave = (this.wave + WAVE_SPEED*event.step) % (Math.PI*2);
    }


    public draw(canvas : Canvas) {

        const Y_OFF = -4;
        const AMPLITUDE = 3;

        if (!this.inCamera) return;

        let bmp = canvas.assets.getBitmap("orb");

        let y = this.pos.y-24;
        if (!this.broken) 
            y += Y_OFF + Math.round(Math.sin(this.wave) * AMPLITUDE);
        else
            y += 1;

        canvas.drawSprite(this.spr, bmp, 
            this.pos.x - this.spr.width/2, y);
    }


    public postDraw(canvas : Canvas) {

        const TYPE = ["stars", "kills"];
        const SYMBOL = [":", "="];
        const TEXT_OFF = -45;

        if (!this.inCamera || this.broken) return;

        let s = String(String(this.progress.getNumberProperty(TYPE[this.id], 0))) 
            + "/" + String(this.itemCount);

        let font = canvas.assets.getBitmap("fontBig");

        canvas.drawText(font, SYMBOL[this.id], this.pos.x - s.length*4 - 8, 
            this.pos.y+TEXT_OFF, -8, 0, true);
        canvas.drawText(font, s, this.pos.x, this.pos.y+TEXT_OFF, -8, 0, true);
    }


    public breakSeal() {

        this.broken = true;
        this.spr.setFrame(this.id, 1);

        this.canInteract = false;
    }
}
