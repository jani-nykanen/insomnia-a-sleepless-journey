import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";



export class GameScene implements Scene {


    constructor(param : any, event : CoreEvent) {

    }


    public update(event : CoreEvent) {

    }


    public redraw(canvas : Canvas) {

        canvas.clear(85, 85, 85);

        canvas.drawBitmap(canvas.assets.getBitmap("tileset"),
            0, 0);

        canvas.drawText(canvas.assets.getBitmap("font"),
            "Hello world?", 16, 72, -1, 0);
    }


    public dispose = () : any => <any> null;
}
