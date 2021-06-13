import Player from './player';
import {clamp, lerp} from './Utilities/maths';
import {perlin2} from './Utilities/perlin';
import Vec2 from './Utilities/vectors';

const stops: [number, number, number, number, number, boolean][] = [
    [0, 64, 64, 243, 255, false],
    [0.6, 113, 181, 226, 180, false],
    [0.75, 255, 253, 109, 255, false],
    [0.8, 255, 253, 109, 255, true],
    [0.9, 52, 192, 71, 255, true],
    [1, 56, 155, 69, 255, false],
];

const colourLerp = (n: number): [number, number, number, number] => {
    for (let i = 0; i < stops.length - 1; i++) {
        const lower = stops[i];
        const upper = stops[i + 1];
        if (n >= lower[0] && n <= upper[0]) {
            if (lower[5]) {
                const d = (n - lower[0]) / (upper[0] - lower[0]);
                return [
                    lerp(lower[1], upper[1], d),
                    lerp(lower[2], upper[2], d),
                    lerp(lower[3], upper[3], d),
                    lerp(lower[4], upper[4], d),
                ];
            }
            return [lower[1], lower[2], lower[3], lower[4]];
        }
    }
    return [0, 0, 0, 0];
};

class Map {
    data: number[][];

    player: Player;
    upperCanvas: HTMLCanvasElement;
    lowerCanvas: HTMLCanvasElement;

    scale: number;
    size: number;
    pixelSize: number;

    constructor(ctx: CanvasRenderingContext2D, size: number, pixelSize: number, player: Player) {
        this.scale = size / pixelSize;
        this.size = size;
        this.pixelSize = pixelSize;

        this.data = [];
        for (let i = 0; i < pixelSize; i++) {
            this.data[i] = [];
            for (let j = 0; j < pixelSize; j++) {
                let d = perlin2(i / 100, j / 100);
                d += perlin2(i / 50, j / 50);
                d += perlin2(i / 20, j / 20);
                d = (d + 1) / 2;
                d = clamp(d, 0, 1);
                this.data[i][j] = d;
            }
        }

        const lowerPixels = ctx.createImageData(pixelSize, pixelSize);
        for (let i = 0; i < pixelSize; i++) {
            for (let j = 0; j < pixelSize; j++) {
                const d = this.data[i][j];
                const colour = colourLerp(d);

                lowerPixels.data[j * (pixelSize * 4) + i * 4 + 0] = colour[0];
                lowerPixels.data[j * (pixelSize * 4) + i * 4 + 1] = colour[1];
                lowerPixels.data[j * (pixelSize * 4) + i * 4 + 2] = colour[2];
                lowerPixels.data[j * (pixelSize * 4) + i * 4 + 3] = colour[3];
            }
        }

        this.player = player;

        this.lowerCanvas = document.createElement('canvas');
        this.lowerCanvas.width = pixelSize;
        this.lowerCanvas.height = pixelSize;
        const tempLowerCtx = this.lowerCanvas.getContext('2d');
        if (!tempLowerCtx) {
            throw new Error();
        }
        tempLowerCtx.putImageData(lowerPixels, 0, 0);

        const upperPixels = ctx.createImageData(pixelSize, pixelSize);
        for (let i = 0; i < pixelSize; i++) {
            for (let j = 0; j < pixelSize; j++) {
                const d = this.data[i][j];
                const colour = colourLerp(d);

                upperPixels.data[j * (pixelSize * 4) + i * 4 + 0] = colour[0];
                upperPixels.data[j * (pixelSize * 4) + i * 4 + 1] = colour[1];
                upperPixels.data[j * (pixelSize * 4) + i * 4 + 2] = colour[2];
                upperPixels.data[j * (pixelSize * 4) + i * 4 + 3] = colour[3];

                if (d < 0.6) {
                    upperPixels.data[j * (pixelSize * 4) + i * 4 + 3] = 0;
                }
            }
        }

        this.upperCanvas = document.createElement('canvas');
        this.upperCanvas.width = pixelSize;
        this.upperCanvas.height = pixelSize;
        const tempUpperCtx = this.upperCanvas.getContext('2d');
        if (!tempUpperCtx) {
            throw new Error();
        }
        tempUpperCtx.putImageData(upperPixels, 0, 0);
    }

    renderLower(ctx: CanvasRenderingContext2D) {
        ctx.save();

        ctx.scale(this.scale, this.scale);
        ctx.drawImage(this.lowerCanvas, -this.pixelSize / 2, -this.pixelSize / 2);

        ctx.restore();
    }

    renderUpper(ctx: CanvasRenderingContext2D) {
        ctx.save();

        ctx.scale(this.scale, this.scale);
        ctx.drawImage(this.upperCanvas, -this.pixelSize / 2, -this.pixelSize / 2);

        ctx.restore();
    }

    dataAtWorldPos = (pos: Vec2) => {
        const dataX = Math.floor((pos.x + this.size / 2) / this.scale);
        const dataY = Math.floor((pos.y + this.size / 2) / this.scale);

        if (dataX < 0 || dataX >= this.pixelSize || dataY < 0 || dataY >= this.pixelSize) {
            return 10;
        }

        return this.data[dataX][dataY];
    };
}

export default Map;
