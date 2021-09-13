import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { ObjectManager } from "./objectmanager.js";
import { Stage } from "./stage.js";



export class GameScene implements Scene {


    private stage : Stage;
    private camera : Camera;
    private objects : ObjectManager;


    constructor(param : any, event : CoreEvent) {

        this.camera = new Camera(0, 0, 160, 144);
        this.stage = new Stage(event);
        this.objects = new ObjectManager(this.stage, this.camera);

        this.objects.cameraCheck(this.camera);
    }


    public update(event : CoreEvent) {

        if (this.camera.update(event)) {

            this.objects.checkLoop(this.stage);
            this.camera.checkLoop(this.stage);
        }
        this.stage.update(this.camera, event);
        this.objects.update(this.stage, this.camera, event);
    }


    public redraw(canvas : Canvas) {

        canvas.moveTo();
        canvas.clear(85, 85, 85);

        this.stage.drawBackground(canvas, this.camera);

        this.camera.use(canvas);
        canvas.applyShake();

        this.stage.draw(canvas, this.camera);
        this.objects.draw(canvas);
    }


    public dispose = () : any => <any> null;
}
