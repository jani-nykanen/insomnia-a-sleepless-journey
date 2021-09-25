import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { MessageBox } from "./messagebox.js";
import { ObjectManager } from "./objectmanager.js";
import { ProgressManager } from "./progress.js";
import { Stage } from "./stage.js";



export class GameScene implements Scene {


    private stage : Stage;
    private camera : Camera;
    private objects : ObjectManager;
    private message : MessageBox;
    private progress : ProgressManager;


    constructor(param : any, event : CoreEvent) {

        this.message = new MessageBox();
        this.progress = new ProgressManager();

        this.camera = new Camera(0, 0, 160, 144);
        this.stage = new Stage(this.progress, event);
        this.objects = new ObjectManager(this.stage, this.camera, this.message, this.progress);

        this.objects.cameraCheck(this.camera);
    }


    public update(event : CoreEvent) {

        if (event.transition.isActive()) {

            if (this.camera.wasForcedToMove()) {

                this.objects.cameraCheck(this.camera);
            }
            return;
        }

        if (this.message.isActive()) {

            this.message.update(event);
            return;
        }

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

        this.stage.drawBackground(canvas, this.camera, this.objects.isPlayerInside());

        this.camera.use(canvas);
        canvas.applyShake();

        this.stage.draw(canvas, this.camera);
        this.objects.draw(canvas);

        canvas.moveTo();
        this.message.draw(canvas);
    }


    public dispose = () : any => <any> null;
}
