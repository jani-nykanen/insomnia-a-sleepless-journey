import { Camera } from "./camera.js";
import { Stage } from "./stage.js";
import { KeyValuePair } from "./types.js";



const getProperty = <T>(arr : Array<KeyValuePair<T>>, key : string, def : T) : T => {

    for (let e of arr) {

        if (e.key == key) {

            return e.value;
        }
    }
    return def;
}


const setProperty = <T>(arr : Array<KeyValuePair<T>>, key : string, value : T) => {

    for (let e of arr) {

        if (e.key == key) {

            e.value = value;
            return;
        }
    }
    arr.push(new KeyValuePair<T>(key, value));
}


export class ProgressManager {


    private booleanProperties : Array<KeyValuePair<boolean>>;
    private numberProperties : Array<KeyValuePair<number>>;


    constructor() {

        this.booleanProperties = new Array<KeyValuePair<boolean>> ();
        this.numberProperties = new Array<KeyValuePair<number>> ();
    }


    public setBooleanProperty = (key : string, value = true) : void => setProperty<boolean>(this.booleanProperties, key, value);
    public getBooleanProperty = (key : string) : boolean => getProperty<boolean>(this.booleanProperties, key, false);

    public setNumberProperty = (key : string, value = 0) : void => setProperty<number>(this.numberProperties, key, value);
    public getNumberProperty = (key : string) : number => getProperty<number>(this.numberProperties, key, 0);


    public increaseNumberProperty(key : string, amount = 1) {

        for (let e of this.numberProperties) {

            if (e.key == key) {
    
                e.value += amount;
                return;
            }
        }
        this.setNumberProperty(key, amount);
    }


    public markRoomVisited(x : number, y : number, stage : Stage) {

        this.setBooleanProperty("visited" + String((y * Math.floor(stage.width/10) + x) | 0));
    }
}
