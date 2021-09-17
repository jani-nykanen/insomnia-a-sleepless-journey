import { CoreEvent } from "./core.js";
import { WeakGameObject } from "./gameobject.js";
import { Player } from "./player.js";


export class WeakInteractionTarget extends WeakGameObject {


    constructor(x : number, y : number, exist = true) {

        super(x, y, exist);
    }


    protected playerCollisionEvent(player : Player, event : CoreEvent) {}


    public playerCollision(player : Player, event : CoreEvent) : boolean {

        if (!this.exist || !this.inCamera || this.dying) 
            return false;

        if (player.overlayObject(this)) {

            this.playerCollisionEvent(player, event);
            return true;
        }
        return false;
    }

}
