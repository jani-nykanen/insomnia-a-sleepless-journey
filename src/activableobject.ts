

export class ActivableObject {


    protected active : boolean;


    constructor() {

        this.active = false;
    }


    public isActive = () => this.active;


    public deactivate() {

        this.active = false;
    }


    public activate() {

        this.active = true;
    }
}
