import { State } from "./types.js";
import { Vector2 } from "./vector.js";


export class GamePadListener {


    private stick : Vector2;
    private pad : Gamepad;
    private index : number;
    private buttons : Array<number>;
    private anyPressed : boolean;


    constructor() {

        this.stick = new Vector2();
        this.buttons = new Array<number> ();

        this.pad = null;
        this.index = -1;

        window.addEventListener("gamepadconnected", (ev : GamepadEvent) => {

            if (this.index < 0) {

                console.log("Gamepad with index " + 
                    String(ev["gamepad"].index) + 
                    " connected.");
            }
            else {

                console.log("Gamepad with index " + 
                    String(ev["gamepad"].index) + 
                    " connected but ignored due to some weird technical reasons.");
                return;
            }

            let gp = navigator.getGamepads()[ev["gamepad"].index];
            this.index = ev["gamepad"].index;
            this.pad = gp;

            this.updateGamepad(this.pad);
        });

        this.anyPressed = false;
    }


    private pollGamepads() {

        if (navigator == null)
            return;

        return navigator.getGamepads();
    }


    private updateButtons(pad : Gamepad) {

        if (pad == null) {

            for (let i = 0; i < this.buttons.length; ++ i) {

                this.buttons[i] = State.Up;
            }
            return;
        }

        for (let i = 0; i < pad.buttons.length; ++ i) {

            // Make sure the button exists in the array
            if (i >= this.buttons.length) {

                for (let j = 0; j < i-this.buttons.length; ++ j) {

                    this.buttons.push(State.Up);
                }
            }

            if (pad.buttons[i].pressed) {

                if (this.buttons[i] == State.Up ||
                    this.buttons[i] == State.Released) {
                    
                    this.anyPressed = true;
                    this.buttons[i] = State.Pressed;
                }
                else {

                    this.buttons[i] = State.Down;
                }
            }
            else {

                if (this.buttons[i] == State.Down ||
                    this.buttons[i] == State.Pressed) {

                    this.buttons[i] = State.Released;
                }
                else {

                    this.buttons[i] = State.Up;
                }
            }
        }
    }


    private updateStick(pad : Gamepad) {
        
        const DEADZONE = 0.25;

        let noLeftStick = true;

        if (pad != null) {
            
            this.stick.x = 0;
            this.stick.y = 0;

            if (Math.abs(pad.axes[0]) >= DEADZONE) {

                this.stick.x = pad.axes[0];
                noLeftStick = false;
            }
            if (Math.abs(pad.axes[1]) >= DEADZONE) {

                this.stick.y = pad.axes[1];
                noLeftStick = false;
            }

            // On Firefox dpad is considered
            // axes, not buttons
            if (pad.axes.length >= 8 && noLeftStick) {

                if (Math.abs(pad.axes[6]) >= DEADZONE)
                    this.stick.x = pad.axes[6];

                if (Math.abs(pad.axes[7]) >= DEADZONE)
                    this.stick.y = pad.axes[7];
            }
        }
    }


    private updateGamepad(pad : Gamepad) {
        
        this.updateStick(pad);
        this.updateButtons(pad);
    }


    private refreshGamepads() {

        if (this.pad == null) return;

        let pads = this.pollGamepads();
        if (pads == null) 
            return;
        this.pad = pads[this.index];
    }


    public update() {

        this.anyPressed = false;

        this.stick.x = 0.0;
        this.stick.y = 0.0;

        this.refreshGamepads();
        this.updateGamepad(this.pad);
    }


    public getButtonState(id : number) : State {

        if (id == null ||
            id < 0 || 
            id >= this.buttons.length)
            return State.Up;

        return this.buttons[id];
    }


    public isAnyButtonPressed = () : boolean => this.anyPressed;
    public getStick = () : Vector2 => this.stick.clone();
}
