import Fish from './fish';
import Harpoon from './harpoon';
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

    player: Player;
    fishList: Fish[];
    harpoon: Harpoon;

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

        this.player = new Player();
        this.harpoon = new Harpoon(this.player);
        this.fishList = [new Fish(10, 10)];

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
                    this.player.charging = true;
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

                        const angle = Vec2.angleOfVec(mousePos);
                        const dir = Vec2.normaliseVec(mousePos);
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

        if (this.harpoon.active) {
            this.harpoon.logic(inDelta);
        }

        for (const fish of this.fishList) {
            fish.logic(inDelta);

            if (this.harpoon.active && !this.harpoon.attachedTo) {
                const dist = Vec2.distance(this.harpoon.position, fish.position);
                if (dist < 30) {
                    this.harpoon.attachedTo = fish;
                }
            }
        }

        if (this.harpoon.attachedTo) {
            const diff = Vec2.subtractVec(this.harpoon.attachedTo.position, this.player.position);
            const dist = diff.length();
            const deltaDiff = Vec2.multiplyVec(diff, (inDelta * dist) / 10000);
            this.player.velocity.add(deltaDiff);
        }
    };

    render = () => {
        this.ctx.fillStyle = 'lightblue';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);

        this.player.render(this.ctx);

        this.ctx.translate(-this.player.position.x, -this.player.position.y);

        for (const fish of this.fishList) {
            fish.render(this.ctx);
        }

        if (this.harpoon.active) {
            this.harpoon.render(this.ctx);
        }

        this.ctx.restore();

        if (this.drawFPS != undefined) {
            this.ctx.font = '18px Helvetica';
            this.ctx.fillStyle = 'black';
            this.ctx.fillText('FPS: ' + this.drawFPS, 4, 22);
        }
    };
}

export default Game;
