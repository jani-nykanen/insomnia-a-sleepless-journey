import { Core } from "./core.js";
import { GameScene } from "./game.js";
import { RGBA } from "./vector.js";


window.onload = () => (new Core(160, 144))
    .run(GameScene, "assets/index.json",
    event => {

        event.input.addAction("fire1", "Space", null, 0)
            .addAction("start", "Enter", null, 9, 7);

        event.setCanvasFilter(133, new RGBA(255, 170, 0, 0.33));
        event.createBlackBorderOverlayEffect(6, 80);
    });
