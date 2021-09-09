import { Camera } from "./camera.js";
import { Bitmap } from "./types.js";
import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { negMod } from "./math.js";
import { Tilemap } from "./tilemap.js";
import { ObjectManager } from "./objectmanager.js";
import { CollisionObject } from "./gameobject.js";


const COLLISION_DOWN = 0b0001;
const COLLISION_WALL_LEFT = 0b0010;
const COLLISION_WALL_RIGHT = 0b0100;
const COLLISION_UP = 0b1000;


const COLLISION_TABLE = [
        COLLISION_DOWN,
        COLLISION_WALL_RIGHT,
        COLLISION_UP,
        COLLISION_WALL_LEFT,
        COLLISION_DOWN | COLLISION_UP,
        COLLISION_WALL_LEFT | COLLISION_WALL_RIGHT,
        COLLISION_WALL_LEFT | COLLISION_DOWN,
        COLLISION_WALL_RIGHT | COLLISION_DOWN,
        COLLISION_WALL_RIGHT | COLLISION_UP,
        COLLISION_WALL_LEFT | COLLISION_UP,
        COLLISION_WALL_LEFT | COLLISION_DOWN | COLLISION_WALL_RIGHT,
        COLLISION_WALL_RIGHT | COLLISION_DOWN | COLLISION_UP,
        COLLISION_WALL_LEFT | COLLISION_UP | COLLISION_WALL_RIGHT,
        COLLISION_WALL_LEFT | COLLISION_DOWN | COLLISION_UP,
        COLLISION_WALL_LEFT | COLLISION_DOWN | COLLISION_WALL_RIGHT | COLLISION_UP,
];



export class Stage {


    private layers : Array<Array<number>>;
    private tilemap : Tilemap;
    private collisionMap : Tilemap;

    public readonly width : number;
    public readonly height : number;


    constructor(event : CoreEvent) {

        this.tilemap = event.assets.getTilemap("base");
        this.collisionMap = event.assets.getTilemap("collisionMap")

        this.width = this.tilemap.width;
        this.height = this.tilemap.height;

        this.layers = this.tilemap.cloneLayers(3);
    }


    private getTile(layer : number, x : number, y : number, loopx = false, loopy = false) {

        if (loopx) x = negMod(x, this.width);
        if (loopy) y = negMod(y, this.height);

        if ((!loopx && (x < 0 || x >= this.width)) ||
            (!loopy && (y < 0 || y >= this.height)))
            return 0;

        return this.layers[layer][y*this.width + x];
    }


    public update(event : CoreEvent) {

        // ...
    }


    public drawBackground(canvas : Canvas, camera : Camera) {
        
        const FOREST_BASE_SHIFT = 16;

        let forest = canvas.assets.getBitmap("forest");

        let p = camera.getPosition();

        let shiftx = negMod(Math.round(p.x / 16), canvas.width);
        let shifty = Math.round(p.y / 16);

        canvas.drawBitmap(canvas.assets.getBitmap("sky"), 0, 0);

        for (let i = -1; i <= 1; ++ i) {

            canvas.drawBitmap(forest, 
                forest.width*i - shiftx, 
                canvas.height - forest.height - shifty + FOREST_BASE_SHIFT);
        }
    }


    private drawLayer(canvas : Canvas, index : number, bmp : Bitmap,
        sx = 0, sy = 0, ex = this.width, ey = this.height) {

        let tid : number;
        let srcx : number;
        let srcy : number;

        for (let y = sy; y < ey; ++ y) {

            for (let x = sx; x < ex; ++ x) {

                tid = this.getTile(index, x, y, true, false);
                if (tid <= 0) continue;

                -- tid;

                srcx = (tid % 16) | 0;
                srcy = (tid / 16) | 0;

                canvas.drawBitmapRegion(bmp,
                    srcx*16, srcy*16, 16, 16,
                    x*16, y*16);
            }
        }
    }


    public drawTileLayers(canvas : Canvas, camera : Camera) {

        let bmp = canvas.assets.getBitmap("tileset");

        let p = camera.getPosition();

        let sx = Math.floor(p.x / 16) - 1;
        let sy = Math.floor(p.y / 16) - 1;

        let ex = sx + Math.floor(canvas.width / 16) + 2;
        let ey = sy + Math.floor(canvas.height / 16) + 2;

        for (let layer = 0; layer < this.layers.length; ++ layer) {

            this.drawLayer(canvas, layer, bmp, sx, sy, ex, ey);
        }
    }


    public parseObjects(objects : ObjectManager) {

        const START_INDEX = 256;

        let tid : number;

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                tid = this.tilemap.getTile(3, x, y) - START_INDEX;

                if (tid <= 0) continue;

                switch (tid) {

                case 1:

                    objects.createPlayer(x*16, y*16);
                    break;

                default:
                    break;
                }
            }
        }
    }


    private handleBaseTileCollision(o : CollisionObject, 
        layer : number, x : number, y : number, 
        colId : number, event : CoreEvent) {

        let c = COLLISION_TABLE[colId];

        if ((c & COLLISION_DOWN) == COLLISION_DOWN) {

            o.verticalCollision(x*16, y*16, 16, 1, event);
        }
        if ((c & COLLISION_UP) == COLLISION_UP) {

            o.verticalCollision(x*16, (y+1)*16, 16, -1,  event);
        }
        if ((c & COLLISION_WALL_RIGHT) == COLLISION_WALL_RIGHT) {

            o.wallCollision((x+1)*16, y*16, 16, -1, event);
        }
        if ((c & COLLISION_WALL_LEFT) == COLLISION_WALL_LEFT) {

            o.wallCollision(x*16, y*16, 16, 1, event);
        }
    }


    public objectCollisions(o : CollisionObject, event : CoreEvent) {

        const RADIUS = 2;
        const BASE_TILE_MAX = 15;

        if (!o.doesExist() || o.isDying() || !o.isInCamera()) 
            return;

        let px = Math.floor(o.getPos().x / 16);
        let py = Math.floor(o.getPos().y / 16);

        let tid : number;
        let colId : number;

        for (let layer = 0; layer < this.layers.length - 1; ++ layer) {

            for (let y = py - RADIUS; y <= py + RADIUS; ++ y) {

                for (let x = px - RADIUS; x <= px + RADIUS; ++ x) {

                    tid = this.getTile(layer, x, y);
                    if (tid <= 0) continue;

                    colId = this.collisionMap.getIndexedTile(0, tid-1);
                    if (colId <= 0) continue;

                    if (colId <= BASE_TILE_MAX) {

                        this.handleBaseTileCollision(o, layer,  x, y, colId-1, event);
                    }
                }
            }
        }
    }
}
