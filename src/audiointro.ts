import { Canvas } from "./canvas.js";
import { CoreEvent, Scene } from "./core.js";
import { Menu, MenuButton } from "./menu.js";
import { TitleScreen } from "./titlescreen.js";



export class AudioIntro implements Scene {


    static INITIAL_SAMPLE_VOLUME = 0.50;
    static INITIAL_MUSIC_VOLUME = 0.60;

    private yesNoMenu : Menu;

    private readonly text : string;
    private readonly width : number;


    constructor(param : any, event : CoreEvent) {

        this.yesNoMenu = new Menu(
            [
                new MenuButton("YES",
                    event => {

                        event.audio.toggle(true);

                        event.audio.setGlobalMusicVolume(AudioIntro.INITIAL_MUSIC_VOLUME);
                        event.audio.setGlobalSampleVolume(AudioIntro.INITIAL_SAMPLE_VOLUME);

                        event.changeScene(TitleScreen);
                    }),

                new MenuButton("NO",
                    event => {

                        event.audio.toggle(false);

                        event.changeScene(TitleScreen);
                    })
            ]
        );

        this.yesNoMenu.activate(0);

        this.text = String(event.localization.findValue(["audioIntro"]));

        this.width = Math.max(...this.text.split('\n').map(s => s.length));
    }


    public update(event : CoreEvent) {

        this.yesNoMenu.update(event);
    }


    public redraw(canvas : Canvas) {

        canvas.clear(0, 85, 170);

        canvas.drawText(canvas.assets.getBitmap("font"), 
            this.text, canvas.width/2 - this.width*8/2, 24, 
            0, 2, false);

        this.yesNoMenu.draw(canvas, 0, 32, 0, 12);
    }


    public dispose = () : any => <any>0;

}
