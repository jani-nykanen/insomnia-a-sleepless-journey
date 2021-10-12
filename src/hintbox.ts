import { ActivableObject } from "./activableobject.js";
import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";


export class HintBox extends ActivableObject {


    private message : string;
    private width : number;
    private height : number;


    constructor() {

        super();

        this.message = "";
        this.width = 0;
    }


    public setMessage(message : string) {

        if (this.message.length != 0) return;

        let messages = message.split("\n");
        this.width = Math.max(...messages.map(m => m.length));
        this.height = messages.length;

        this.message = message;
    }


    public update(camera : Camera, event : CoreEvent) {

        if (!this.active) return;

        if (camera.isMoving() || event.transition.isFadingIn()) {

            this.message = "";
            this.active = false;
        }
    }


    public draw(canvas : Canvas) {

        const TOP_OFF = 20;
        const YOFF = 0;

        if (!this.active) return;

        let font = canvas.assets.getBitmap("fontYellow");

        let x = canvas.width/2 - this.width*4;
        
        canvas.setFillColor(255, 255, 255, 0.33);
        canvas.fillRect(x-2, TOP_OFF-2, this.width*8 + 4, this.height*8 + 4);

        canvas.drawText(font, this.message, x, TOP_OFF, 0, YOFF);
    }   
}
