import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { Menu, MenuButton } from "./menu.js";
import { MessageBox } from "./messagebox.js";
import { ObjectManager } from "./objectmanager.js";
import { ProgressManager } from "./progress.js";
import { Sprite } from "./sprite.js";
import { Stage } from "./stage.js";
import { State } from "./types.js";



export class GameScene implements Scene {


    private stage : Stage;
    private camera : Camera;
    private objects : ObjectManager;
    private message : MessageBox;
    private progress : ProgressManager;

    private sprHeart : Sprite;

    private pauseMenu : Menu;


    constructor(param : any, event : CoreEvent) {

        this.message = new MessageBox(event);
        this.progress = new ProgressManager();

        this.camera = new Camera(0, 0, 160, 144);
        this.stage = new Stage(this.progress, event);
        this.objects = new ObjectManager(this.stage, this.camera, this.message, this.progress);

        this.objects.cameraCheck(this.camera);

        this.sprHeart = new Sprite(16, 16);

        // TODO: Get names from localization
        this.pauseMenu = new Menu(
            [
                new MenuButton("Resume",
                event => {
                    
                    this.pauseMenu.deactivate();
                }),

                new MenuButton("Respawn",
                event => {

                    this.message.addMessages([event.localization.findValue(["respawn"])]);
                    this.message.activate(0, true, event => {

                        console.log("To be implemented");
                    });
                }),

                new MenuButton("Save Game",
                event => {

                }),

                new MenuButton("DEBUG", 
                event => {

                    for (let i = 0; i < 11; ++ i) {
                        
                        // if (i == 6) continue;
                        this.progress.setBooleanProperty("item" + String(i), true);
                    }
                    this.progress.setBooleanProperty("fansEnabled");

                    this.pauseMenu.deactivate();
                }),

                new MenuButton("Quit Game",
                event => {

                    this.pauseMenu.deactivate();
                })
            ]
        );
    }


    private updateHeart(event : CoreEvent) {

        const HEARTBEAT_WAIT = 50;
        const HEARTBEAT_TIME = 10;

        this.sprHeart.animate(0, 0, 1, 
            this.sprHeart.getColumn() == 0 ? HEARTBEAT_WAIT : HEARTBEAT_TIME,
            event.step);
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

        if (this.pauseMenu.isActive()) {

            this.pauseMenu.update(event);
            return;
        }

        if (event.input.getAction("start") == State.Pressed) {

            this.pauseMenu.activate(0);
            return;
        }

        this.updateHeart(event);

        if (this.camera.update(event)) {

            this.objects.checkLoop(this.stage);
            this.camera.checkLoop(this.stage);
        }
        this.stage.update(this.camera, event);
        this.objects.update(this.stage, this.camera, event);
    }


    private drawHUD(canvas : Canvas) {

        let font = canvas.assets.getBitmap("fontBig");
        let bmpHearts = canvas.assets.getBitmap("hearts");

        canvas.drawText(font, ":", 2, 1, 0, 0);
        canvas.drawText(font, ";" + String(this.progress.getNumberProperty("stars")),
            13, 1, -8, 0);

        canvas.drawText(font, "=", canvas.width-36, 1, 0, 0);
        canvas.drawText(font, ";" + String(this.progress.getNumberProperty("kills")),
            canvas.width-36 + 11, 1, -8, 0);

        let health = this.objects.getPlayerHealth();
        let maxHealth = this.objects.getPlayerMaxHealth();

        let sy = 0;
        let sx = 0;
        for (let i = 0; i < maxHealth; ++ i) {

            sx = 0;
            sy = 16;

            if (i < health) {

                if (i == health-1)
                    sx = this.sprHeart.getColumn() * 16;

                sy = 0;
            }

            canvas.drawBitmapRegion(bmpHearts, sx, sy, 16, 16,
                -1 + i*12, canvas.height-15);
        }
    }


    public redraw(canvas : Canvas) {

        canvas.moveTo();
        canvas.clear(85, 85, 85);

        this.stage.drawBackground(canvas, this.camera, this.objects.isPlayerInside());

        this.camera.use(canvas);
        canvas.applyShake();

        this.stage.draw(canvas, this.camera, this.objects.isPlayerInside());
        this.objects.draw(canvas);

        canvas.moveTo();
        this.drawHUD(canvas);

        if (!this.pauseMenu.isActive())
            this.message.draw(canvas);

        if (this.pauseMenu.isActive()) {

            canvas.setFillColor(0, 0, 0, 0.67);
            canvas.fillRect();

            if (this.message.isActive()) {

                this.message.draw(canvas);
            }
            else {

                this.pauseMenu.draw(canvas, 0, 0, 0, 10, true); 
            }
        }
    }


    public dispose = () : any => <any> null;
}
