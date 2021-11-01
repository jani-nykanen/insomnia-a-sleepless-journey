import { Canvas } from "./canvas.js";
import { Scene, CoreEvent } from "./core.js";
import { GameScene } from "./game.js";
import { Menu, MenuButton } from "./menu.js";
import { MessageBox } from "./messagebox.js";
import { TransitionEffectType } from "./transition.js";
import { Vector2 } from "./vector.js";


const TITLE_MUSIC_VOLUME = 0.60;


export class TitleScreen implements Scene {


    private menu : Menu;
    private loadGame : boolean;
    private message : MessageBox;


    constructor(param : any, event : CoreEvent) {


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

        if (event.transition.isActive())
            return;

        if (this.message.isActive()) {

            this.message.update(event);
            return;
        }

        this.menu.update(event);
    }


    public redraw(canvas : Canvas) {

        canvas.clear(0, 85, 170);

        this.menu.draw(canvas, 0, 32, 0, 12, true);

        if (this.message.isActive()) {

            canvas.setFillColor(0, 0, 0, 0.67);
            canvas.fillRect();
            this.message.draw(canvas);
        }
    }


    public dispose = () : any => <any> this.loadGame;
}
