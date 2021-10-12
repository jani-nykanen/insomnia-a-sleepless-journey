import { ActivableObject } from "./activableobject.js";
import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { Menu, MenuButton } from "./menu.js";
import { Vector2 } from "./vector.js";


export const drawBox = (canvas : Canvas, x : number, y : number, w : number, h : number) : void => {

    const BOX_OFFSET = 2;
    const BOX_COLORS = [
        [85, 85, 170],
        [170, 170, 255],
        [255, 255, 255],
        [0, 0, 0]
    ];

    for (let i = BOX_COLORS.length-1; i >= 0; -- i) {

        canvas.setFillColor(...BOX_COLORS[i]);
        canvas.fillRect(
            x - BOX_OFFSET - i, 
            y - BOX_OFFSET - i,
            w + (BOX_OFFSET + i)*2,
            h + (BOX_OFFSET + i)*2);
    }
}


export class MessageBox extends ActivableObject {


    private queue : Array<string>;
    private sizes : Array<Vector2>
    private currentMessage : string;
    private currentSize : Vector2;

    private charTimer : number;
    private charPos : number;
    private ready : boolean;

    private waitTimer : number;
    private waveTimer : number;

    private yesNoBox : Menu;
    private confirmEvent : (event : CoreEvent) => void;
    private confirm : boolean;


    constructor(event : CoreEvent) {

        super();

        this.queue = new Array<string> ();
        this.sizes = new Array<Vector2> ();
        this.currentMessage = "";
        this.currentSize = new Vector2();

        this.charTimer = 0;
        this.charPos = 0;
        this.ready = false;

        this.active = false;

        this.waitTimer = 0;
        this.waveTimer = 0;

        let loc = event.localization;
    
        this.yesNoBox = new Menu(
            [
                new MenuButton(loc.findValue(["yes"]), event => {

                    this.deactivate();
                    this.confirmEvent(event);
                }),
                new MenuButton(loc.findValue(["no"]), event => {

                    this.deactivate();
                }),
            ]
        );
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


    public activate(waitTime = 0, confirm = false, 
        confirmEvent = (event : CoreEvent) => {}) {

        if (this.queue.length == 0) return;

        this.active = true;

        this.charPos = 0;
        this.charTimer = 0;
        this.ready = false;

        this.currentMessage = this.queue.shift();
        this.currentSize = this.sizes.shift().clone();

        this.waitTimer = waitTime;

        this.confirm = confirm;
        this.confirmEvent = confirmEvent;

        this.yesNoBox.activate(1);
    }


    public deactivate() {

        this.queue.length = 0;
        this.sizes.length = 0;

        this.active = false;
    }


    public update(event : CoreEvent) {

        const WAVE_SPEED = 0.1;
        const CHAR_TIME = 4;

        if (!this.active) return;

        if (this.waitTimer > 0) {

            this.waitTimer -= event.step;
            return;
        }

        if (!this.ready) {

            this.waveTimer = 0.0;

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
            
            this.waveTimer = (this.waveTimer + WAVE_SPEED) % (Math.PI * 2);

            if (this.confirm && this.queue.length == 0) {

                this.yesNoBox.update(event);
            } 
            else if (event.input.anyPressed()) {

                this.ready = false;

                if (this.queue.length == 0) {

                    this.confirmEvent(event);
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

        const SYMBOL_AMPLITUDE = 1.0;

        if (!this.active || this.waitTimer > 0) return;

        let font = canvas.assets.getBitmap("font");

        let w = this.currentSize.x * 8;
        let h = this.currentSize.y * 10;

        let x = canvas.width/2 - w/2;
        let y = canvas.height/2 - h/2;

        drawBox(canvas, x, y, w, h);

        canvas.drawText(font,
            this.currentMessage.substring(0, this.charPos),
            x, y, 0, 2);

        let symbolOffset = Math.round(Math.sin(this.waveTimer) * SYMBOL_AMPLITUDE);

        if (this.ready) {

            if (this.confirm && this.queue.length == 0) {

                this.yesNoBox.draw(canvas, w/4, h-2, 0, 12, true);
            }
            else {

                canvas.drawBitmapRegion(font, 8, 0, 8, 8,
                    x + w - 2, y + h + symbolOffset - 2);
            }
        }
    }


    public isActive = () : boolean => this.active;
}
