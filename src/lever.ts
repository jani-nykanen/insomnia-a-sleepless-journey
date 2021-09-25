import { Camera } from "./camera.js";
import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { StrongInteractionTarget } from "./interactiontarget.js";
import { MessageBox } from "./messagebox.js";
import { Player } from "./player.js";
import { Sprite } from "./sprite.js";
import { Vector2 } from "./vector.js";


export class Lever extends StrongInteractionTarget {

    private activated : boolean;

    private readonly message : MessageBox;


    constructor(x : number, y : number, message : MessageBox) {

        super(x, y, true);

        this.spr = new Sprite(16, 16);

        this.hitbox = new Vector2(12, 8);

        this.activated = false;

        this.message = message;
    }


    protected interactionEvent(player : Player, camera : Camera, event : CoreEvent) {

        const WAIT_TIME = 60;

        if (this.activated) return;

        let text = <Array<string>> event.localization.findValue(["lever"]);

        if (text == null) return;

        this.message.addMessages(text);
        this.message.activate(WAIT_TIME);

        event.shake(WAIT_TIME, 2.0);

        this.activated = true;
        this.canInteract = false;

        this.spr.setFrame(1, 0);

        player.setUsePose();
        player.progress.setBooleanProperty("fansEnabled");
    }


    public draw(canvas : Canvas) {

        let bmp = canvas.assets.getBitmap("lever");

        if (!this.inCamera) return;

        canvas.drawSprite(this.spr, bmp, 
            this.pos.x - this.spr.width/2,
            this.pos.y - this.spr.height/2);
    }
}
