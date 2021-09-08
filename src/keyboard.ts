import { KeyValuePair, State } from "./types.js";



export class KeyboardListener {

    
    private keys : Array<KeyValuePair<State>>;
    private prevent : Array<string>;
    private anyPressed : boolean;


    constructor() {

        this.keys = new Array<KeyValuePair<State>> ();
        this.prevent = new Array<string> ();

        this.anyPressed = false;

        window.addEventListener("keydown", 
        (e : any) => {

            this.keyPressed(e.code);
            if (this.prevent.includes(e.code))
                e.preventDefault();
            
        });
        window.addEventListener("keyup", 
        (e : any) => {

            this.keyReleased(e.code);
            if (this.prevent.includes(e.code))
                e.preventDefault();
        });   

        window.addEventListener("contextmenu", (e) => {

            e.preventDefault();
        });

        // In the case this is embedded into an iframe
        window.addEventListener("mousemove", (e) => {

            window.focus();
        });
        window.addEventListener("mousedown", (e) => {

            window.focus();
        });
    }


    private setKeyState(name : string, state : State) {

        for (let s of this.keys) {

            if (s.key == name) {

                s.value = state;
                return;
            }
        }

        this.keys.push(new KeyValuePair<State>(name, state));
    }


    public keyPressed(key : string) {

        if (this.getKeyState(key) == State.Down) 
            return;
            
        this.anyPressed = true;
        this.setKeyState(key, State.Pressed);
    }


    public keyReleased(key : string) {

        if (this.getKeyState(key) == State.Up) 
            return;
        
        this.setKeyState(key, State.Released);
    }


    public update() {

        for (let k of this.keys) {

            if (k.value == State.Released)
                k.value = State.Up;
            else if (k.value == State.Pressed)
                k.value = State.Down;
        }

        this.anyPressed = false;
    }


    public getKeyState(name : string) : State {

        for (let s of this.keys) {

            if (s.key == name) {

                return s.value;
            }
        }
        return State.Up;
    }


    public isAnyPressed = () : boolean => this.anyPressed;
}
