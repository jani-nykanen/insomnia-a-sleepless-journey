import { Camera } from "./camera.js";
import { Bitmap } from "./types.js";
import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { negMod } from "./math.js";
import { Tilemap } from "./tilemap.js";
import { ObjectManager } from "./objectmanager.js";
import { CollisionObject, nextObject } from "./gameobject.js";
import { Particle } from "./particle.js";
import { Vector2 } from "./vector.js";
import { Sprite } from "./sprite.js";
import { NPC } from "./npc.js";
import { ProgressManager } from "./progress.js";
import { SnowflakeGenerator } from "./snowflakes.js";


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

    private particles : Array<Particle>;

    private sprFence : Sprite;

    private fansEnabled : boolean;

    private waterPos : number;
    private waterWave : number;

    private snowflakeGen : SnowflakeGenerator;

    public readonly width : number;
    public readonly height : number;
    public readonly waterLevel : number;

    private readonly progress : ProgressManager;


    constructor(camera : Camera, progress : ProgressManager, event : CoreEvent) {

        this.tilemap = event.assets.getTilemap("base");
        this.collisionMap = event.assets.getTilemap("collisionMap")

        this.width = this.tilemap.width;
        this.height = this.tilemap.height;
        this.waterLevel = Number(this.tilemap.getProperty("waterLevel"));

        this.layers = this.tilemap.cloneLayers(3);

        this.particles = new Array<Particle> ();

        this.sprFence = new Sprite(16, 16);

        this.fansEnabled = false;

        this.waterPos = 0;
        this.waterWave = 0;

        this.snowflakeGen = new SnowflakeGenerator(camera);

        this.progress = progress;
    }


    private getTile(layer : number, x : number, y : number, loopx = false, loopy = false) {

        if (loopx) x = negMod(x, this.width);
        if (loopy) y = negMod(y, this.height);

        if ((!loopx && (x < 0 || x >= this.width)) ||
            (!loopy && (y < 0 || y >= this.height)))
            return 0;

        return this.layers[layer][y*this.width + x];
    }


    private setTile(val : number, layer : number, x : number, y : number, loopx = false, loopy = false) {

        if (loopx) x = negMod(x, this.width);
        if (loopy) y = negMod(y, this.height);

        if ((!loopx && (x < 0 || x >= this.width)) ||
            (!loopy && (y < 0 || y >= this.height)))
            return 0;

        this.layers[layer][y*this.width + x] = val;
    }


    public update(camera : Camera, event : CoreEvent, inside = false) {

        const FENCE_ANIM_SPEED = 4;
        const WATER_SPEED = 0.25;
        const WATER_WAVE_SPEED = 0.067;

        for (let p of this.particles) {

            p.update(event);
            p.cameraCheck(camera);
        }

        this.sprFence.animate(0, 0, 3, FENCE_ANIM_SPEED, event.step);

        if (this.progress.getBooleanProperty("fansEnabled")) {

            this.fansEnabled = true;
        }

        if (!inside) {

            this.snowflakeGen.update(camera, event);
        }

        this.waterPos = (this.waterPos + WATER_SPEED*event.step) % 16;
        this.waterWave = (this.waterWave + WATER_WAVE_SPEED*event.step) % (Math.PI*2);
    }


    private drawInsideBackground(canvas : Canvas, camera : Camera) {

        canvas.clear(0, 0, 0);

        let bmp = canvas.assets.getBitmap("brickwall");

        let p = camera.getPosition();

        let shiftx = (Math.round(p.x / 4)) % bmp.width;
        let shifty = (Math.round(p.y / 4)) % bmp.height;

        for (let y = -2; y <= 2; ++ y) {

            for (let x = -2; x <= 2; ++ x) {

                canvas.drawBitmap(bmp, 
                    x*bmp.width - shiftx,
                    y*bmp.height - shifty);
            }
        }
    }


    public drawBackground(canvas : Canvas, camera : Camera, inside = false) {
        
        const FOREST_BASE_SHIFT = 80;

        if (inside) {

            this.drawInsideBackground(canvas, camera);
            return;
        }

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



    private drawWind(canvas : Canvas, dx : number, dy : number, h : number) {

        let bmp = canvas.assets.getBitmap("propeller");

        let y : number;
        for (let j = 0; j < h; ++ j) {

            y = dy - j*16;

            canvas.drawSpriteFrame(this.sprFence,bmp,
                this.sprFence.getColumn(), 1,
                dx, y);
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

                switch (tid) {

                // Fan
                case 15:

                    if (this.fansEnabled) {

                        this.drawWind(canvas, x*16, y*16-8, 3);
                        canvas.drawSprite(this.sprFence,
                            canvas.assets.getBitmap("propeller"),
                            x*16, y*16);
                    }
                    else {

                        canvas.drawSpriteFrame(this.sprFence,
                            canvas.assets.getBitmap("propeller"),
                            0, 0, x*16, y*16);
                    }
                        
                    break;

                // Fence
                case 94:
                case 95:
                    canvas.drawSpriteFrame(this.sprFence,
                        canvas.assets.getBitmap("fence"),
                        this.sprFence.getColumn(), tid-94,
                        x*16, y*16);
                    break;

                default:
                    srcx = (tid % 16) | 0;
                    srcy = (tid / 16) | 0;

                    canvas.drawBitmapRegion(bmp,
                        srcx*16, srcy*16, 16, 16,
                        x*16, y*16);
                    break;
                }
            }
        }
    }


    private drawWater(canvas : Canvas, 
        sy : number,  ey : number, camera : Camera, 
        inside : boolean) {

        const WATER_ALPHA = 0.67;

        if (ey < this.waterLevel || inside) return;

        let p = camera.getPosition();
        let bmp = canvas.assets.getBitmap("tileset");

        let wy = (this.waterLevel + 1)*16;

        let surfaceJump = Math.round(1 + Math.sin(this.waterWave));

        // Water surface
        if (sy < this.waterLevel) {

            for (let layer = 0; layer < 2; ++ layer) {

                canvas.setGlobalAlpha(layer == 0 ? WATER_ALPHA : 1.0);
                for (let x = -1; x < ((camera.width/16) | 0) + 1; ++ x) {

                    canvas.drawBitmapRegion(bmp, 
                        16 - layer*16, 160, 
                        16, 16-surfaceJump,
                        p.x + x*16 - Math.round(this.waterPos), 
                        this.waterLevel*16 + surfaceJump);
                }
            }
            canvas.setGlobalAlpha();
            
        }
        else {

            wy = p.y;
        }

        let wh = (p.y + camera.height) - wy;
        
        // The rest of the water
        canvas.setFillColor(0, 0, 0, WATER_ALPHA);
        canvas.fillRect(p.x, wy, camera.width, wh);
    }


    public draw(canvas : Canvas, camera : Camera, inside = false) {

        let bmp = canvas.assets.getBitmap("tileset");

        let p = camera.getPosition();

        let sx = Math.floor(p.x / 16) - 1;
        let sy = Math.floor(p.y / 16) - 1;

        let ex = sx + Math.floor(canvas.width / 16) + 2;
        let ey = sy + Math.floor(canvas.height / 16) + 2;

        for (let layer = 0; layer < this.layers.length; ++ layer) {

            if (layer == 1) 
                this.drawWater(canvas, sy, ey, camera, inside);

            this.drawLayer(canvas, layer, bmp, sx, sy, ex, ey);
        }

        for (let p of this.particles) {

            p.draw(canvas);
        }
    }


    public postDraw(canvas : Canvas, inside = false) {

        if (inside) return;

        this.snowflakeGen.draw(canvas);
    }


    public parseObjects(objects : ObjectManager, event : CoreEvent) {

        const START_INDEX = 256;
        const NPC_START_INDEX = START_INDEX + 241;

        let tid : number;
        let id = 0;

        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                tid = this.tilemap.getTile(3, x, y) - START_INDEX;

                if (tid <= 0) continue;

                if (y > 0)
                    id = this.tilemap.getTile(3, x, y-1) - NPC_START_INDEX;

                switch (tid) {

                // Player
                case 1:
                    objects.createPlayer(x, y, Boolean(this.tilemap.getProperty("startInside")));
                    break;

                // Switch
                case 2:
                    objects.addSwitch(x, y);
                    break;

                // Star
                case 3:
                    objects.addStar(x, y);
                    break;

                // NPC:
                case 4:
                    objects.addNPC(x, y, id);
                    break;

                // Chest
                case 5:
                    objects.addChest(x, y, id);
                    break;

                // Lever
                case 6:
                    objects.addLever(x, y);
                    break;

                // Door
                case 7:
                case 8:
                    objects.addDoor(x, y, id, tid == 8);
                    break;

                // Save point
                case 9:
                    objects.addSavepoint(x, y, id);
                    break;

                // Hint trigger
                case 10:
                    objects.addHintTrigger(x, y, id, event);
                    break;

                // Orbs
                case 11:
                case 12:
                    objects.addOrb(x, y, tid-11);
                    break;

                // Portal
                case 13:
                    objects.addPortal(x, y);
                    break;

                default:

                    if (tid >= 17 && tid < 17+16) {

                        objects.addEnemy(x, y, tid-17);
                    }

                    break;
                }
            }
        }
    }


    private spawnParticles(x : number, y : number, 
        count : number, speedAmount : number, angleOffset = 0,
        ordered = false, row = 0) {

        const BASE_JUMP = -1.75;
        const GRAVITY = 0.15;

        let angle : number;
        let speed : Vector2;

        for (let i = 0; i < count; ++ i) {

            angle = Math.PI * 2 / count * i + angleOffset;

            speed = new Vector2(
                Math.cos(angle) * speedAmount,
                -Math.sin(angle) * speedAmount + BASE_JUMP * speedAmount);

            nextObject(this.particles, Particle)
                .spawn(x, y, speed, GRAVITY, row, 
                    ordered ? i : ((Math.random() * 4) | 0));
        }
    }


    private handleBaseTileCollision(o : CollisionObject, 
        layer : number, x : number, y : number, 
        colId : number, event : CoreEvent) : boolean {

        let c = COLLISION_TABLE[colId];
        let ret = false;

        if ((c & COLLISION_DOWN) == COLLISION_DOWN) {

            ret = o.verticalCollision(x*16, y*16, 16, 1, event);
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

        return ret;
    }


    private boxCollision(o : CollisionObject, 
        x : number, y : number, 
        w : number, h : number, 
        event : CoreEvent) {

        o.verticalCollision(x, y, w, 1, event);
        o.verticalCollision(x, y+h, w, -1, event);
        o.wallCollision(x + w, y, h, -1, event);
        o.wallCollision(x, y, h, 1, event);
    }


    private removeFences(camera : Camera) {

        let p = camera.getPosition();

        let sx = (p.x / camera.width) | 0;
        let sy = (p.y / camera.height) | 0;

        let w = (camera.width / 16) | 0;
        let h = (camera.height / 16) | 0;

        sx *= w;
        sy *= h;

        let tid : number;

        for (let layer = 0; layer < 3; ++ layer) {

            for (let y = sy; y < sy + h; ++ y) {

                for (let x = sx; x < sx + w; ++ x) {

                    tid = this.getTile(layer, x, y);

                    if (tid == 95 || tid == 96) {

                        this.setTile(0, layer, x, y);
                    }
                }
            }
        }
    }


    private handleSpecialTileCollision(o : CollisionObject, 
        layer : number, x : number, y : number, 
        colId : number, camera : Camera, event : CoreEvent) {
    
        const HURT_START = 18;
        const HURT_X = [2, 0, 2, 9, 5, 0];
        const HURT_Y = [9, 2, 0, 2, 0, 5];
        const HURT_WIDTH = [12, 7, 12, 7, 6, 16];
        const HURT_HEIGHT = [7, 12, 8, 12, 16, 6];
        const HURT_DIR = [0, 1, 0, -1, 0, 0];

        const LADDER_WIDTH = 8;
        const BREAK_COL_WIDTH = 14;

        const WIND_WIDTH = 16;
        const WIND_HEIGHT = 48;
        const WIND_OFFSET = 8;

        let ladderOff = (16 - LADDER_WIDTH) / 2;

        let dx : number;
        let dy : number;
        let w : number;
        let h : number;

        switch (colId) {

        // Ladder top
        case 15:

            o.ladderCollision(x*16 + ladderOff, y*16 + 15, 
                    LADDER_WIDTH, 1, true, event);
            o.verticalCollision(x*16, (y+1)*16, 16, 1, event);

            break;
        // Ladder bottom
        case 31:

            o.ladderCollision(x*16 + ladderOff, y*16+1, 
                LADDER_WIDTH, 15, false, event);
            break;
        
        // Breaking tiles
        case 16:
        case 17:

            if (o.breakCollision(
                    x*16 + (16 - BREAK_COL_WIDTH)/2, y*16, 
                    BREAK_COL_WIDTH, 16, colId-16, event)) {

                this.setTile(0, layer, x, y);
                this.spawnParticles(x*16 + 8, y*16 + 8, 
                    colId == 16 ? 6 : 4, 1.5, 
                    colId == 16 ? Math.PI/3 : Math.PI/4, 
                    colId == 17, colId-16);

                if (colId == 17) {

                    this.removeFences(camera);
                }

                event.audio.playSample(event.assets.getSample("break"), 0.60);
            }
            else {

                this.handleBaseTileCollision(o, layer, x, y, 14, event)
            }
            break;

        // Hurt collision
        case 18:
        case 19:
        case 20:
        case 21:
        case 22:
        case 23:

            if (colId >= 21 && o.doesIgnoreFenceCollisions())
                break;

            dx = x*16 + HURT_X[colId - HURT_START];
            dy = y*16 + HURT_Y[colId - HURT_START];
            w = HURT_WIDTH[colId - HURT_START];
            h = HURT_HEIGHT[colId - HURT_START];

            o.hurtCollision(dx, dy, w, h, HURT_DIR[colId - HURT_START], event);
            this.boxCollision(o, dx, dy, w, h, event);

            break;

        // Propeller
        case 24:

            if (this.fansEnabled) {

                o.windCollision(x*16, y*16+WIND_OFFSET - WIND_HEIGHT,
                    WIND_WIDTH, WIND_HEIGHT, event);
            }
            break;

        default:
            break;
        }
    } 


    public objectCollisions(o : CollisionObject, camera : Camera, event : CoreEvent) {

        const RADIUS = 3;
        const BASE_TILE_MAX = 15;
        const WATER_SURFACE_OFFSET = 4;

        if (!o.doesExist() || o.isDying() || !o.isInCamera()) 
            return;

        let px = Math.floor(o.getPos().x / 16);
        let py = Math.floor(o.getPos().y / 16);

        let tid : number;
        let colId : number;

        for (let layer = 0; layer < this.layers.length; ++ layer) {

            for (let y = py - RADIUS; y <= py + RADIUS; ++ y) {

                for (let x = px - RADIUS; x <= px + RADIUS; ++ x) {

                    tid = this.getTile(layer, x, y, true, false);
                    if (tid <= 0) continue;

                    colId = this.collisionMap.getIndexedTile(0, tid-1);
                    if (colId <= 0) continue;

                    if (colId <= BASE_TILE_MAX) {

                        this.handleBaseTileCollision(o, layer, x, y, colId-1, event);
                    }
                    else {

                        this.handleSpecialTileCollision(o, layer, x, y, 
                            colId-1, camera, event);
                    }
                }
            }
        }

        let y = this.waterLevel*16 + WATER_SURFACE_OFFSET;
        let offset = 16;

        let cpos = camera.getPosition();

        if (o.doesTakeCameraBorderCollision()) {
            
            o.wallCollision(cpos.x, cpos.y, camera.height, -1, event);
            o.wallCollision(cpos.x + camera.width, cpos.y, camera.height, 1, event);
        }

        o.waterCollision(0, y, this.width*16, offset, true, event);
        o.waterCollision(0, y+offset, this.width*16, this.height*16 - y - offset, false, event);

        o.verticalCollision(0, 4, this.width*16, -1, event, true);
    }


    public toggleSpecialBlocks() {

        let tid : number;
        for (let layer = 0; layer < 3; ++ layer) {

            for (let i = 0; i < this.width*this.height; ++ i) {

                tid = this.layers[layer][i];
                if (tid == 13)
                    this.layers[layer][i] = 14;
                else if (tid == 14)
                    this.layers[layer][i] = 13;
            }
        }   
    }

}
