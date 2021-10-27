import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { HintBox } from "./hintbox.js";
import { WorldMap } from "./map.js";
import { Menu, MenuButton } from "./menu.js";
import { MessageBox } from "./messagebox.js";
import { ObjectManager } from "./objectmanager.js";
import { ProgressManager } from "./progress.js";
import { SaveManager } from "./savemanager.js";
import { saveGame } from "./savepoint.js";
import { Sprite } from "./sprite.js";
import { Stage } from "./stage.js";
import { TitleScreen } from "./titlescreen.js";
import { TransitionEffectType } from "./transition.js";
import { State } from "./types.js";


const THEME_VOLUME = 0.50;


export class GameScene implements Scene {


    private stage : Stage;
    private camera : Camera;
    private objects : ObjectManager;
    private message : MessageBox;
    private progress : ProgressManager;
    private worldMap : WorldMap;
    private saveManager : SaveManager;
    private hintbox : HintBox;

    private sprHeart : Sprite;

    private pauseMenu : Menu;


    constructor(param : any, event : CoreEvent) {

        this.message = new MessageBox(event);
        this.progress = new ProgressManager();
        this.saveManager = new SaveManager(this.progress);
        this.hintbox = new HintBox();

        this.camera = new Camera(0, 0, 160, 144);
        this.stage = new Stage(this.progress, event);
        this.objects = new ObjectManager(this.stage, this.camera, 
            this.message, this.progress, 
            this.saveManager, this.hintbox, event);
        this.worldMap = new WorldMap(this.stage, this.progress, event);

        this.objects.cameraCheck(this.camera);

        let p = this.camera.getRealPosition();
        this.progress.addValueToArray("roomVisited", (p.y * Math.floor(this.stage.width/10) + p.x) | 0, true);

        this.sprHeart = new Sprite(16, 16);

        let loc = event.localization;

        // TODO: Get names from localization
        this.pauseMenu = new Menu(
            [
                new MenuButton(loc.findValue(["pauseMenu", "0"]),
                event => {
                    
                    this.pauseMenu.deactivate();
                }),

                new MenuButton(loc.findValue(["pauseMenu", "1"]),
                event => {

                    this.message.addMessages(event.localization.findValue(["respawn"]));
                    this.message.activate(0, true, event => {

                        this.objects.killPlayer(event);
                        this.pauseMenu.deactivate();
                    });
                }),

                new MenuButton(loc.findValue(["pauseMenu", "2"]),
                event => {

                    saveGame(this.message, this.saveManager, event);
                }),

                new MenuButton(loc.findValue(["pauseMenu", "3"]),
                event => {

                    if (this.activateMap(() => {
                            this.pauseMenu.activate(3);
                        }, event)) {

                        this.pauseMenu.deactivate();
                    }
                }),

                new MenuButton("DEBUG", 
                event => {

                    for (let i = 0; i <= 12; ++ i) {

                        this.progress.addValueToArray("items", i, true);
                    }
                    this.progress.setBooleanProperty("fansEnabled");
                    this.progress.setBooleanProperty("switchState",
                        !this.progress.getBooleanProperty("switchState"));

                    this.stage.toggleSpecialBlocks();

                    this.pauseMenu.deactivate();
                }),

                new MenuButton(loc.findValue(["pauseMenu", "4"]),
                event => {

                    this.message.addMessages(loc.findValue(["quitGame"]));
                    this.message.activate(0, true, event => {

                        this.pauseMenu.deactivate();
                        event.transition.activate(true, TransitionEffectType.BoxVertical,
                            1.0/30.0, event => {

                                event.changeScene(TitleScreen);
                            });
                    });
                })
            ]
        );

        if (param != null && Number(param) == 1) {

            this.loadGame();
        }

        event.audio.fadeInMusic(event.assets.getSample("theme"), THEME_VOLUME, 1000);
    }


    private loadGame() {

        let data : any;

        try {

            data = this.saveManager.load();
            if (data == null) {

                return;
            }
        }
        catch(e) {

            console.log(e);
            return;
        }

        this.progress.recoverFromJSON(data);
        this.objects.reinitializeObjectsByProgress(this.camera);

        if (this.progress.getBooleanProperty("switchState")) {

            this.stage.toggleSpecialBlocks();
        }
    }


    private activateMap(cb : (event : CoreEvent) => void, event : CoreEvent): boolean {

        if (!this.progress.doesValueExistInArray("items", 11)) {

            this.message.addMessages(event.localization.findValue(["noMap"]));
            this.message.activate(0, false, cb);
            return false;
        }

        this.worldMap.activate(this.stage, this.objects, this.camera);

        return true;
    }


    private updateHeart(event : CoreEvent) {

        const HEARTBEAT_WAIT = 50;
        const HEARTBEAT_TIME = 10;

        this.sprHeart.animate(0, 0, 1, 
            this.sprHeart.getColumn() == 0 ? HEARTBEAT_WAIT : HEARTBEAT_TIME,
            event.step);
    }


    public update(event : CoreEvent) {

        this.hintbox.update(this.camera, event);

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

        if (this.worldMap.isActive()) {

            this.worldMap.update(event);
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

        if (event.input.getAction("map") == State.Pressed) {

            this.activateMap(() => {}, event);
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


    private drawHUD(canvas : Canvas, drawTarget = false) {

        const X_OFF = -8;

        let font = canvas.assets.getBitmap("fontBig");
        let bmpHearts = canvas.assets.getBitmap("hearts");

        let s = String(String(this.progress.getNumberProperty("stars", 0)));
        if (drawTarget)
            s += "/" + this.objects.getStarCount();

        canvas.drawText(font, ":", 2, 1, 0, 0);
        canvas.drawText(font, ";" + s, 13, 1, X_OFF, 0);

        let kills = this.progress.getNumberProperty("kills", 0);

        s = String(kills);
        if (drawTarget)
            s += "/" + this.objects.getEnemyCount();

        let shift = (s.length-1) * (-X_OFF);

        canvas.drawText(font, "=", canvas.width-36 - shift, 1, 0, 0);
        canvas.drawText(font, ";" + s, canvas.width-36 + 11 - shift, 1, X_OFF, 0);

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

        if (!this.pauseMenu.isActive())
            this.drawHUD(canvas);

        this.hintbox.draw(canvas);
        this.worldMap.draw(canvas);

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

            this.drawHUD(canvas, true);
        }
    }


    public dispose = () : any => <any> null;
}
