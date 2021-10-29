import { clamp } from "./math.js";


export class AudioSample {


    private data : AudioBuffer;
    private activeBuffer : AudioBufferSourceNode;
    private gain : GainNode;

    private startTime : number;
    private pauseTime : number;
    private playVol : number;
    private loop : boolean;


    constructor(ctx : AudioContext, data : AudioBuffer) {

        this.data = data;

        this.activeBuffer = null;

        this.gain = ctx.createGain();
    
        this.startTime = 0;
        this.pauseTime = 0;
        this.playVol = 0;
        this.loop = false;
    }


    public play(ctx : AudioContext, vol = 1.0, loop = false, startTime = 0.0) {

        this.fadeIn(ctx, vol, vol, loop, startTime, 0);
    }


    public fadeIn(ctx : AudioContext, initial : number, end : number, loop = false, startTime = 0, fadeTime = 0) {

        if (this.activeBuffer != null) {

            this.activeBuffer.disconnect();
            this.activeBuffer = null;
        }

        let bufferSource = ctx.createBufferSource();
        bufferSource.buffer = this.data;
        bufferSource.loop = Boolean(loop);

        initial = clamp(initial, 0.0, 1.0);
        end = clamp(end, 0.0, 1.0);

        // Not sure if these have any difference
        if (fadeTime != null) {

            this.gain.gain.setValueAtTime(initial, startTime);
        }
        else {

            this.gain.gain.value = initial;
        }

        this.startTime = ctx.currentTime - startTime;
        this.pauseTime = 0;
        this.playVol = end;
        this.loop = loop;

        bufferSource.connect(this.gain).connect(ctx.destination);
        bufferSource.start(0, startTime);

        if (fadeTime > 0) {

            this.gain.gain.exponentialRampToValueAtTime(end, startTime + fadeTime/1000.0);
        }

        this.activeBuffer = bufferSource;
    }


    public stop() {

        if (this.activeBuffer == null) return;

        this.activeBuffer.disconnect();
        this.activeBuffer.stop(0);
        this.activeBuffer = null;
    }


    public pause(ctx : AudioContext) {

        if (this.activeBuffer == null) return;

        this.pauseTime = ctx.currentTime - this.startTime;

        this.stop();
    }


    public resume(ctx : AudioContext) {

        this.play(ctx, this.playVol, this.loop, this.pauseTime);
    }
}
