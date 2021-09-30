import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { Menu, MenuButton } from "./menu.js";
import { MessageBox } from "./messagebox.js";
import { ObjectManager } from "./objectmanager.js";
import { ProgressManager } from "./progress.js";
import { Stage } from "./stage.js";
import { State } from "./types.js";



export class GameScene implements Scene {


    private stage : Stage;
    private camera : Camera;
    private objects : ObjectManager;
    private message : MessageBox;
    private progress : ProgressManager;

    private pauseMenu : Menu;


    constructor(param : any, event : CoreEvent) {

        this.message = new MessageBox();
        this.progress = new ProgressManager();

        this.camera = new Camera(0, 0, 160, 144);
        this.stage = new Stage(this.progress, event);
        this.objects = new ObjectManager(this.stage, this.camera, this.message, this.progress);

        this.objects.cameraCheck(this.camera);

        // TODO: Get names from localization
        this.pauseMenu = new Menu(
            [
                new MenuButton("Resume",
                event => {
                    
                    this.pauseMenu.deactivate();
                }),

                new MenuButton("Respawn",
                event => {

                }),


                new MenuButton("DBG: All Items", 
                event => {

                    for (let i = 0; i < 7; ++ i) {

                        this.progress.setBooleanProperty("item" + String(i), true);
                    }
                    this.pauseMenu.deactivate();
                }),

                new MenuButton("Quit game",
                event => {

                    this.pauseMenu.deactivate();
                })
            ]
        );
    }


    public update(event : CoreEvent) {

        if (event.transition.isActive()) {

            if (this.camera.wasForcedToMove()) {

                this.objects.cameraCheck(this.camera);
            }
            return;
        }

        if (this.pauseMenu.isActive()) {

            this.pauseMenu.update(event);
            return;
        }

        if (this.message.isActive()) {

            this.message.update(event);
            return;
        }

        if (event.input.getAction("start") == State.Pressed) {

            this.pauseMenu.activate(0);
            return;
        }

        if (this.camera.update(event)) {

            this.objects.checkLoop(this.stage);
            this.camera.checkLoop(this.stage);
        }
        this.stage.update(this.camera, event);
        this.objects.update(this.stage, this.camera, event);
    }


    private drawHUD(canvas : Canvas) {

        let font = canvas.assets.getBitmap("fontBig");

        canvas.drawText(font, ":", 2, 1, 0, 0);
        canvas.drawText(font, ";" + String(this.progress.getNumberProperty("stars")),
            13, 1, -8, 0);

        canvas.drawText(font, "=", canvas.width-36, 1, 0, 0);
        canvas.drawText(font, ";" + String(this.progress.getNumberProperty("kills")),
            canvas.width-36 + 11, 1, -8, 0);
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
        this.drawHUD(canvas);
        this.message.draw(canvas);

        this.pauseMenu.draw(canvas, 0, 0, 0, 10, true); 
    }


    public dispose = () : any => <any> null;
}
