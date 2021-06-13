import Harpoon from './harpoon';
import Vec2 from './Utilities/vectors';

class Player {
    public position: Vec2;
    public velocity: Vec2;

    public angle: number;
    public charging: boolean;
    public chargingTime: number;

    public dead: boolean;

    constructor(x: number, y: number, angle: number) {
        this.position = new Vec2(x, y);
        this.velocity = new Vec2(0, 0);

        this.angle = angle;

        this.charging = false;
        this.chargingTime = 0;

        this.dead = false;
    }

    logic(inDelta: number) {
        if (!this.dead) {
            const deltaVel = Vec2.multiplyVec(this.velocity, inDelta);

            this.position.add(deltaVel);
            this.velocity.multiply(1 - 0.1 * inDelta);

            if (this.charging) {
                this.chargingTime += inDelta;
            }
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'white';

        const size = 30;
        ctx.save();
        ctx.translate(this.position.x, this.position.y);

        if (!this.dead) {
            ctx.rotate(this.angle);

            ctx.beginPath();
            ctx.moveTo(-size / 2, size / 2);
            ctx.lineTo(-size / 2, -size / 2);
            ctx.lineTo(size / 2, -size / 2);
            ctx.quadraticCurveTo(size, -size / 2, size * 1.5, 0);
            ctx.quadraticCurveTo(size, size / 2, size / 2, size / 2);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 4;
            ctx.stroke();
        } else {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 8;
            const s = 20;

            ctx.beginPath();
            ctx.moveTo(-s, -s);
            ctx.lineTo(s, s);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-s, s);
            ctx.lineTo(s, -s);
            ctx.stroke();
        }

        ctx.restore();
    }
}

export default Player;
