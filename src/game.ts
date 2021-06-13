import Fish from './fish';
import Harpoon from './harpoon';
import Map from './map';
import Player from './player';
import {clamp} from './Utilities/maths';
import Vec2 from './Utilities/vectors';
import BackgroundURL from 'url:./assets/mixkit-sea-waves-ambience-1189.mp3';
import CannonURL from 'url:./assets/GunCannon.mp3';
import HarpoonURL from 'url:./assets/Harpoon.mp3';
import WhaleURL from 'url:./assets/Whale.mp3';

class Game {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;

    fps: number = 0;
    drawFPS: number | undefined = undefined;
    thenFPS: number = 0;
    then = Date.now();
    keyPresses: Record<string, boolean> = {};

    map!: Map;

    player!: Player;
    fish!: Fish;
    harpoon!: Harpoon;

    camera!: Vec2;

    bounds: [Vec2, Vec2];

    captureDist: number = 150;

    mapSeed: number = 0;
    hasWon: boolean;

    muted: boolean;
    backgroundAudio: HTMLAudioElement;
    whaleAudio: HTMLAudioElement;

    constructor() {
        this.muted = false;

        this.backgroundAudio = new Audio(BackgroundURL);
        this.backgroundAudio.loop = true;
        this.backgroundAudio.play();
        this.backgroundAudio.volume = 0.05;

        this.whaleAudio = new Audio(WhaleURL);
        this.whaleAudio.loop = true;
        this.whaleAudio.pause();
        this.whaleAudio.volume = 0.1;

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

        this.hasWon = false;
        this.setup();

        const min = new Vec2(-this.map.size / 2, -this.map.size / 2);
        const max = new Vec2(this.map.size / 2, this.map.size / 2);
        this.bounds = [min, max];

        this.loop();
    }

    setup = () => {
        this.camera = new Vec2(0, 0);
        this.player = new Player(-200, 0, Math.PI);
        this.harpoon = new Harpoon(this.player);

        this.map = new Map(this.ctx, 5000, 500, this.player, this.mapSeed);

        this.fish = new Fish(550, -100, this.map, this.harpoon);
    };

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
                    this.harpoon.active = false;
                    this.harpoon.attachedTo = undefined;
                    this.whaleAudio.pause();
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
                    if (!this.player.dead && this.fish.health > 0) {
                        if (this.player.charging && !this.harpoon.active) {
                            this.harpoon.position = this.player.position.clone();
                            this.harpoon.active = true;
                            this.harpoon.attachedTo = undefined;

                            if (!this.muted) {
                                const sound = new Audio(CannonURL);
                                sound.volume = 0.5;
                                sound.play();
                            }

                            // let launchSpeed = this.player.chargingTime * 100;
                            const launchSpeed = 350;

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
                    }
                } else if (e.button == 2) {
                }
            },
            false
        );

        addEventListener(
            'keydown',
            (e) => {
                if (!e.repeat) {
                    this.keyPresses[e.key] = true;
                }
            },
            false
        );
        addEventListener(
            'keyup',
            (e) => {
                if (!e.repeat) {
                    this.keyPresses[e.key] = false;
                }
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
        const accel = 20;

        if (this.keyPresses['r']) {
            if (this.player.dead) {
                this.setup();
                return;
            }
        }
        if (this.keyPresses['n']) {
            this.keyPresses['n'] = false;
            if (this.hasWon || this.fish.health <= 0) {
                this.mapSeed = Math.random();
                this.setup();
                return;
            }
        }
        if (this.keyPresses['m']) {
            this.keyPresses['m'] = false;
            this.muted = !this.muted;
            this.backgroundAudio.muted = this.muted;
            this.whaleAudio.muted = this.muted;
        }

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

        if (!this.player.dead) {
            this.player.logic(inDelta);
        }
        this.player.position.x = clamp(this.player.position.x, this.bounds[0].x, this.bounds[1].x);
        this.player.position.y = clamp(this.player.position.y, this.bounds[0].y, this.bounds[1].y);

        if (this.harpoon.active) {
            this.harpoon.logic(inDelta);
        }

        if (this.fish.health > 0) {
            this.fish.logic(inDelta);
        } else {
            this.hasWon = true;
            this.harpoon.attachedTo = undefined;
            this.harpoon.active = false;
        }

        if (this.harpoon.active && !this.harpoon.attachedTo) {
            const dist = Vec2.distance(this.harpoon.position, this.fish.position);
            if (dist < 30) {
                this.harpoon.attachedTo = this.fish;

                if (!this.muted) {
                    const sound = new Audio(HarpoonURL);
                    sound.volume = 0.3;
                    sound.play();

                    this.whaleAudio.play();
                }
            }
            const playerDist = Vec2.distance(this.harpoon.position, this.player.position);
            if (playerDist > 500) {
                this.harpoon.active = false;
            }
        }

        if (this.harpoon.attachedTo && !this.player.dead && this.fish.health > 0) {
            const diff = Vec2.subtractVec(this.harpoon.attachedTo.position, this.player.position);
            const dist = diff.length();
            const deltaDiff = Vec2.multiplyVec(diff, (inDelta * dist) / 5000);
            this.player.velocity.add(deltaDiff);

            const fishDeltaDiff = Vec2.multiplyVec(deltaDiff, -0.05);
            this.fish.velocity.add(fishDeltaDiff);

            if (dist < this.captureDist) {
                this.fish.health -= inDelta * 1000;

                if (this.fish.health < 0) {
                    this.whaleAudio.pause();
                    this.whaleAudio.currentTime = 0;
                }
            }
        }

        const playerData = this.map.dataAtWorldPos(this.player.position);
        if (playerData > this.map.landData) {
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

        if (!this.harpoon.attachedTo && !this.player.dead && this.fish.health > 0) {
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

        if (this.fish.health <= 0) {
            this.ctx.save();
            this.ctx.font = 'bold 42px Helvetica';
            this.ctx.fillStyle = 'black';
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 4;
            const deadText = 'You Win!!!';
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
            this.ctx.restore();

            this.ctx.font = 'bold 24px Helvetica';
            this.ctx.fillStyle = 'black';
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            const newMapText = "Press 'N' to start a new map";
            const newMapMeasured = this.ctx.measureText(newMapText);
            this.ctx.strokeText(
                newMapText,
                this.canvas.width / 2 - newMapMeasured.width / 2,
                this.canvas.height / 2 + 150
            );
            this.ctx.fillText(
                newMapText,
                this.canvas.width / 2 - newMapMeasured.width / 2,
                this.canvas.height / 2 + 150
            );
        } else if (this.player.dead) {
            this.ctx.save();
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
            this.ctx.restore();

            this.ctx.font = 'bold 24px Helvetica';
            this.ctx.fillStyle = 'black';
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            const restartText = "Press 'R' to restart";
            const restartMeasured = this.ctx.measureText(restartText);
            this.ctx.strokeText(
                restartText,
                this.canvas.width / 2 - restartMeasured.width / 2,
                this.canvas.height / 2 + 150
            );
            this.ctx.fillText(
                restartText,
                this.canvas.width / 2 - restartMeasured.width / 2,
                this.canvas.height / 2 + 150
            );

            if (this.hasWon) {
                this.ctx.font = 'bold 24px Helvetica';
                this.ctx.fillStyle = 'black';
                this.ctx.strokeStyle = 'white';
                this.ctx.lineWidth = 2;
                const newMapText = "Or press 'N' to start a new map";
                const newMapMeasured = this.ctx.measureText(newMapText);
                this.ctx.strokeText(
                    newMapText,
                    this.canvas.width / 2 - newMapMeasured.width / 2,
                    this.canvas.height / 2 + 200
                );
                this.ctx.fillText(
                    newMapText,
                    this.canvas.width / 2 - newMapMeasured.width / 2,
                    this.canvas.height / 2 + 200
                );
            }
        }

        if (this.drawFPS != undefined) {
            this.ctx.font = '18px Helvetica';
            this.ctx.fillStyle = 'black';
            this.ctx.fillText('FPS: ' + this.drawFPS, 4, 22);
        }

        this.ctx.fillStyle = 'black';
        let y = 44;
        this.ctx.font = 'bold 18px Helvetica';
        this.ctx.fillText('Instructions:', 4, (y += 22));
        this.ctx.font = '18px Helvetica';
        this.ctx.fillText('Goal is to harpoon the whale and stay near', 4, (y += 22));
        this.ctx.fillText('A/D for steering', 4, (y += 22));
        this.ctx.fillText('W/S for forward/reverse', 4, (y += 22));
        this.ctx.fillText('Left click for harpoon', 4, (y += 22));
        this.ctx.fillText('Right click to release harpoon', 4, (y += 22));
    };
}

export default Game;
