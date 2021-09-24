import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { StrongInteractionTarget } from "./interactiontarget.js";
import { MessageBox } from "./messagebox.js";
import { Player } from "./player.js";
import { Sprite } from "./sprite.js";
import { Vector2 } from "./vector.js";


export class Chest extends StrongInteractionTarget {


    private id : number;
    private flip : Flip;
    private opened : boolean;

    private readonly message : MessageBox;


    constructor(x : number, y : number, id : number, message : MessageBox) {

        super(x, y, true);

        this.spr = new Sprite(16, 16);
        this.flip = ((x / 16) | 0) % 2 == 0 ? Flip.None : Flip.Horizontal;

        this.hitbox = new Vector2(12, 8);

        this.id = id;
        this.opened = false;

        this.message = message;
    }


    protected interactionEvent(player : Player, event : CoreEvent) {

        const WAIT_TIME = 60;

        if (this.opened) return;

        let text = <Array<string>> event.localization.findValue(["chest", String(this.id)]);

        if (text == null) return;

        this.message.addMessages(text);
        this.message.activate(WAIT_TIME);

        player.obtainItem(this.id);

        this.opened = true;
        this.canInteract = false;

        this.spr.setFrame(1, 0);
    }


    public draw(canvas : Canvas) {

        let bmp = canvas.assets.getBitmap("chest");

        if (!this.inCamera) return;

        canvas.drawSprite(this.spr, bmp, 
            this.pos.x - this.spr.width/2,
            this.pos.y - this.spr.height/2,
            this.flip);
    }
}