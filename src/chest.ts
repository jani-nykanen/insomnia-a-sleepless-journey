import { Camera } from "./camera.js";
import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { HintBox } from "./hintbox.js";
import { StrongInteractionTarget } from "./interactiontarget.js";
import { MessageBox } from "./messagebox.js";
import { Player } from "./player.js";
import { Sprite } from "./sprite.js";
import { Vector2 } from "./vector.js";


const FACING_DIR = [
    Flip.None, Flip.Horizontal, Flip.None,
    Flip.Horizontal, Flip.None, Flip.None,
    Flip.Horizontal, Flip.None, Flip.Horizontal,
    Flip.None, Flip.None,
];


export class Chest extends StrongInteractionTarget {


    private flip : Flip;
    private opened : boolean;

    private readonly message : MessageBox;
    private readonly hintbox : HintBox;
    
    public readonly id : number;


    constructor(x : number, y : number, id : number, message : MessageBox,
        hintbox : HintBox) {

        super(x, y, true);

        this.spr = new Sprite(16, 16);
        this.flip = FACING_DIR[id];

        this.hitbox = new Vector2(12, 8);

        this.id = id;
        this.opened = false;

        this.message = message;
        this.hintbox = hintbox;
    }


    protected interactionEvent(player : Player, camera : Camera, event : CoreEvent) {

        const HINT_ID = [5, 6, -1, 7, 8, 9, -1, -1, -1, -1, -1, 10];
        const WAIT_TIME = 45;

        if (this.opened) return;

        let text = <Array<string>> event.localization.findValue(["chest", String(this.id)]);

        if (text == null) return;

        event.audio.playSample(event.assets.getSample("item"), 0.40);

        event.audio.pauseMusic();

        this.message.addMessages(text);
        this.message.activate(WAIT_TIME, false, event => {

            if (this.id < HINT_ID.length && HINT_ID[this.id] >= 0) {

                this.hintbox.setMessage(event.localization.findValue(["hints", String(HINT_ID[this.id])]));
                this.hintbox.activate();
            }

            event.audio.resumeMusic();
        });

        player.setObtainItemPose(this.id);
        player.progress.addValueToArray("items", this.id, true);

        this.forceOpen();
    }


    public draw(canvas : Canvas) {

        let bmp = canvas.assets.getBitmap("chest");

        if (!this.inCamera) return;

        canvas.drawSprite(this.spr, bmp, 
            this.pos.x - this.spr.width/2,
            this.pos.y - this.spr.height/2,
            this.flip);
    }


    public forceOpen() {

        this.opened = true;
        this.canInteract = false;

        this.spr.setFrame(1, 0);
    }
}
