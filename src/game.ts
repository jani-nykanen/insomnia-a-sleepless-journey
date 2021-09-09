import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { Stage } from "./stage.js";



export class GameScene implements Scene {


    private stage : Stage;
    private camera : Camera;


    constructor(param : any, event : CoreEvent) {

        this.camera = new Camera(0, 1, 160, 144);
        this.stage = new Stage(event);
    }


    public update(event : CoreEvent) {

        this.camera.debugControl(event);
        this.camera.update(event);
        this.stage.update(event);
    }


    public redraw(canvas : Canvas) {

        canvas.moveTo();
        canvas.clear(85, 85, 85);

        this.stage.drawBackground(canvas, this.camera);

        this.camera.use(canvas);
        this.stage.drawTileLayers(canvas, this.camera);
    }


    public dispose = () : any => <any> null;
}
