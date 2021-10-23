import { Camera } from "./camera.js";
import { Canvas, Flip } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { StrongInteractionTarget } from "./interactiontarget.js";
import { MessageBox } from "./messagebox.js";
import { Player } from "./player.js";
import { Sprite } from "./sprite.js";
import { TransitionEffectType } from "./transition.js";
import { Vector2 } from "./vector.js";


export class Door extends StrongInteractionTarget {


    private open : boolean;
    private pair : Door;

    private readonly message : MessageBox;
    
    public readonly id : number;
    public readonly inside : boolean;


    constructor(x : number, y : number, id : number, inside : boolean, message : MessageBox) {

        const ALWAYS_OPEN = [0, 2, 9, 10, 11, 12, 13, 16];

        super(x, y, true);

        this.spr = new Sprite(16, 32);

        this.hitbox = new Vector2(10, 8);

        this.open = ALWAYS_OPEN.includes(id) || inside;
        this.id = id;
        this.inside = inside;
        this.pair = null;

        this.message = message;
    }


    public markPair(door : Door) {

        if (this.pair != null) return;

        this.pair = door;
    }


    protected interactionEvent(player : Player, camera : Camera, event : CoreEvent) {

        if (this.pair == null) return;

        let msg : Array<string>;
        if (!this.open) {

            if (!player.progress.doesValueExistInArray("items", 2)) {

                msg = event.localization.findValue(["locked"]);
            }
            else {

                msg = event.localization.findValue(["open"]);
                this.open = true;

                player.progress.addValueToArray("doors", this.id, true);
            }

            if (msg == null) return;

            this.message.addMessages(msg);
            this.message.activate();

            return;
        }

        let p = player.getPos();

        player.setUsePose(this.pos.x);

        this.canInteract = false;

        event.transition.activate(true, TransitionEffectType.CirleIn, 1.0/30.0,
            event => {

                this.canInteract = true;

                player.teleportTo(
                    Vector2.add(this.pair.getPos(), new Vector2(0, 1)), 
                    true, !this.inside);
                camera.focusOnObject(player);

                p = player.getPos();
                event.transition.setCenter(new Vector2(p.x % 160, p.y % 144));
            })
            .setCenter(new Vector2(p.x % 160, p.y % 144));
    }


    public draw(canvas : Canvas) {

        let bmp = canvas.assets.getBitmap("door");

        if (!this.inCamera || this.open) return;

        canvas.drawSprite(this.spr, bmp, 
            this.pos.x - this.spr.width/2,
            this.pos.y - 24);
    }


    public forceOpen() {

        this.open = true;
    }
}
