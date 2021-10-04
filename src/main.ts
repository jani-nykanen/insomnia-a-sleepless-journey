import { Core } from "./core.js";
import { GameScene } from "./game.js";
import { RGBA } from "./vector.js";


window.onload = () => (new Core(160, 144))
    .run(GameScene, "assets/index.json",
    event => {

        event.input
            .addAction("fire1", "KeyZ", null, 2)
            .addAction("fire2", "KeyX", null, 0)
            .addAction("fire3", "KeyC", null, 1)
            .addAction("fire4", "KeyC", null, 3)
            .addAction("select", "Space", null, 0)
            .addAction("start", "Enter", null, 9, 7);

        // event.setCanvasFilter(133, new RGBA(255, 170, 0, 0.20));
        // event.createBlackBorderOverlayEffect(6, 80);
    },
    event => {

        event.prepareLocalization("localization");
    });
