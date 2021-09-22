import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { Vector2 } from "./vector.js";



export class MessageBox {


    private queue : Array<string>;
    private sizes : Array<Vector2>
    private currentMessage : string;
    private currentSize : Vector2;

    private charTimer : number;
    private charPos : number;
    private ready : boolean;

    private active : boolean;


    constructor() {

        this.queue = new Array<string> ();
        this.sizes = new Array<Vector2> ();
        this.currentMessage = "";
        this.currentSize = new Vector2();

        this.charTimer = 0;
        this.charPos = 0;
        this.ready = false;

        this.active = false;
    }


    public addMessages(messages : Array<string>) {

        let sm : Array<string>;
        for (let m of messages) {

            this.queue.push(m);

            sm = m.split("\n");
            this.sizes.push(new Vector2(
                Math.max(...sm.map(v => v.length)),
                sm.length
            ));
        }
    }


    public activate() {

        if (this.queue.length == 0) return;

        this.active = true;

        this.charPos = 0;
        this.charTimer = 0;
        this.ready = false;

        this.currentMessage = this.queue.shift();
        this.currentSize = this.sizes.shift().clone();
    }


    public deactivate() {

        this.active = false;
    }


    public update(event : CoreEvent) {

        const CHAR_TIME = 4;

        if (!this.active) return;

        if (!this.ready) {

            if (event.input.anyPressed()) {

                this.ready = true;
                this.charPos = this.currentMessage.length;
            }
            else {

                this.charTimer += event.step;
                if (this.charTimer >= CHAR_TIME) {

                    ++ this.charPos;
                    this.charTimer -= CHAR_TIME;

                    while (this.charPos < this.currentMessage.length &&
                        ["\n", " ", "\t"].includes(this.currentMessage[this.charPos])) {

                        ++ this.charPos;
                    }
                    this.ready = this.charPos == this.currentMessage.length;
                }
            }
        }
        else {
            
            if (event.input.anyPressed()) {

                this.ready = false;

                if (this.queue.length == 0) {

                    this.deactivate();
                }
                else {

                    this.currentMessage = this.queue.shift();
                    this.currentSize = this.sizes.shift().clone();

                    this.charPos = 0;
                    this.charTimer = 0;
                    this.ready = false;
                }
            }
        }
    }


    public draw(canvas : Canvas) {

        const BOX_OFFSET = 2;

        const BOX_COLORS = [
            [255, 255, 255],
            [85, 85, 85],
            [0, 0, 0]
        ];

        if (!this.active) return;

        let w = this.currentSize.x * 8;
        let h = this.currentSize.y * 10;

        let x = canvas.width/2 - w/2;
        let y = canvas.height/2 - h/2;

        for (let i = BOX_COLORS.length-1; i >= 0; -- i) {

            canvas.setFillColor(...BOX_COLORS[i]);
            canvas.fillRect(
                x - BOX_OFFSET - i, 
                y - BOX_OFFSET - i,
                w + (BOX_OFFSET + i)*2,
                h + (BOX_OFFSET + i)*2);
        }

        canvas.drawText(canvas.assets.getBitmap("font"),
            this.currentMessage.substring(0, this.charPos),
            x, y, 0, 2);
    }


    public isActive = () : boolean => this.active;
}
