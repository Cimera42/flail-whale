import Fish from './fish';
import Harpoon from './harpoon';
import Map from './map';
import Player from './player';
import {clamp} from './Utilities/maths';
import Vec2 from './Utilities/vectors';

class Game {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;

    fps: number = 0;
    drawFPS: number | undefined = undefined;
    thenFPS: number = 0;
    then = Date.now();
    keyPresses: Record<string, boolean> = {};

    map: Map;

    player: Player;
    fish: Fish;
    harpoon: Harpoon;

    camera: Vec2;

    bounds: [Vec2, Vec2];

    captureDist: number = 150;

    constructor() {
        this.canvas = document.createElement('canvas');
        const newCtx = this.canvas.getContext('2d', {
            alpha: false,
        });

        if (!newCtx) {
            throw Error('Context not found');
        }
        this.ctx = newCtx;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.oncontextmenu = function () {
            return false;
        };
        document.body.appendChild(this.canvas);

        this.ctx.imageSmoothingEnabled = false;

        this.setupListeners();

        this.camera = new Vec2(0, 0);
        this.player = new Player(-200, 0, Math.PI);
        this.harpoon = new Harpoon(this.player);

        this.map = new Map(this.ctx, 5000, 500, this.player);

        this.fish = new Fish(-400, 0, this.map, this.harpoon);

        const min = new Vec2(-this.map.size / 2, -this.map.size / 2);
        const max = new Vec2(this.map.size / 2, this.map.size / 2);
        this.bounds = [min, max];

        this.loop();
    }

    setupListeners = () => {
        this.canvas.addEventListener(
            'mousedown',
            (e) => {
                var mousePos = new Vec2(
                    (e.x | e.clientX) - this.canvas.width / 2,
                    (e.y | e.clientY) - this.canvas.height / 2
                );
                if (e.button == 0) {
                    this.player.charging = true;
                    this.player.chargingTime = 0;
                } else if (e.button == 2) {
                    this.player.charging = false;
                    this.harpoon.active = false;
                    this.harpoon.attachedTo = undefined;
                }
            },
            false
        );
        this.canvas.addEventListener(
            'mouseup',
            (e) => {
                var mousePos = new Vec2(
                    (e.x | e.clientX) - this.canvas.width / 2,
                    (e.y | e.clientY) - this.canvas.height / 2
                );
                if (e.button == 0) {
                    if (this.player.charging) {
                        this.harpoon.position = this.player.position.clone();
                        this.harpoon.active = true;
                        this.harpoon.attachedTo = undefined;

                        let launchSpeed = this.player.chargingTime * 100;
                        launchSpeed = clamp(launchSpeed, 50, 400);

                        const diffToMouse = Vec2.subtractVec(
                            Vec2.addVec(mousePos, this.camera),
                            this.player.position
                        );

                        const angle = Vec2.angleOfVec(diffToMouse);
                        const dir = Vec2.normaliseVec(diffToMouse);
                        const vel = Vec2.multiplyVec(dir, launchSpeed);
                        vel.add(this.player.velocity);

                        this.harpoon.velocity = vel;
                        this.harpoon.angle = angle;
                    }
                } else if (e.button == 2) {
                }
            },
            false
        );

        addEventListener(
            'keydown',
            (e) => {
                this.keyPresses[e.key] = true;
            },
            false
        );
        addEventListener(
            'keyup',
            (e) => {
                this.keyPresses[e.key] = false;
            },
            false
        );
    };

    loop = () => {
        var now = Date.now();
        var delta = now - this.then;
        this.then = now;

        let frameTime = delta ? 1 / delta : 0;

        this.logic(frameTime);
        this.render();

        this.fps++;
        if (now > this.thenFPS + 1000) {
            this.thenFPS = now;
            this.drawFPS = this.fps;
            this.fps = 0;
        }

        requestAnimationFrame(this.loop);
    };

    logic = (inDelta: number) => {
        const accel = this.keyPresses[' '] ? 50 : 20;

        let d = 0;
        if (this.keyPresses['a']) {
            this.player.angle -= 1 * inDelta;
        }
        if (this.keyPresses['d']) {
            this.player.angle += 1 * inDelta;
        }
        if (this.keyPresses['w']) {
            d += 1;
        }
        if (this.keyPresses['s']) {
            d -= 1;
        }

        const dir = Vec2.vecOfAngle(this.player.angle);

        const acceleration = Vec2.multiplyVec(dir, d * accel);
        const deltaAccel = Vec2.multiplyVec(acceleration, inDelta);
        this.player.velocity.add(deltaAccel);

        this.player.logic(inDelta);
        this.player.position.x = clamp(this.player.position.x, this.bounds[0].x, this.bounds[1].x);
        this.player.position.y = clamp(this.player.position.y, this.bounds[0].y, this.bounds[1].y);

        if (this.harpoon.active) {
            this.harpoon.logic(inDelta);
        }

        this.fish.logic(inDelta);

        if (this.harpoon.active && !this.harpoon.attachedTo) {
            const dist = Vec2.distance(this.harpoon.position, this.fish.position);
            if (dist < 30) {
                this.harpoon.attachedTo = this.fish;
            }
            const playerDist = Vec2.distance(this.harpoon.position, this.player.position);
            if (playerDist > 500) {
                this.harpoon.active = false;
            }
        }

        if (this.harpoon.attachedTo) {
            const diff = Vec2.subtractVec(this.harpoon.attachedTo.position, this.player.position);
            const dist = diff.length();
            const deltaDiff = Vec2.multiplyVec(diff, (inDelta * dist) / 5000);
            this.player.velocity.add(deltaDiff);

            const fishDeltaDiff = Vec2.multiplyVec(deltaDiff, -0.05);
            this.fish.velocity.add(fishDeltaDiff);
        }

        const playerData = this.map.dataAtWorldPos(this.player.position);
        if (playerData > 0.75) {
            this.player.dead = true;
            this.harpoon.attachedTo = undefined;
            this.harpoon.active = false;
        }

        this.camera = this.player.position.clone();
        this.camera.x = clamp(
            this.camera.x,
            this.bounds[0].x + this.canvas.width / 2,
            this.bounds[1].x - this.canvas.width / 2
        );
        this.camera.y = clamp(
            this.camera.y,
            this.bounds[0].y + this.canvas.height / 2,
            this.bounds[1].y - this.canvas.height / 2
        );
    };

    render = () => {
        this.ctx.fillStyle = 'lightblue';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.translate(-this.camera.x, -this.camera.y);

        this.map.renderLower(this.ctx);

        if (this.harpoon.attachedTo) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(
                this.fish.position.x,
                this.fish.position.y,
                this.captureDist,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = 'red';
            this.ctx.globalAlpha = 0.4;
            this.ctx.fill();
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.4;
            this.ctx.stroke();
            this.ctx.restore();
        }

        this.fish.render(this.ctx);

        this.map.renderUpper(this.ctx);

        this.player.render(this.ctx);

        if (!this.harpoon.attachedTo && !this.player.dead) {
            const angleToFish = Vec2.angleOfVec(
                Vec2.subtractVec(this.fish.position, this.player.position)
            );
            this.ctx.save();
            this.ctx.translate(this.player.position.x, this.player.position.y);
            this.ctx.rotate(angleToFish);
            this.ctx.beginPath();
            this.ctx.moveTo(50, 10);
            this.ctx.lineTo(50, -10);
            this.ctx.lineTo(75, 0);
            this.ctx.fillStyle = 'red';
            this.ctx.fill();
            this.ctx.restore();
        }

        if (this.harpoon.active) {
            this.harpoon.render(this.ctx);
        }

        this.ctx.restore();

        if (this.player.dead) {
            this.ctx.font = 'bold 42px Helvetica';
            this.ctx.fillStyle = 'black';
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 4;
            const deadText = 'You Crashed';
            const measured = this.ctx.measureText(deadText);
            this.ctx.strokeText(
                deadText,
                this.canvas.width / 2 - measured.width / 2,
                this.canvas.height / 2 + 100
            );
            this.ctx.fillText(
                deadText,
                this.canvas.width / 2 - measured.width / 2,
                this.canvas.height / 2 + 100
            );
        }

        if (this.drawFPS != undefined) {
            this.ctx.font = '18px Helvetica';
            this.ctx.fillStyle = 'black';
            this.ctx.fillText('FPS: ' + this.drawFPS, 4, 22);
        }
    };
}

export default Game;
