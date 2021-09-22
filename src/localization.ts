

export class Localization {


    private data : any;


    constructor() {

        this.data = null;
    }


    public initialize(document : string) {

        this.data = JSON.parse(document);
    }


    public findValue(keys : Array<string>) : any {

        let object = this.data;

        try {

        for (let k of keys) {

            // Only in Javascript!
            object = object[k];
        }

        return object;

        }
        catch(e) {}

        return null;
    }
}
