import { Canvas } from "./canvas.js";
import { Scene, CoreEvent } from "./core.js";
import { GameScene } from "./game.js";
import { Menu, MenuButton } from "./menu.js";
import { MessageBox } from "./messagebox.js";
import { TransitionEffectType } from "./transition.js";
import { State } from "./types.js";
import { Vector2 } from "./vector.js";


const TITLE_MUSIC_VOLUME = 0.50;


export class TitleScreen implements Scene {


    private menu : Menu;
    private loadGame : boolean;
    private message : MessageBox;


    private phase : number;
    private enterTimer : number;


    constructor(param : any, event : CoreEvent) {

        this.phase = param == null ? 1 : 0;
        this.enterTimer = 1.0;

        this.loadGame = false;
        this.menu = new Menu(
            [
                new MenuButton(event.localization.findValue(["titleMenu", "0"]),
                event => {

                    this.goToGame(false, event);
                }),

                new MenuButton(event.localization.findValue(["titleMenu", "1"]),
                event => {

                    let success = true;
                    try {

                        if (window.localStorage.getItem("__jn_metroidvania3__save") == null) {

                            success = false;
                        }
                    }
                    catch (e) {

                        success = false;
                    }

                    if (!success) {

                        this.message.addMessages(event.localization.findValue(["loadError"]));
                        this.message.activate();
                    }
                    else {

                        this.goToGame(true, event);
                    }
                })
            ]
        );
        this.menu.activate(0);
    
        this.message = new MessageBox(event);

        event.audio.fadeInMusic(event.assets.getSample("title"), TITLE_MUSIC_VOLUME, 1000);

        event.transition.activate(false, TransitionEffectType.CirleIn,
            1.0/30.0, null)
            .setCenter(new Vector2(80, 72));
    }


    private goToGame(load : boolean, event : CoreEvent) {

        event.audio.stopMusic();

        this.loadGame = load;
        event.transition.activate(true, TransitionEffectType.CirleIn,
            1.0/30.0, event => {

                event.changeScene(GameScene);
            })
            .setCenter(new Vector2(80, 72));
    }


    public update(event : CoreEvent) {

        const ENTER_SPEED = 1.0/60.0;

        if (event.transition.isActive())
            return;

        if (this.phase == 0) {

            this.enterTimer = (this.enterTimer + ENTER_SPEED*event.step) % 1.0;

            if (event.input.getAction("start") == State.Pressed ||
                event.input.getAction("accept") == State.Pressed) {

                event.audio.playSample(event.assets.getSample("start"), 0.70);
                ++ this.phase;
            }
            return;
        }

        if (this.message.isActive()) {

            this.message.update(event);
            return;
        }

        this.menu.update(event);
    }


    public redraw(canvas : Canvas) {

        canvas.clear(0, 85, 170);

        canvas.drawBitmap(canvas.assets.getBitmap("sky"), 14, -10);
        canvas.drawBitmap(canvas.assets.getBitmap("forest"), 0, 144-76);

        canvas.drawBitmap(canvas.assets.getBitmap("logo"), 0, 8);

        if (this.phase == 0) {
            
            if (this.enterTimer < 0.5) {

                canvas.drawText(canvas.assets.getBitmap("fontYellow"), 
                    "PRESS ENTER", canvas.width/2, canvas.height-32, 0, 0, true);
            }
        }
        else {

            this.menu.draw(canvas, 0, 36, 0, 12, true);

            if (this.message.isActive()) {

                canvas.setFillColor(0, 0, 0, 0.67);
                canvas.fillRect();
                this.message.draw(canvas);
            }
        }

        canvas.drawText(canvas.assets.getBitmap("font"), "©2021 Jani Nykänen",
            canvas.width/2, canvas.height-10, 0, 0, true);
    }


    public dispose = () : any => <any> this.loadGame;
}
