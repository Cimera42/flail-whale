import Vec2 from './Utilities/vectors';

class Game {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;

    fps: number = 0;
    drawFPS: number | undefined = undefined;
    thenFPS: number = 0;
    then = Date.now();
    keyPresses: Record<string, boolean> = {};

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

        this.loop();
    }

    setupListeners = () => {
        this.canvas.addEventListener(
            'mousedown',
            function (e) {
                var mousePos = new Vec2((e.x | e.clientX) - 8, (e.y | e.clientY) - 8);
                if (e.detail == 1) {
                } else if (e.detail == 3) {
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

        this.logic(delta);
        this.render();

        this.fps++;
        if (now > this.thenFPS + 1000) {
            this.thenFPS = now;
            this.drawFPS = this.fps;
            this.fps = 0;
        }

        requestAnimationFrame(this.loop);
    };

    render = () => {
        this.ctx.fillStyle = 'lightblue';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.drawFPS != undefined) {
            this.ctx.font = '18px Helvetica';
            this.ctx.fillStyle = 'black';
            this.ctx.fillText('FPS: ' + this.drawFPS, 4, 22);
        }
    };

    logic = (inDelta: number) => {};
}

export default Game;
