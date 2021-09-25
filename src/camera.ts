import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { WeakGameObject } from "./gameobject.js";
import { negMod } from "./math.js";
import { Stage } from "./stage.js";
import { Vector2 } from "./vector.js";


export class Camera {


    private pos : Vector2;
    private target : Vector2;
    private renderPos : Vector2;
    private timer : number;
    private speed : number;
    private moving : boolean;

    private forcedToMove : boolean;

    public readonly width : number;
    public readonly height : number;


    constructor(x : number, y : number, width : number, height : number) {

        this.pos = new Vector2(x, y);
        this.target = this.pos.clone();
        this.renderPos = this.pos.clone();

        this.timer = 0;
        this.speed = 1;
        this.moving = false;

        this.forcedToMove = false;

        this.width = width;
        this.height = height;
    }


    public update(event : CoreEvent) : boolean {

        this.forcedToMove = false;

        if (!this.moving) return false;

        if ((this.timer += this.speed * event.step) >= 1.0) {

            this.pos = this.target.clone();
            this.renderPos = this.pos.clone();
            this.moving = false;

            return true;
        }

        this.renderPos = Vector2.lerp(this.pos, this.target, this.timer);

        return false;
    }


    public move(dx : number, dy : number, speed : number) {

        const EPS = 0.001;

        if (Math.abs(dx) < EPS && Math.abs(dy) < EPS) return;

        this.target = Vector2.add(this.pos, new Vector2(dx, dy));
        this.moving = true;
        this.speed = speed;
        this.timer = 0;
    }


    public use(canvas : Canvas) {

        canvas.move(
            -Math.round(this.renderPos.x * this.width), 
            -Math.round(this.renderPos.y * this.height));
    }


    public focusOnObject(o : WeakGameObject) {

        this.pos.x = (o.getPos().x / this.width) | 0;
        this.pos.y = (o.getPos().y / this.height) | 0;
        
        this.target = this.pos.clone();
        this.renderPos = this.pos.clone();

        this.forcedToMove = true;
    }


    public getPosition = () : Vector2 => new Vector2(
        this.renderPos.x * this.width, 
        this.renderPos.y * this.height);


    public getDirection = () : Vector2 => 
        Vector2.direction(this.pos, this.target);
    public getSpeed = () : number => this.speed;
    public isMoving = () : boolean => this.moving;


    public checkLoop(stage : Stage) {

        let w = stage.width / (this.width/16);

        this.pos.x = negMod(this.pos.x, w);
        this.target.x = this.pos.x;
        this.renderPos.x = this.pos.x;
    }


    public wasForcedToMove = () : boolean => this.forcedToMove;
}
