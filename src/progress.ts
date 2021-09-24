import { KeyValuePair } from "./types.js";


export class ProgressManager {


    private booleanProperties : Array<KeyValuePair<boolean>>;


    constructor() {

        this.booleanProperties = new Array<KeyValuePair<boolean>> ();
    }


    public setBooleanProperty(key : string, value = true) {

        for (let b of this.booleanProperties) {

            if (b.key == key) {

                b.value = value;
                return;
            }
        }

        this.booleanProperties.push(new KeyValuePair<boolean>(key, value));
    }


    public getBooleanProperty(key : string) {

        for (let b of this.booleanProperties) {

            if (b.key == key) {

                return b.value;
            }
        }
        return false;
    }
}
