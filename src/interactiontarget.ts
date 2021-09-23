import { CoreEvent } from "./core.js";
import { WeakGameObject } from "./gameobject.js";
import { Player } from "./player.js";


export class WeakInteractionTarget extends WeakGameObject {


    protected canInteract : boolean;


    constructor(x : number, y : number, exist = true) {

        super(x, y, exist);

        this.canInteract = true;
    }


    protected playerCollisionEvent(player : Player, event : CoreEvent) {}
    protected playerEvent(player : Player, event : CoreEvent) {}


    public playerCollision(player : Player, event : CoreEvent) : boolean {

        if (!this.canInteract || !this.exist || !this.inCamera || this.dying) 
            return false;

        this.playerEvent(player, event);

        if (player.overlayObject(this)) {

            this.playerCollisionEvent(player, event);
            return true;
        }
        return false;
    }

}


export class StrongInteractionTarget extends WeakInteractionTarget {


    constructor(x : number, y : number, exist = true) {

        super(x, y, exist);
    }


    protected interactionEvent(player : Player, event : CoreEvent) {}



    protected playerCollisionEvent(player : Player, event : CoreEvent) {

        if (!player.touchGround()) return;

        player.showSymbol();

        if (event.input.upPress()) {

            this.interactionEvent(player, event);
        }
    }

}
