import { AudioIntro } from "./audiointro.js";
import { Core } from "./core.js";


window.onload = () => (new Core(160, 144))
    .run(AudioIntro, "assets/index.json",
    event => {

        event.input
            .addAction("fire1", "KeyZ", null, 2)
            .addAction("fire2", "KeyX", null, 0)
            .addAction("fire3", "KeyC", null, 1)
            .addAction("fire4", "KeyS", null, 3)
            .addAction("select", "Space", null, 0)
            .addAction("start", "Enter", null, 9, 7)
            .addAction("map", "ShiftLeft", null, 8, 6);

        // event.setCanvasFilter(133, new RGBA(255, 170, 0, 0.20));
        // event.createBlackBorderOverlayEffect(6, 80);
    },
    event => {

        event.prepareLocalization("localization");
    });
