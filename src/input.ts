import { GamePadListener } from "./gamepad.js";
import { KeyboardListener } from "./keyboard.js";
import { State } from "./types.js";



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


    constructor() {

        this.keyboard = new KeyboardListener();
        this.gamepad = new GamePadListener();
    
        this.actions = new Array<InputAction> ();
    }


    public addAction(name : string, key1 : string, key2 = null, button1 = -1, button2 = -1) {

        this.actions.push(new InputAction(name, key1, key2, button1, button2));
    }


    public getAction(name : string) : State {

        for (let a of this.actions) {

            if (a.name == name) {

                return a.getState();
            }
        }

        return State.Up;
    }


    public update() {

        this.keyboard.update();
        this.gamepad.update();
    }


    // To be called before update
    public updateActions() {

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
    }
    
}
