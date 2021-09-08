

export type Bitmap = HTMLImageElement | HTMLCanvasElement;


export const enum State {

    Up = 0, 
    Released = 2,
    Down = 1, 
    Pressed = 3, 

    DownOrPressed = 1,
}


export class KeyValuePair<T> {

    public readonly key : string;
    public value : T;

    
    constructor(key : string, value : T) {

        this.key = key;
        this.value = value;
    }
}
