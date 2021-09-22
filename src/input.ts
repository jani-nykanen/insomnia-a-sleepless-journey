import { GamePadListener } from "./gamepad.js";
import { KeyboardListener } from "./keyboard.js";
import { State } from "./types.js";
import { Vector2 } from "./vector.js";


const INPUT_SPECIAL_EPS = 0.25;


class InputAction {


    public readonly key1 : string;
    public readonly key2 : string;
    public readonly button1 : number;
    public readonly button2 : number;
    public readonly name : string;

    private state : State;


    constructor(name : string, key1 : string, key2 = null, button1 = -1, button2 = -1) {

        this.name = name;

        this.key1 = key1;
        this.key2 = key2;
        this.button1 = button1;
        this.button2 = button2;

        this.state = State.Up;
    }


    public setState(v : State) {

        this.state = v;
    }


    public getState = () : State => this.state;
}



export class InputListener {


    public readonly keyboard : KeyboardListener;
    public readonly gamepad : GamePadListener;

    private actions : Array<InputAction>;
    private stick : Vector2;
    private oldStick : Vector2;
    private stickDelta : Vector2;


    constructor() {

        this.keyboard = new KeyboardListener();
        this.gamepad = new GamePadListener();
    
        this.actions = new Array<InputAction> ();

        this.stick = new Vector2();
        this.oldStick = new Vector2();
        this.stickDelta = new Vector2();

        this.addAction("right", "ArrowRight", null, 15)
            .addAction("up", "ArrowUp", null, 12)
            .addAction("left", "ArrowLeft", null, 14)
            .addAction("down", "ArrowDown", null, 13);
    }


    public addAction(name : string, key1 : string, key2 = null, button1 = -1, button2 = -1) : InputListener {

        this.actions.push(new InputAction(name, key1, key2, button1, button2));

        return this;
    }


    public getAction(name : string) : State {

        for (let a of this.actions) {

            if (a.name == name) {

                return a.getState();
            }
        }

        return State.Up;
    }


    private updateStick() {

        const DEADZONE = 0.25;

        let padStick = this.gamepad.getStick();

        this.oldStick = this.stick.clone();

        this.stick.zeros();
        if (Math.abs(padStick.x) >= DEADZONE ||
            Math.abs(padStick.y) >= DEADZONE) {

            this.stick = padStick;
        }
        else {
        
            if (this.getAction("right") & State.DownOrPressed) {

                this.stick.x = 1;
            }
            else if (this.getAction("left") & State.DownOrPressed) {

                this.stick.x = -1;
            }

            if (this.getAction("down") & State.DownOrPressed) {

                this.stick.y = 1;
            }
            else if (this.getAction("up") & State.DownOrPressed) {

                this.stick.y = -1;
            }

            // this.stick.normalize();
        }

        this.stickDelta = new Vector2(
            this.stick.x - this.oldStick.x,
            this.stick.y - this.oldStick.y
        );
    }


    // To be called before update
    public preUpdate() {

        this.gamepad.update();

        let s : State;
        for (let a of this.actions) {

            s = this.keyboard.getKeyState(a.key1);
            if (s == State.Up) {

                if (a.key2 != null) {

                    s = this.keyboard.getKeyState(a.key2);
                }

                if (s == State.Up && a.button1 >= 0) {

                    s = this.gamepad.getButtonState(a.button1);
                    if (s == State.Up && a.button2 >= 0) {

                        s = this.gamepad.getButtonState(a.button2);
                    }
                }
            }

            a.setState(s);
        }

        this.updateStick();
    }


    public postUpdate() {

        this.keyboard.update();
    }


    public getStick = () : Vector2 => this.stick.clone();


    public upPress() : boolean {

        return this.stick.y < 0 && 
            this.oldStick.y >= -INPUT_SPECIAL_EPS &&
            this.stickDelta.y < -INPUT_SPECIAL_EPS;
    }


    public downPress() : boolean {

        return this.stick.y > 0 && 
            this.oldStick.y <= INPUT_SPECIAL_EPS &&
            this.stickDelta.y > INPUT_SPECIAL_EPS;
    }


    public leftPress() : boolean {

        return this.stick.x < 0 && 
            this.oldStick.x >= -INPUT_SPECIAL_EPS &&
            this.stickDelta.x < -INPUT_SPECIAL_EPS;
    }

    public rightPress() : boolean {

        return this.stick.x > 0 && 
            this.oldStick.x <= INPUT_SPECIAL_EPS &&
            this.stickDelta.x > INPUT_SPECIAL_EPS;
    }


    public anyPressed = () : boolean => (this.keyboard.isAnyPressed() || this.gamepad.isAnyButtonPressed());
}
