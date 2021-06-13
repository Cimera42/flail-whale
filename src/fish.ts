import Vec2 from './Utilities/vectors';

class Fish {
    public position: Vec2;
    public velocity: Vec2;

    public angle: number;

    public fat: number;
    public long: number;
    public speed: number;

    constructor(x: number, y: number) {
        this.position = new Vec2(x, y);
        this.velocity = new Vec2(0, 0);

        this.angle = Math.PI / 2;

        this.fat = 50;
        this.long = 100;
        this.speed = 10;
    }

    logic(inDelta: number) {
        this.angle += 0.1 * inDelta;

        const dir = Vec2.vecOfAngle(this.angle);
        this.velocity.add(Vec2.multiplyVec(dir, this.speed * inDelta));
        const deltaVel = Vec2.multiplyVec(this.velocity, inDelta);

        this.position.add(deltaVel);
        this.velocity.multiply(1 - 0.1 * inDelta);
    }

    render(ctx: CanvasRenderingContext2D) {
        const skew = 0.75;

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = 'darkblue';
        ctx.beginPath();
        ctx.moveTo(-this.long * skew, 0);
        ctx.quadraticCurveTo(this.long * 0.25 * skew, this.fat, this.long * 0.25, 0);
        ctx.quadraticCurveTo(this.long * 0.25 * skew, -this.fat, -this.long * 0.75, 0);
        ctx.fill();

        ctx.restore();
    }
}

export default Fish;
