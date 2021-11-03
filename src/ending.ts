import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { MessageBox } from "./messagebox.js";
import { TransitionEffectType } from "./transition.js";


export class Ending implements Scene {


    private message : MessageBox;

    private drawEnding : boolean;


    constructor(param : any, event : CoreEvent) {

        this.message = new MessageBox(event);
    
        event.transition.activate(false, TransitionEffectType.Fade, 1.0/60.0, null,
            [255, 255, 255], 8);

        this.drawEnding = false;

        this.message.addMessages(event.localization.findValue(["ending"]));
        this.message.activate(0, false, event => {

            event.transition.activate(false, TransitionEffectType.Fade,
                1.0/120.0, null, [0, 0, 0], 8);

            this.drawEnding = true;
        });
    }


    public update(event : CoreEvent) {

        if (event.transition.isActive()) return;

        this.message.update(event);
    }


    public redraw(canvas : Canvas) {

        canvas.clear(0, 0, 0);

        this.message.draw(canvas, false);

        let bmp = canvas.assets.getBitmap("theEnd");
        if (this.drawEnding) {

            canvas.drawBitmap(bmp,
                canvas.width/2 - bmp.width/2,
                canvas.height/2 - bmp.height/2);
        }
    }


    public dispose = () : any => <any>0;

}
