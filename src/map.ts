import { Camera } from "./camera.js";
import { Canvas } from "./canvas.js";
import { CoreEvent } from "./core.js";
import { Localization } from "./localization.js";
import { drawBox } from "./messagebox.js";
import { ObjectManager } from "./objectmanager.js";
import { ProgressManager } from "./progress.js";
import { Stage } from "./stage.js";
import { Rect, Vector2 } from "./vector.js";


export class WorldMap {


    private stars : Array<boolean>;
    private enemies : Array<boolean>;
    private visited : Array<boolean>;
    private connections : Array<Rect>;

    private pos : Vector2;

    private active : boolean;
    private flickerTime : number;

    private readonly width : number;
    private readonly height : number;

    private readonly progress : ProgressManager;

    private readonly loc : Localization;


    constructor(stage : Stage, progress : ProgressManager, event : CoreEvent) {

        this.width = (stage.width / 10) | 0;
        this.height = (stage.height / 9) | 0;

        this.stars = (new Array<boolean> (this.width*this.height)).fill(false);
        this.enemies = (new Array<boolean> (this.width*this.height)).fill(false);
        this.visited = (new Array<boolean> (this.width*this.height)).fill(false);
        this.connections = (new Array<Rect> (this.width*this.height)).fill(null);

        this.progress = progress;

        this.pos = new Vector2();

        this.active = false;
        this.flickerTime = 0;

        this.loc = event.localization;
    }


    private removeDuplicateConnections() {

        for (let i = 0; i < this.connections.length; ++ i) {

            if (this.connections[i] == null)
                continue;

            for (let j = 0; j < this.connections.length; ++ j) {

                if (i == j) continue;

                if (this.connections[j] == null)
                    continue;

                if (this.connections[i].isEqualToOpposite(this.connections[j])) {

                    this.connections[j] = null;
                }
            }
        }
    }


    public activate(stage : Stage, objects : ObjectManager, camera : Camera) {

        this.pos = camera.getRealPosition();

        let w = Math.floor(stage.width/10);
        let dx : number;
        let dy : number;

        for (let i = 0; i < this.width * this.height; ++ i) {

            this.visited[i] = this.progress.doesValueExistInArray("roomVisited", i);
            if (this.visited[i] ||
                this.progress.doesValueExistInArray("items", 12)) {

                dx = i % w;
                dy = (i / w) | 0;

                this.stars[i] = objects.hasStarInArea(
                    dx*camera.width, dy*camera.height, 
                    camera.width, camera.height);

                this.enemies[i] = objects.hasEnemyInArea(
                    dx*camera.width, dy*camera.height, 
                    camera.width, camera.height);

                this.connections[i] = objects.getDoorConnectionInArea(
                    dx*camera.width, dy*camera.height, 
                    camera.width, camera.height, camera);
            }
            else {

                this.stars[i] = false;
                this.enemies[i] = false;
                this.connections[i] = null;
            }
        }

        this.removeDuplicateConnections();

        this.active = true;
        this.flickerTime = 0;
    }   


    public update(event : CoreEvent) {

        const FLICKER_SPEED = 1.0/60.0;

        if (!this.active) return;

        if (event.input.anyPressed()) {

            event.audio.playSample(event.assets.getSample("select"), 0.50);

            this.active = false;
        }
        
        this.flickerTime = (this.flickerTime + FLICKER_SPEED) % 1.0;
    }


    public draw(canvas : Canvas) {

        const MARGIN = 2;

        if (!this.active) return;

        let bmp = canvas.assets.getBitmap("mapIcons");

        canvas.setFillColor(0, 0, 0, 0.67);
        canvas.fillRect();

        let w = this.width*10;
        let h = this.height*9;

        let dx = canvas.width/2 - w/2;
        let dy = canvas.height/2 - h/2;

        drawBox(canvas, dx-MARGIN, dy-MARGIN, w + MARGIN*2, h + MARGIN*2);

        let sx : number;

        // Background Tiles
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                if (!this.visited[y * this.width + x])
                    continue;

                canvas.setFillColor(170, 170, 255);
                canvas.fillRect(dx + x*10, dy + y*9, 10, 9);
                
            }
        }

        // Connections
        canvas.setFillColor(0, 255, 0, 0.67);
        for (let c of this.connections) {

            if (c == null)
                continue;

            if (!this.visited[c.y*this.width + c.x] ||
                !this.visited[c.h*this.width + c.w])
                continue;

            canvas.drawPixelatedLine(
                dx + c.x*10 + 5, 
                dy + c.y*9 + 4, 
                dx + c.w*10 + 5, 
                dy + c.h*9 + 4);
        }

        // Icons
        for (let y = 0; y < this.height; ++ y) {

            for (let x = 0; x < this.width; ++ x) {

                if (this.flickerTime < 0.5 &&
                    x == this.pos.x && y == this.pos.y) {

                    canvas.drawBitmapRegion(bmp, 30, 0, 10, 9,
                        dx + x*10, dy + y*9);
                }

                sx = -1;
                if (this.stars[y * this.width + x] && this.enemies[y * this.width + x]) {

                    sx = 0;
                }
                else if (this.stars[y * this.width + x]) {

                    sx = 10;
                }
                else if(this.enemies[y * this.width + x]) {

                    sx = 20;
                }

                if (sx >= 0) {

                    canvas.drawBitmapRegion(bmp, sx, 0, 10, 9,
                        dx + x*10, dy + y*9);
                }
            }
        }

        canvas.drawText(canvas.assets.getBitmap("fontYellow"),
            this.loc.findValue(["worldMap"]), 
            canvas.width/2, 8, 0, 0, true);
    }   


    public isActive = () : boolean => this.active;
}
