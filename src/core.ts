import { AssetManager } from "./assets.js";
import { AudioPlayer } from "./audioplayer.js";
import { Canvas } from "./canvas.js";
import { InputListener } from "./input.js";
import { TransitionEffectManager } from "./transition.js";
import { RGBA } from "./vector.js";


export class CoreEvent {


    public readonly step : number;
    public readonly input : InputListener;
    public readonly assets : AssetManager;
    public readonly transition : TransitionEffectManager;
    public readonly audio : AudioPlayer;

    private readonly core : Core;
    private readonly canvas : Canvas;


    constructor(step : number, core : Core, 
        input : InputListener, assets : AssetManager,
        tr : TransitionEffectManager, audio : AudioPlayer,
        canvas : Canvas) {

        this.core = core;
        this.step = step;
        this.input = input;
        this.assets = assets;
        this.transition = tr;
        this.audio = audio;
        this.canvas = canvas;
    }


    public changeScene(newScene : Function) {

        this.core.changeScene(newScene);
    }


    public setCanvasFilter = (contrast : number, tintColor : RGBA) : void =>
        this.canvas.setFilter(contrast, tintColor);
}


export interface Scene {

    update(event : CoreEvent) : void;
    redraw(canvas : Canvas) : void;
    dispose() : any;
}


export class Core {

    private canvas : Canvas;
    private event : CoreEvent;
    private transition : TransitionEffectManager;
    private input : InputListener;
    private assets : AssetManager;
    private audio : AudioPlayer;

    private activeScene : Scene;
    private activeSceneType : Function;

    private timeSum : number;
    private oldTime : number;

    private initialized : boolean;


    constructor(canvasWidth : number, canvasHeight : number, frameSkip = 0) {

        this.audio = new AudioPlayer();
        this.input = new InputListener();
        this.assets = new AssetManager(this.audio);
        this.canvas = new Canvas(canvasWidth, canvasHeight, this.assets);
        this.transition = new  TransitionEffectManager();

        this.event = new CoreEvent(frameSkip+1, this, 
            this.input, this.assets, this.transition, this.audio, this.canvas);

        this.timeSum = 0.0;
        this.oldTime = 0.0;

        this.initialized = false;

        this.activeScene = null;
        this.activeSceneType = null;
    }


    private drawLoadingScreen(canvas : Canvas) {

        const BAR_BORDER_WIDTH = 1;

        let barWidth = canvas.width / 4;
        let barHeight = barWidth / 8;

        canvas.clear(0, 0, 0);
    
        let t = this.assets.dataLoadedUnit();
        let x = canvas.width/2 - barWidth/2;
        let y = canvas.height/2 - barHeight/2;

        x |= 0;
        y |= 0;
    
        // Outlines
        canvas.setFillColor(255);
        canvas.fillRect(x-BAR_BORDER_WIDTH*2, y-BAR_BORDER_WIDTH*2, 
            barWidth+BAR_BORDER_WIDTH*4, barHeight+BAR_BORDER_WIDTH*4);
        canvas.setFillColor(0);
        canvas.fillRect(x-BAR_BORDER_WIDTH, y-BAR_BORDER_WIDTH, 
            barWidth+BAR_BORDER_WIDTH*2, barHeight+BAR_BORDER_WIDTH*2);
    
        // Bar
        let w = (barWidth*t) | 0;
        canvas.setFillColor(255);
        canvas.fillRect(x, y, w, barHeight);
        
    }


    private loop(ts : number) {

        const MAX_REFRESH_COUNT = 5;
        const FRAME_WAIT = 16.66667 * this.event.step;

        this.timeSum += ts - this.oldTime;
        this.timeSum = Math.min(MAX_REFRESH_COUNT * FRAME_WAIT, this.timeSum);
        this.oldTime = ts;

        let refreshCount = (this.timeSum / FRAME_WAIT) | 0;
        while ((refreshCount --) > 0) {

            if (!this.initialized && this.assets.hasLoaded()) {
                
                this.activeScene = new this.activeSceneType.prototype.constructor(null, this.event);
                this.initialized = true;
            }

            this.input.updateActions();

            if (this.initialized) {

                this.activeScene.update(this.event);
            }

            this.input.update();
            this.transition.update(this.event);

            this.timeSum -= FRAME_WAIT;
        }

        if (this.initialized) {

            this.activeScene.redraw(this.canvas);
            this.transition.draw(this.canvas);
        }
        else {

            this.drawLoadingScreen(this.canvas);
        }
        this.canvas.applyFilter();

        window.requestAnimationFrame(ts => this.loop(ts));
    }


    public run(initialScene : Function, assetPath = <string> null,
        onStart : ((event : CoreEvent) => void) = () => {}) {

        if (assetPath != null) {

            this.assets.parseAssetIndexFile(assetPath);
        }

        this.activeSceneType = initialScene;

        onStart(this.event);

        this.loop(0);
    }


    public changeScene(newScene : Function) {

        let param = this.activeScene.dispose();
        this.activeScene = new newScene.prototype.constructor(param, this.event);
    }
    
}
