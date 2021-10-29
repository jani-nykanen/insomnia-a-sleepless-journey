import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { GameObject, nextObject } from "./gameobject.js";
import { negMod } from "./math.js";
import { Vector2 } from "./vector.js";



class Snowflake extends GameObject {

    private speedFactor : Vector2;
    private speedAngle : number;

    private renderPos : Vector2;

    private bottom : number;

    private size : number;


    constructor() {

        super(0, 0, false);

        this.speedFactor = new Vector2();
        this.speedAngle = 0.0;

        this.renderPos = new Vector2();

        this.friction = new Vector2(0.1, 0.1);

        this.bottom = 0;

        this.size = 2;

        this.inCamera = true;
    }


    public spawn(x : number, y : number, speedx : number, speedy : number, 
        bottom : number, size : number) {

        this.pos = new Vector2(x, y);
        this.renderPos = this.pos.clone();

        this.speedFactor = new Vector2(speedx, speedy);
        this.speedAngle = Math.random() * Math.PI * 2;

        this.bottom = bottom;

        this.size = size;

        this.exist = true;
    }


    protected preMovementEvent(event : CoreEvent) {

        const ANGLE_SPEED = 0.05;
        const BOTTOM_MARGIN = 2;

        if (this.pos.y > this.bottom + BOTTOM_MARGIN) {

            this.exist = false;
        }

        this.speedAngle = (this.speedAngle + ANGLE_SPEED * event.step) % (Math.PI*4);
        
        this.target.x = Math.sin(this.speedAngle * 0.5) * this.speedFactor.x;
        this.target.y = this.speedFactor.y * 0.5 * ((Math.sin(this.speedAngle) + 1.0));

        this.renderPos = this.pos.clone();
    }


    public cameraEvent(camera : Camera) {

        let delta = camera.getDelta();

        this.renderPos.x = negMod(this.pos.x - delta.x, camera.width);
        this.renderPos.y = negMod(this.pos.y - delta.y, camera.height);
    }


    public draw(canvas : Canvas) {

        const ALPHA = 0.67;

        if (!this.exist) return;      
    
        let px = Math.round(this.renderPos.x - this.size/2);
        let py = Math.round(this.renderPos.y - this.size/2);

        canvas.setFillColor(255, 255, 255, ALPHA);
        canvas.fillRect(px, py, this.size, this.size);
    }
}


export class SnowflakeGenerator {


    private snowflakes : Array<Snowflake>;
    private flakeTimer : number;


    constructor(camera : Camera) {

        this.snowflakes = new Array<Snowflake> ();
        this.flakeTimer = 0;

        this.generateInitialFlakes(camera);
    }


    private generateInitialFlakes(camera : Camera) {

        const COUNT = 16;

        let x : number;
        let y : number;

        for (let i = 0; i < COUNT; ++ i) {

            x = (Math.random() * camera.width) | 0;
            y = (Math.random() * camera.height) | 0;

            this.generateFlake(camera, new Vector2(x, y));
        }
    }


    private generateFlake(camera : Camera, pos? : Vector2) {

        const MIN_SPEED_X = 0.25;
        const MAX_SPEED_X = 1.25;
        const MIN_SPEED_Y = 0.25;
        const MAX_SPEED_Y = 1.5;

        let speedY = MIN_SPEED_Y + Math.random() * (MAX_SPEED_Y - MIN_SPEED_Y);
        let speedX = MIN_SPEED_X + Math.random() * (MAX_SPEED_X - MIN_SPEED_X);

        let dx = pos != null ? pos.x : (Math.random() * camera.width) | 0;
        let dy = pos != null ? pos.y : -2;

        nextObject(this.snowflakes, Snowflake)
            .spawn(dx, dy, speedX, speedY, camera.height,
            Math.floor(Math.random()*2 + 1));
    }


    public update(camera : Camera, event : CoreEvent) {

        const FLAKE_GEN_TIME = 20;

        if ((this.flakeTimer += event.step) >= FLAKE_GEN_TIME) {

            this.generateFlake(camera);

            this.flakeTimer -= FLAKE_GEN_TIME;
        }

        if (camera.isMoving()) {

            for (let o of this.snowflakes) {

                o.cameraEvent(camera);
            }
        }
        else {

            for (let o of this.snowflakes) {

                o.update(event);
            }
        }
    }


    public draw(canvas : Canvas) {

        for (let o of this.snowflakes) {

            o.draw(canvas);
        }
    }
}
