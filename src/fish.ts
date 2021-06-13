import Harpoon from './harpoon';
import Map from './map';
import {clamp} from './Utilities/maths';
import Vec2 from './Utilities/vectors';

class Fish {
    public position: Vec2;
    public velocity: Vec2;

    public angle: number;

    public fat: number;
    public long: number;
    public speed: number;
    public fearSpeed: number;

    public health: number;
    public maxHealth: number;

    map: Map;
    harpoon: Harpoon;

    constructor(x: number, y: number, map: Map, harpoon: Harpoon) {
        this.position = new Vec2(x, y);
        this.velocity = new Vec2(0, 0);

        this.angle = Math.PI * 1.6;

        this.fat = 50;
        this.long = 100;
        this.speed = 3;
        this.fearSpeed = 10;

        this.health = 120000;
        this.maxHealth = this.health;

        this.map = map;
        this.harpoon = harpoon;
    }

    logic(inDelta: number) {
        const dir = Vec2.vecOfAngle(this.angle);
        const lookDist = 200;

        const shortFrontLookDir = Vec2.multiplyVec(dir, lookDist);
        const longFrontLookDir = Vec2.multiplyVec(dir, lookDist * 2);

        const shortRightLookDir = Vec2.multiplyVec(
            Vec2.vecOfAngle(this.angle + Math.PI * 0.15),
            lookDist
        );
        const longRightLookDir = Vec2.multiplyVec(
            Vec2.vecOfAngle(this.angle + Math.PI * 0.15),
            lookDist * 2
        );
        const shortLeftLookDir = Vec2.multiplyVec(
            Vec2.vecOfAngle(this.angle - Math.PI * 0.15),
            lookDist
        );
        const longLeftLookDir = Vec2.multiplyVec(
            Vec2.vecOfAngle(this.angle - Math.PI * 0.15),
            lookDist * 2
        );

        const shortFrontD = this.map.dataAtWorldPos(Vec2.addVec(this.position, shortFrontLookDir));
        const longFrontD = this.map.dataAtWorldPos(Vec2.addVec(this.position, longFrontLookDir));

        const shortRightD = this.map.dataAtWorldPos(Vec2.addVec(this.position, shortRightLookDir));
        const longRightD = this.map.dataAtWorldPos(Vec2.addVec(this.position, longRightLookDir));

        const shortLeftD = this.map.dataAtWorldPos(Vec2.addVec(this.position, shortLeftLookDir));
        const longLeftD = this.map.dataAtWorldPos(Vec2.addVec(this.position, longLeftLookDir));

        if (shortLeftD > 0.7) {
            this.angle += (shortLeftD / 0.7) * inDelta;
        } else if (shortRightD > 0.7) {
            this.angle -= (shortRightD / 0.7) * inDelta;
        } else {
            this.angle += (shortLeftD - shortRightD) * 0.5 * inDelta;
        }

        if (longLeftD) {
            this.angle += (longLeftD / 0.7) * 0.25 * inDelta;
        }
        if (longRightD) {
            this.angle -= (longRightD / 0.7) * 0.25 * inDelta;
        }

        const speed = this.harpoon.attachedTo ? this.fearSpeed : this.speed;

        if (shortFrontD > 0.7) {
            this.velocity.add(Vec2.multiplyVec(dir, -speed * inDelta));
        } else if (longFrontD > 0.7 && longFrontD !== 10) {
            this.velocity.add(Vec2.multiplyVec(dir, -speed * 0.1 * inDelta));
        } else {
            this.velocity.add(Vec2.multiplyVec(dir, speed * inDelta));
        }
        const deltaVel = Vec2.multiplyVec(this.velocity, inDelta);

        this.position.add(deltaVel);
        this.velocity.multiply(1 - 0.1 * inDelta);

        if (Number.isNaN(this.position.x) || Number.isNaN(this.velocity.x)) {
            console.log(this.position.toString(), this.velocity.toString());
        }

        this.position.x = clamp(this.position.x, -this.map.size / 2, this.map.size / 2);
        this.position.y = clamp(this.position.y, -this.map.size / 2, this.map.size / 2);
    }

    render(ctx: CanvasRenderingContext2D) {
        const skew = 0.75;

        ctx.save();
        ctx.translate(this.position.x, this.position.y);

        if (this.health > 0) {
            ctx.save();
            ctx.rotate(this.angle);

            ctx.fillStyle = 'darkblue';
            ctx.beginPath();
            ctx.moveTo(-this.long * skew, 0);
            ctx.quadraticCurveTo(this.long * 0.25 * skew, this.fat, this.long * 0.25, 0);
            ctx.quadraticCurveTo(this.long * 0.25 * skew, -this.fat, -this.long * 0.75, 0);
            ctx.fill();
            ctx.restore();

            ctx.font = '18px Helvetica';
            ctx.fillStyle = 'black';
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            const healthText = `Health: ${Math.ceil((this.health / this.maxHealth) * 100)}%`;
            const healthMeasured = ctx.measureText(healthText);
            ctx.strokeText(healthText, -healthMeasured.width / 2, this.long / 2 + 4);
            ctx.fillText(healthText, -healthMeasured.width / 2, this.long / 2 + 4);
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

export default Fish;
