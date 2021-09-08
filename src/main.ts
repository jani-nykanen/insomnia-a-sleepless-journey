import { Core } from "./core.js";
import { GameScene } from "./game.js";
import { RGBA } from "./vector.js";


window.onload = () => (new Core(160, 144))
    .run(GameScene, "assets/index.json",
    event => {

        event.setCanvasFilter(133, new RGBA(255, 170, 0, 0.33));
    });
