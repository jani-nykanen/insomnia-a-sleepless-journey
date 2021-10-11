import { Camera } from "./camera.js";
import { negMod } from "./math.js";
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


const setProperty = <T>(arr : Array<KeyValuePair<T>>, key : string, value : T) : void => {

    for (let e of arr) {

        if (e.key == key) {

            e.value = value;
            return;
        }
    }
    arr.push(new KeyValuePair<T>(key, value));
}


const dumpProperties = <T>(arr : Array<KeyValuePair<T>>) : string => {

    let str = "{\n";

    let a : KeyValuePair<T>;
    for (let i = 0; i < arr.length; ++ i) {

        a = arr[i];
        str += '"' + a.key + '": ' + String(a.value);
        if (i != arr.length-1)
            str += ",";

        str += "\n";
    }
    str += "}";

    return str;
}


const dumpArrayProperties = <T>(arr : Array<KeyValuePair<Array<T>>>) : string => {

    let str = "{\n";

    let a : KeyValuePair<Array<T>>;
    for (let i = 0; i < arr.length; ++ i) {

        a = arr[i];
        str += '"' + a.key + '": [';

        for (let j = 0; j < a.value.length; ++ j) {
            
            str += String(a.value[j]);
            if (j != a.value.length-1)
                str += ",";
        }
        str += "]";
        if (i != arr.length-1) {

            str += ",";
        }
        str += "\n";
    }
    str += "}";
    
    return str;
}



export class ProgressManager {


    private booleanProperties : Array<KeyValuePair<boolean>>;
    private numberProperties : Array<KeyValuePair<number>>;
    private numberArrayProperties : Array<KeyValuePair<Array<number>>>;


    constructor() {

        this.booleanProperties = new Array<KeyValuePair<boolean>> ();
        this.numberProperties = new Array<KeyValuePair<number>> ();
        this.numberArrayProperties = new Array<KeyValuePair<Array<number>>> ();
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


    public addValueToArray(key : string, value : number, noDuplicates = true) {

        let arr =  <Array<number>> null;
        for (let e of this.numberArrayProperties) {

            if (e.key == key) {
    
                arr = e.value;
                break;
            }
        }

        if (arr == null) {

            arr = new Array<number> ();
            this.numberArrayProperties.push(new KeyValuePair<Array<number>> (key, arr));
        }

        if (noDuplicates && arr.includes(value)) 
            return;

        arr.push(value);
    }


    public doesValueExistInArray (key : string, value : number) : boolean {

        let arr = getProperty<Array<number>>(this.numberArrayProperties, key, null);
        if (arr == null)
            return false;

        return arr.includes(value);
    }


    public dump = () : string => 
        "\"boolProp\": " + dumpProperties<boolean>(this.booleanProperties) +
        ",\n" + "\"numberProp\": " + dumpProperties<number>(this.numberProperties) +
        ",\n" + "\"arrayProp\": " + dumpArrayProperties<number>(this.numberArrayProperties);
}
