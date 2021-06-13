import Harpoon from './harpoon';
import Vec2 from './Utilities/vectors';

class Player {
    public position: Vec2;
    public velocity: Vec2;

    public angle: number;
    public charging: boolean;
    public chargingTime: number;

    constructor() {
        this.position = new Vec2(0, 0);
        this.velocity = new Vec2(0, 0);

        this.angle = 0;

        this.charging = false;
        this.chargingTime = 0;
    }

    logic(inDelta: number) {
        const deltaVel = Vec2.multiplyVec(this.velocity, inDelta);

        this.position.add(deltaVel);
        this.velocity.multiply(1 - 0.1 * inDelta);

        if (this.charging) {
            this.chargingTime += inDelta;
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'white';

        const size = 30;
        ctx.save();
        ctx.rotate(this.angle);

        ctx.beginPath();
        ctx.rect(-size / 2, -size / 2, size, size);
        ctx.moveTo(size / 2, -size / 2);
        ctx.quadraticCurveTo(size, -size / 2, size * 1.5, 0);
        ctx.quadraticCurveTo(size, size / 2, size / 2, size / 2);
        ctx.fill();

        ctx.restore();
    }
}

export default Player;
