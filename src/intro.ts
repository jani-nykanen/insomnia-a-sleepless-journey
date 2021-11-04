import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { GameScene } from "./game.js";
import { MessageBox } from "./messagebox.js";
import { TitleScreen } from "./titlescreen.js";
import { TransitionEffectType } from "./transition.js";
import { Vector2 } from "./vector.js";


export class Intro implements Scene {


    private phase : number;
    private timer : number;


    constructor(param : any, event : CoreEvent) {

        event.transition.activate(false, TransitionEffectType.Fade, 
            1.0/30.0, null, [0, 0, 0], 4);

        this.phase = 0;
        this.timer = 0;
    }


    public update(event : CoreEvent) {

        const CHANGE_TIME = 60;

        if (event.transition.isActive()) return;

        if ((this.timer += event.step) >= CHANGE_TIME ||
            event.input.anyPressed()) {

            event.transition.activate(true, TransitionEffectType.Fade,
                1.0/30.0, event => {
                    
                    if ((++ this.phase) == 2) {

                        event.changeScene(TitleScreen);
                    }
                }, [0, 0, 0], 4);

            this.timer = 0;
        }
    }


    public redraw(canvas : Canvas) {

        canvas.clear(0, 0, 0);

        canvas.drawBitmapRegion(canvas.assets.getBitmap("intro"),
            this.phase*160, 0, 160, 144, 0, 0);
    }


    public dispose = () : any => <any> false;

}
