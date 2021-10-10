import { ProgressManager } from "./progress.js";



export class SaveManager {


    private readonly progress : ProgressManager;


    constructor(progress : ProgressManager) {

        this.progress = progress;
    }


    public save() : boolean {

        let str = "{\n" + this.progress.dump() + "\n}";

        console.log("DEBUG (savefile):\n" + str);

        try {

            window.localStorage.setItem("__jn_metroidvania3__save", str);
        }
        catch(e) {

            console.log(e);
            return false;
        }

        return true;
    }
}
